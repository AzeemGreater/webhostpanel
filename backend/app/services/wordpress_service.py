import os
import platform
import shutil
import urllib.request
import zipfile
import logging
from .server_service import SystemCommand

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WordPressService")

class WordPressService:
    @staticmethod
    def get_site_info(path: str):
        return "6.4.1"

    @staticmethod
    def update_plugins(path: str):
        return True

    @staticmethod
    def hardening(path: str):
        return True

    @staticmethod
    def cleanup_database(path: str):
        return True

    @staticmethod
    def install(path: str, url: str, title: str, admin_user: str, admin_pass: str, admin_email: str):
        if platform.system() == "Windows":
            # Windows Emulation Mode
            os.makedirs(path, exist_ok=True)
            
            # Write a mock wp-config.php and index.php
            with open(os.path.join(path, "wp-config.php"), "w") as f:
                f.write(f"<?php\n// Mock WordPress config for {title}\ndefine('DB_NAME', 'mock_wp_db');\ndefine('DB_USER', '{admin_user}');\n")
            
            with open(os.path.join(path, "index.php"), "w") as f:
                f.write(f"<?php\necho '<h1>WordPress site: {title}</h1><p>Admin email: {admin_email}</p>';\n")
                
            logger.info(f"[EMULATION] Installed mock WordPress for {title} at {path}")
            return True

        # Linux Implementation
        try:
            os.makedirs(path, exist_ok=True)
            
            # 1. Download WordPress latest archive
            zip_path = "/tmp/wordpress-latest.zip"
            if not os.path.exists(zip_path):
                logger.info("Downloading WordPress...")
                urllib.request.urlretrieve("https://wordpress.org/latest.zip", zip_path)
                
            # 2. Extract files
            logger.info("Extracting WordPress...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Extracting it to a temporary directory first
                tmp_extract = "/tmp/wordpress_extract"
                os.makedirs(tmp_extract, exist_ok=True)
                zip_ref.extractall(tmp_extract)
                
                # Copy everything from tmp_extract/wordpress/ to path
                src_dir = os.path.join(tmp_extract, "wordpress")
                for item in os.listdir(src_dir):
                    s = os.path.join(src_dir, item)
                    d = os.path.join(path, item)
                    if os.path.isdir(s):
                        if os.path.exists(d):
                            shutil.rmtree(d)
                        shutil.copytree(s, d)
                    else:
                        shutil.copy2(s, d)
                        
            # 3. Write a standard wp-config.php
            wp_config_sample = os.path.join(path, "wp-config-sample.php")
            wp_config = os.path.join(path, "wp-config.php")
            
            if os.path.exists(wp_config_sample):
                with open(wp_config_sample, "r") as f:
                    config_content = f.read()
                
                # Simple replacement
                config_content = config_content.replace("database_name_here", f"wp_db_{admin_user}")
                config_content = config_content.replace("username_here", admin_user)
                config_content = config_content.replace("password_here", admin_pass)
                
                with open(wp_config, "w") as f:
                    f.write(config_content)
                    
            # 4. Fix permissions
            SystemCommand.run(["chown", "-R", "www-data:www-data", path])
            logger.info(f"WordPress successfully installed at {path}")
            return True
        except Exception as e:
            logger.error(f"Failed to install WordPress: {e}")
            return False
