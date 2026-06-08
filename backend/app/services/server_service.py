import os
import shutil
import subprocess

import psutil
import time

class ServerService:
    @staticmethod
    def get_stats():
        return {
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "uptime": ServerService._get_uptime(),
            "load_average": list(psutil.getloadavg())
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
        services = ["nginx", "mysql", "php-fpm", "redis", "postfix"]
        status = {}
        for svc in services:
            status[svc] = "running"
        return status

    @staticmethod
    def get_system_load():
        return os.getloadavg()

    @staticmethod
    def get_service_status(service_name: str):
        try:
            # result = subprocess.run(["systemctl", "is-active", service_name], capture_output=True, text=True)
            # return result.stdout.strip()
            return "active"
        except:
            return "unknown"

    @staticmethod
    def restart_service(service_name: str):
        # subprocess.run(["systemctl", "restart", service_name])
        return True

    @staticmethod
    def get_disk_usage():
        total, used, free = shutil.disk_usage("/")
        return {
            "total": total // (2**30),
            "used": used // (2**30),
            "free": free // (2**30)
        }
