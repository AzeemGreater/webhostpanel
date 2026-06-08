#!/bin/bash
# WebHostPanel Uninstaller
# Target OS: Ubuntu 22.04/24.04 LTS

set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root."
  exit 1
fi

echo "Starting WebHostPanel Uninstallation..."

# 1. Stop and disable backend daemon
if systemctl is-active --quiet webhostpanel-backend; then
    echo "Stopping WebHostPanel Backend Service..."
    systemctl stop webhostpanel-backend
fi
if systemctl is-enabled --quiet webhostpanel-backend; then
    echo "Disabling WebHostPanel Backend Service..."
    systemctl disable webhostpanel-backend
fi

# Remove systemd service file
if [ -f /etc/systemd/system/webhostpanel-backend.service ]; then
    echo "Removing Systemd Service file..."
    rm -f /etc/systemd/system/webhostpanel-backend.service
    systemctl daemon-reload
fi

# 2. Remove Nginx Site configuration
echo "Removing Nginx configuration..."
rm -f /etc/nginx/sites-enabled/webhostpanel
rm -f /etc/nginx/sites-available/webhostpanel

# Restore Nginx default site if it exists in sites-available
if [ -f /etc/nginx/sites-available/default ] && [ ! -f /etc/nginx/sites-enabled/default ]; then
    echo "Restoring default Nginx configuration..."
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
fi

systemctl restart nginx

# 3. Remove Application Directories
if [ -d /usr/local/webhostpanel ]; then
    echo "Removing /usr/local/webhostpanel..."
    rm -rf /usr/local/webhostpanel
fi

# 4. Remove Database credentials file
if [ -f /root/.my.cnf ]; then
    echo "Removing /root/.my.cnf..."
    rm -f /root/.my.cnf
fi

echo "=================================================="
echo " WebHostPanel successfully uninstalled!"
echo "=================================================="
