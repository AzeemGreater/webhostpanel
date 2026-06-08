import subprocess
import platform
import logging
from .server_service import SystemCommand

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FtpService")

class FtpService:
    @staticmethod
    def create_ftp_account(username: str, password_hash: str, doc_root: str):
        if platform.system() == "Windows":
            logger.info(f"[EMULATION] Created FTP user {username} pointing to {doc_root}")
            return True

        # Linux: pure-pw approach
        try:
            # Command: pure-pw useradd username -u ftpuser -d /home/domain/public_html
            # For simplicity, we assume username mapping matches system group/user
            # We pass password to pure-pw via stdin
            cmd = ["pure-pw", "useradd", username, "-u", "www-data", "-d", doc_root]
            proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            # Write password twice (password and confirmation)
            out, err = proc.communicate(input=f"{password_hash}\n{password_hash}\n")
            
            # Rebuild database: pure-pw mkdb
            SystemCommand.run(["pure-pw", "mkdb"])
            return proc.returncode == 0
        except Exception as e:
            logger.error(f"Failed to create FTP account: {e}")
            return False

    @staticmethod
    def delete_ftp_account(username: str):
        if platform.system() == "Windows":
            logger.info(f"[EMULATION] Deleted FTP user {username}")
            return True

        try:
            SystemCommand.run(["pure-pw", "userdel", username])
            SystemCommand.run(["pure-pw", "mkdb"])
            return True
        except Exception as e:
            logger.error(f"Failed to delete FTP account: {e}")
            return False
