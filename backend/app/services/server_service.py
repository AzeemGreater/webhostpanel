import os
import platform
import shutil
import subprocess
import psutil
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SystemEmulation")

class SystemCommand:
    @staticmethod
    def run(command: list):
        if platform.system() == "Windows":
            logger.info(f"[EMULATION MODE - Windows] Would run: {' '.join(command)}")
            return True, "Emulated success"
        else:
            try:
                result = subprocess.run(command, capture_output=True, text=True, check=True)
                return True, result.stdout
            except subprocess.CalledProcessError as e:
                logger.error(f"Command failed: {e.stderr}")
                return False, e.stderr

class ServerService:
    @staticmethod
    def get_stats():
        return {
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "uptime": ServerService._get_uptime(),
            "load_average": getattr(psutil, "getloadavg", lambda: (0.0, 0.0, 0.0))()
        }

    @staticmethod
    def _get_uptime():
        uptime_seconds = time.time() - psutil.boot_time()
        days, remainder = divmod(uptime_seconds, 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{int(days)}d {int(hours)}h {int(minutes)}m"

    @staticmethod
    def get_services_status():
        services = ["lsws", "mysql", "redis", "postfix", "pure-ftpd"] # Updated to match CyberPanel
        status = {}
        for svc in services:
            status[svc] = ServerService.get_service_status(svc)
        return status

    @staticmethod
    def get_service_status(service_name: str):
        if platform.system() == "Windows":
            return "active"
        try:
            result = subprocess.run(["systemctl", "is-active", service_name], capture_output=True, text=True)
            return result.stdout.strip()
        except:
            return "unknown"

    @staticmethod
    def manage_service(service_name: str, action: str):
        if action not in ["start", "stop", "restart"]:
            return False, "Invalid action"
        success, out = SystemCommand.run(["systemctl", action, service_name])
        return success, out

    @staticmethod
    def reboot_server():
        success, out = SystemCommand.run(["reboot"])
        return success, out

    @staticmethod
    def shutdown_server():
        success, out = SystemCommand.run(["shutdown", "-h", "now"])
        return success, out

    @staticmethod
    def clear_cache():
        if platform.system() == "Windows":
            redis_ok = ServerService._flush_redis()
            return True, f"Windows Emulation: System cache cleared. Redis flushed: {redis_ok}"
        
        try:
            subprocess.run(["sync"], check=True)
            # Writing to drop_caches requires sudo or root
            subprocess.run("echo 3 > /proc/sys/vm/drop_caches", shell=True, check=True)
            redis_ok = ServerService._flush_redis()
            return True, f"Caches cleared. Redis flushed: {redis_ok}"
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            redis_ok = ServerService._flush_redis()
            return False, f"Failed to clear system cache: {str(e)}. Redis flushed: {redis_ok}"

    @staticmethod
    def _flush_redis():
        try:
            import redis
            r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))
            r.flushall()
            return True
        except Exception as e:
            logger.error(f"Failed to flush Redis: {e}")
            return False

