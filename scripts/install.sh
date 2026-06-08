#!/bin/bash
# WebHostPanel One-Line Installer
# Target OS: Ubuntu 22.04/24.04 LTS
# Designed to be run directly via: curl -sSL https://raw.githubusercontent.com/AzeemGreater/webhostpanel/main/scripts/install.sh | bash

set -e

echo "Starting WebHostPanel Installation..."

# 1. Update System Packages
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=l
apt-get update && apt-get upgrade -y

# Pre-seed Postfix configuration to prevent interactive prompt during installation
echo "postfix postfix/mailname string localhost" | debconf-set-selections
echo "postfix postfix/main_mailer_type select 'Internet Site'" | debconf-set-selections

# 2. Install Daemons and System Dependencies
echo "Installing core dependencies..."
apt-get install -y nginx mariadb-server php-fpm php-mysql python3-pip python3-venv curl git unzip ufw bind9 postfix dovecot-imapd dovecot-pop3d redis-server pure-ftpd

# 3. Install Node.js (v20 LTS) & npm for building frontend
echo "Installing Node.js & npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 4. Clone or Copy Codebase to /usr/local/webhostpanel
echo "Setting up Panel codebase..."
mkdir -p /usr/local/webhostpanel
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Cloning codebase from GitHub..."
    rm -rf /tmp/webhostpanel_repo
    git clone https://github.com/AzeemGreater/webhostpanel.git /tmp/webhostpanel_repo
    cp -r /tmp/webhostpanel_repo/* /usr/local/webhostpanel/
    rm -rf /tmp/webhostpanel_repo
else
    echo "Copying codebase from local directory..."
    cp -r ./* /usr/local/webhostpanel/ 2>/dev/null || true
fi

# 5. Build Frontend React Application
echo "Installing frontend dependencies & building frontend..."
cd /usr/local/webhostpanel/frontend
npm install
npm run build

# 6. Setup Python Virtual Environment and Backend Dependencies
echo "Setting up Python virtual environment..."
cd /usr/local/webhostpanel
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r backend/requirements.txt

# 7. Configure Nginx Server Block (port 8080 with WebSocket support)
echo "Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/webhostpanel <<EOF
server {
    listen 8080;
    server_name _;

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        root /usr/local/webhostpanel/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/webhostpanel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# 8. Create Backend Systemd Service
echo "Creating systemd service for backend daemon..."
cat > /etc/systemd/system/webhostpanel-backend.service <<EOF
[Unit]
Description=WebHostPanel Backend Service
After=network.target mariadb.service redis-server.service

[Service]
User=root
WorkingDirectory=/usr/local/webhostpanel/backend
ExecStart=/usr/local/webhostpanel/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
Environment=PYTHONPATH=/usr/local/webhostpanel/backend

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable webhostpanel-backend
systemctl restart webhostpanel-backend

# 9. Start and Enable System Services
echo "Starting dependent services..."
systemctl enable mariadb redis-server pure-ftpd bind9 postfix dovecot
systemctl restart mariadb redis-server pure-ftpd bind9 postfix dovecot

# 10. Install WP-CLI globally
echo "Installing WP-CLI..."
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
mv wp-cli.phar /usr/local/bin/wp

# 11. Initialize Admin Credentials and Retrieve IP
echo "Initializing admin credentials..."
IP_ADDR=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org || echo "your-server-ip")
cd /usr/local/webhostpanel/backend
ADMIN_OUT=$(/usr/local/webhostpanel/venv/bin/python3 ../scripts/init_admin.py 2>/dev/null || echo "ERROR")

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

# Configure MariaDB root password to be the same as the panel admin password
echo "Securing MariaDB with the same password..."
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('$ADMIN_PASS'); FLUSH PRIVILEGES;" || true

# Write /root/.my.cnf so commands run without prompting for the password
cat > /root/.my.cnf <<EOF
[client]
user=root
password=$ADMIN_PASS
EOF
chmod 600 /root/.my.cnf

echo ""
echo "=================================================="
echo " WebHostPanel Installation Successful!"
echo "=================================================="
echo " Panel Access URL:  http://$IP_ADDR:8080"
echo " Username:          $ADMIN_USER"
echo " Panel Password:    $ADMIN_PASS"
echo " MariaDB root Pass: $ADMIN_PASS (Same password)"
echo "=================================================="
echo ""
