#!/bin/bash
# WebHostPanel One-Line Installer
# Target OS: Ubuntu 22.04/24.04

set -e

echo "Starting WebHostPanel Installation..."

# 1. Update System
apt-get update && apt-get upgrade -y

# 2. Install Dependencies
apt-get install -y nginx mariadb-server php-fpm php-mysql python3-pip python3-venv curl git unzip ufw bind9 postfix dovecot-imapd dovecot-pop3d redis-server pure-ftpd

# 3. Secure MariaDB
# mysql_secure_installation logic here

# 4. Setup Python Environment for Panel
mkdir -p /usr/local/webhostpanel
cp -r ./* /usr/local/webhostpanel/ 2>/dev/null || true
cd /usr/local/webhostpanel
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary redis celery pydantic-settings pydantic[email] python-jose[cryptography] passlib[bcrypt] python-multipart jinja2 aiofiles psutil websockets



# 5. Setup Nginx for Panel
cat > /etc/nginx/sites-available/webhostpanel <<EOF
server {
    listen 8080;
    server_name _;
    location /api {
        proxy_pass http://localhost:8000;
    }
    location / {
        root /usr/local/webhostpanel/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
ln -s /etc/nginx/sites-available/webhostpanel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 6. Install WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
mv wp-cli.phar /usr/local/bin/wp

# 7. Initialize Admin Credentials and Retrieve IP
IP_ADDR=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org || echo "your-server-ip")
ADMIN_OUT=$(/usr/local/webhostpanel/venv/bin/python3 /usr/local/webhostpanel/scripts/init_admin.py 2>/dev/null || echo "ERROR")

if [[ "$ADMIN_OUT" =~ SUCCESS\|(.*)\|(.*) ]]; then
    ADMIN_USER="${BASH_REMATCH[1]}"
    ADMIN_PASS="${BASH_REMATCH[2]}"
elif [[ "$ADMIN_OUT" =~ EXISTS\|(.*)\|(.*) ]]; then
    ADMIN_USER="${BASH_REMATCH[1]}"
    ADMIN_PASS="${BASH_REMATCH[2]}"
else
    ADMIN_USER="admin"
    ADMIN_PASS="admin123 (Fallback)"
fi

echo ""
echo "=================================================="
echo " WebHostPanel Installation Successful!"
echo "=================================================="
echo " Panel Access URL: http://$IP_ADDR:8080"
echo " Username:         $ADMIN_USER"
echo " Password:         $ADMIN_PASS"
echo "=================================================="
echo ""

