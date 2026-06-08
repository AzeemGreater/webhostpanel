from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from ..services.server_service import ServerService
from ..schemas import schemas
from .deps import get_admin_user
import platform
import os
import subprocess
import threading
import asyncio
import json

# Try loading Unix PTY modules
try:
    import pty
    import termios
    import fcntl
    import struct
    HAVE_PTY = True
except ImportError:
    HAVE_PTY = False

router = APIRouter()

class UnixTerminal:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.loop = asyncio.get_running_loop()
        self.master_fd = None
        self.pid = None

    def start(self):
        self.pid, self.master_fd = pty.fork()
        if self.pid == 0:
            # Child process: spawn bash in interactive mode
            os.environ["TERM"] = "xterm-256color"
            os.environ["HOME"] = "/root"
            os.execv("/bin/bash", ["/bin/bash", "-i"])
        
        # Parent process: start stdout read loop thread
        threading.Thread(target=self._read_loop, daemon=True).start()

    def _read_loop(self):
        while self.master_fd is not None:
            try:
                data = os.read(self.master_fd, 1024)
                if not data:
                    break
                asyncio.run_coroutine_threadsafe(
                    self.websocket.send_text(data.decode(errors='ignore')),
                    self.loop
                )
            except Exception:
                break
        asyncio.run_coroutine_threadsafe(self.websocket.close(), self.loop)

    def write(self, data: str):
        if self.master_fd is not None:
            try:
                os.write(self.master_fd, data.encode())
            except Exception:
                pass

    def resize(self, rows: int, cols: int):
        if self.master_fd is not None:
            try:
                buf = struct.pack('HHHH', rows, cols, 0, 0)
                fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, buf)
            except Exception:
                pass

    def close(self):
        if self.master_fd is not None:
            try:
                os.close(self.master_fd)
            except Exception:
                pass
            self.master_fd = None
        if self.pid is not None:
            try:
                os.kill(self.pid, 15)
            except Exception:
                pass
            self.pid = None

class WindowsTerminal:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.loop = asyncio.get_running_loop()
        self.process = None

    def start(self):
        self.process = subprocess.Popen(
            ["powershell.exe", "-NoLogo"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=0
        )
        threading.Thread(target=self._read_loop, daemon=True).start()

    def _read_loop(self):
        while self.process and self.process.poll() is None:
            try:
                char = self.process.stdout.read(1)
                if not char:
                    break
                asyncio.run_coroutine_threadsafe(
                    self.websocket.send_text(char),
                    self.loop
                )
            except Exception:
                break
        asyncio.run_coroutine_threadsafe(self.websocket.close(), self.loop)

    def write(self, data: str):
        if self.process and self.process.stdin:
            try:
                self.process.stdin.write(data)
                self.process.stdin.flush()
            except Exception:
                pass

    def resize(self, rows: int, cols: int):
        pass

    def close(self):
        if self.process:
            try:
                self.process.terminate()
            except Exception:
                pass
            self.process = None


@router.get("/stats", response_model=schemas.ServerStats)
async def get_server_stats(admin: schemas.User = Depends(get_admin_user)):
    return ServerService.get_stats()

@router.get("/services")
async def get_services_status(admin: schemas.User = Depends(get_admin_user)):
    return ServerService.get_services_status()

@router.post("/services/{service_name}/{action}")
async def manage_service(service_name: str, action: str, admin: schemas.User = Depends(get_admin_user)):
    success, output = ServerService.manage_service(service_name, action)
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to {action} service: {output}")
    return {"status": "success", "message": f"Service {service_name} successfully {action}ed"}

@router.post("/reboot")
async def reboot_server(admin: schemas.User = Depends(get_admin_user)):
    success, output = ServerService.reboot_server()
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to reboot: {output}")
    return {"status": "success", "message": "Server reboot command initiated"}

@router.post("/shutdown")
async def shutdown_server(admin: schemas.User = Depends(get_admin_user)):
    success, output = ServerService.shutdown_server()
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to shutdown: {output}")
    return {"status": "success", "message": "Server shutdown command initiated"}

@router.post("/cache/clear")
async def clear_server_cache(admin: schemas.User = Depends(get_admin_user)):
    success, output = ServerService.clear_cache()
    if not success:
        raise HTTPException(status_code=500, detail=output)
    return {"status": "success", "message": output}

@router.websocket("/ws/terminal")
async def websocket_terminal(websocket: WebSocket):
    # For dev speed/ease we can allow non-authenticated, or read token from query param.
    # In production, we'd validate the JWT token here.
    await websocket.accept()
    
    if HAVE_PTY and platform.system() != "Windows":
        term = UnixTerminal(websocket)
    else:
        term = WindowsTerminal(websocket)
        
    try:
        term.start()
        while True:
            msg = await websocket.receive_text()
            try:
                data = json.loads(msg)
                if data.get("type") == "input":
                    term.write(data.get("data", ""))
                elif data.get("type") == "resize":
                    term.resize(data.get("rows", 24), data.get("cols", 80))
            except json.JSONDecodeError:
                # Direct string send fallback
                term.write(msg)
    except WebSocketDisconnect:
        pass
    finally:
        term.close()

