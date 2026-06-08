import asyncio
import psutil
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import models
from typing import Dict, Any

router = APIRouter()

async def get_system_stats() -> Dict[str, Any]:
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_per_core = psutil.cpu_percent(interval=None, percpu=True)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    net_io = psutil.net_io_counters()

    return {
        "cpu": {
            "overall": cpu_percent,
            "cores": cpu_per_core,
            "count": psutil.cpu_count()
        },
        "memory": {
            "total": memory.total,
            "used": memory.used,
            "percent": memory.percent,
            "free": memory.available
        },
        "disk": {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent
        },
        "network": {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv
        }
    }

@router.get("/stats")
async def get_stats():
    return await get_system_stats()

@router.websocket("/ws/stats")
async def websocket_stats(websocket: WebSocket):
    await websocket.accept()
    try:
        # Initialize psutil cpu tracking
        psutil.cpu_percent(interval=None)
        psutil.cpu_percent(interval=None, percpu=True)
        
        while True:
            stats = await get_system_stats()
            await websocket.send_json(stats)
            await asyncio.sleep(1) # Send update every 1 second
    except WebSocketDisconnect:
        pass

@router.get("/summary")
async def get_system_summary(db: Session = Depends(get_db)):
    web_count = db.query(models.Website).count()
    db_count = db.query(models.Database).count()
    email_count = db.query(models.EmailAccount).count()
    return {
        "websites": web_count,
        "databases": db_count,
        "emails": email_count
    }

