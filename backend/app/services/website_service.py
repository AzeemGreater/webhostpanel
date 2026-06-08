import os
import platform
import shutil
import logging
import subprocess
from .server_service import SystemCommand

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WebsiteService")

class WebsiteService:
    @staticmethod
    def create_vhost(domain: str, php_version: str):
        if platform.system() == "Windows":
            # Windows Emulation Mode
            home_dir = f"C:/Users/Greater/temp_home/{domain}"
            web_root = f"{home_dir}/public_html"
            os.makedirs(web_root, exist_ok=True)
            
            # Write index.html
            index_path = f"{web_root}/index.html"
            with open(index_path, "w") as f:
                f.write(f"<h1>Welcome to {domain}!</h1><p>Running PHP {php_version}</p>")
                
            # Write mock nginx conf
            conf_path = f"{home_dir}/nginx.conf"
            with open(conf_path, "w") as f:
                f.write(WebsiteService.get_nginx_template(domain, php_version))
                
            logger.info(f"[EMULATION] Created directories and config files for {domain} inside C:/Users/Greater/temp_home")
            return True

        # Linux Implementation
        web_root = f"/home/{domain}/public_html"
        try:
            # 1. Create directory structure
            os.makedirs(web_root, exist_ok=True)
            
            # Create default index.html
            index_path = f"{web_root}/index.html"
            if not os.path.exists(index_path):
                with open(index_path, "w") as f:
                    f.write(f"<h1>Welcome to {domain}!</h1><p>Running PHP {php_version}</p>")
            
            # 2. Write Nginx Config
            nginx_available = f"/etc/nginx/sites-available/{domain}"
            nginx_enabled = f"/etc/nginx/sites-enabled/{domain}"
            
            os.makedirs("/etc/nginx/sites-available", exist_ok=True)
            os.makedirs("/etc/nginx/sites-enabled", exist_ok=True)
            
            with open(nginx_available, "w") as f:
                f.write(WebsiteService.get_nginx_template(domain, php_version))
                
            # Create symlink
            if not os.path.exists(nginx_enabled):
                os.symlink(nginx_available, nginx_enabled)
                
            # Set permissions
            SystemCommand.run(["chown", "-R", "www-data:www-data", f"/home/{domain}"])
            SystemCommand.run(["chmod", "-R", "755", f"/home/{domain}"])
            
            # Restart Nginx
            SystemCommand.run(["systemctl", "reload", "nginx"])
            return True
        except Exception as e:
            logger.error(f"Error setting up website {domain}: {e}")
            return False

    @staticmethod
    def delete_vhost(domain: str):
        if platform.system() == "Windows":
            home_dir = f"C:/Users/Greater/temp_home/{domain}"
            if os.path.exists(home_dir):
                shutil.rmtree(home_dir)
            logger.info(f"[EMULATION] Deleted files for {domain}")
            return True

        # Linux Implementation
        try:
            home_dir = f"/home/{domain}"
            if os.path.exists(home_dir):
                shutil.rmtree(home_dir)
                
            nginx_available = f"/etc/nginx/sites-available/{domain}"
            nginx_enabled = f"/etc/nginx/sites-enabled/{domain}"
            
            if os.path.exists(nginx_enabled):
                os.remove(nginx_enabled)
            if os.path.exists(nginx_available):
                os.remove(nginx_available)
                
            SystemCommand.run(["systemctl", "reload", "nginx"])
            return True
        except Exception as e:
            logger.error(f"Error deleting website {domain}: {e}")
            return False

    @staticmethod
    def change_php_version(domain: str, new_php: str):
        if platform.system() == "Windows":
            home_dir = f"C:/Users/Greater/temp_home/{domain}"
            conf_path = f"{home_dir}/nginx.conf"
            if os.path.exists(conf_path):
                with open(conf_path, "w") as f:
                    f.write(WebsiteService.get_nginx_template(domain, new_php))
            logger.info(f"[EMULATION] Updated PHP version to {new_php} for {domain}")
            return True

        try:
            nginx_available = f"/etc/nginx/sites-available/{domain}"
            with open(nginx_available, "w") as f:
                f.write(WebsiteService.get_nginx_template(domain, new_php))
                
            SystemCommand.run(["systemctl", "reload", "nginx"])
            return True
        except Exception as e:
            logger.error(f"Error changing PHP version for {domain}: {e}")
            return False

    @staticmethod
    def get_nginx_template(domain: str, php_version: str):
        return f"""server {{
    listen 80;
    server_name {domain} www.{domain};
    root /home/{domain}/public_html;
    index index.php index.html index.htm;

    location / {{
        try_files $uri $uri/ /index.php?$args;
    }}

    location ~ \\.php$ {{
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php{php_version}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }}
}}
"""
