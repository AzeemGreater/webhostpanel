import os
import subprocess
from jinja2 import Environment, FileSystemLoader

class WebsiteService:
    TEMPLATE_DIR = os.path.join(os.getcwd(), "templates/nginx")
    NGINX_SITES_AVAILABLE = "/etc/nginx/sites-available"
    NGINX_SITES_ENABLED = "/etc/nginx/sites-enabled"
    WWW_ROOT = "/var/www"

    def __init__(self):
        self.env = Environment(loader=FileSystemLoader(self.TEMPLATE_DIR))

    def setup_website(self, domain: str, php_version: str):
        config = self.generate_vhost_config(domain, php_version)
        
        vhost_path = os.path.join(self.NGINX_SITES_AVAILABLE, domain)
        enabled_path = os.path.join(self.NGINX_SITES_ENABLED, domain)
        web_root = os.path.join(self.WWW_ROOT, domain, "public_html")

        # 1. Create directory structure
        os.makedirs(web_root, exist_ok=True)
        # subprocess.run(["chown", "-R", "www-data:www-data", f"/var/www/{domain}"])

        # 2. Write Nginx config
        # with open(vhost_path, 'w') as f: f.write(config)
        
        # 3. Enable site
        # if not os.path.exists(enabled_path):
        #     os.symlink(vhost_path, enabled_path)
        
        # 4. Reload Nginx
        # subprocess.run(["nginx", "-s", "reload"])
        
        return True

    def generate_vhost_config(self, domain: str, php_version: str):
        template = self.env.get_template("vhost.conf.j2")
        return template.render(domain=domain, php_version=php_version)

    @staticmethod
    def clone_website(source_domain: str, target_domain: str):
        # Implementation for cloning
        pass
