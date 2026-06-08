import os
import tarfile
from datetime import datetime

class BackupService:
    BACKUP_DIR = "/var/backups/webhostpanel"

    @staticmethod
    def backup_website(domain: str):
        os.makedirs(BackupService.BACKUP_DIR, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{domain}_{timestamp}.tar.gz"
        filepath = os.path.join(BackupService.BACKUP_DIR, filename)
        
        web_root = f"/var/www/{domain}/public_html"
        
        if os.path.exists(web_root):
            with tarfile.open(filepath, "w:gz") as tar:
                tar.add(web_root, arcname=os.path.basename(web_root))
            return filepath
        return None

    @staticmethod
    def restore_website(filepath: str, domain: str):
        web_root = f"/var/www/{domain}/public_html"
        with tarfile.open(filepath, "r:gz") as tar:
            tar.extractall(path=f"/var/www/{domain}")
        return True
