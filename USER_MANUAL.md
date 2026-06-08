# WebHostPanel User Manual & Documentation Guide

Welcome to the **WebHostPanel** User Manual. WebHostPanel is a world-class, production-ready, full-stack web hosting control panel optimized for WordPress, featuring real-time diagnostics, system shell terminals, and complete site management operations.

---

## 📖 Table of Contents
1. [Architectural Overview](#1-architectural-overview)
2. [VPS Production Deployment](#2-vps-production-deployment)
3. [Admin Panel Dashboard Operations](#3-admin-panel-dashboard-operations)
4. [Services Control & Web Terminal](#4-services-control--web-terminal)
5. [Website & WordPress Management](#5-website--wordpress-management)
6. [File Manager & Database Management](#6-file-manager--database-management)
7. [Email & FTP Configuration](#7-email--ftp-configuration)
8. [DNS, SSL & Security Policies](#8-dns-ssl--security-policies)
9. [Backups Snapshot Archive](#9-backups-snapshot-archive)
10. [Troubleshooting & Log File Locations](#10-troubleshooting--log-file-locations)

---

## 1. Architectural Overview

WebHostPanel is split into an independent frontend single page application and a high-performance backend API service.

```
                  ┌──────────────────────────────┐
                  │      React 18 Frontend       │
                  │   TypeScript & Tailwind CSS  │
                  └──────────────┬───────────────┘
                                 │ HTTP / WebSockets
                  ┌──────────────▼───────────────┐
                  │      FastAPI Backend API     │
                  │        Python 3.11+          │
                  └──────┬───────────────┬───────┘
                         │               │
  ┌──────────────────────▼───────┐ ┌─────▼──────────────────────┐
  │      SQLite / Postgres       │ │      System Daemons        │
  │    (Metadata Storage DB)     │ │ (Nginx, Postfix, PureFTPd) │
  └──────────────────────────────┘ └────────────────────────────┘
```

- **Frontend Core Stack**: React 18, TypeScript, Tailwind CSS, Lucide icons, recharts (Area resource monitoring), xterm.js (terminal emulator), and Monaco Editor (code modifier).
- **Backend Core Stack**: Python FastAPI, SQLAlchemy, Uvicorn, psutil (diagnostic metrics collection), and Unix subprocess hooks (PTY shells, pure-pw, certbot, and ufw).

---

## 2. VPS Production Deployment

WebHostPanel is optimized to run on fresh, clean **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** nodes.

### Automated Installation Steps
1. SSH into your clean VPS as the `root` user.
2. Clone the repository to your server:
   ```bash
   git clone https://github.com/your-username/webhostpanel-main.git /usr/local/src/webhostpanel
   ```
3. Navigate to the installer directory and execute the setup script:
   ```bash
   cd /usr/local/src/webhostpanel
   chmod +x scripts/install.sh
   ./scripts/install.sh
   ```

### What the Installation Script Performs:
- Updates the system packages.
- Installs necessary daemons: `nginx`, `mariadb-server`, `php-fpm`, `redis-server`, `postfix`, `dovecot`, `pure-ftpd`, `bind9`, and `ufw`.
- Sets up an isolated Python Virtual Environment (`venv`) under `/usr/local/webhostpanel/venv`.
- Builds the React production package bundle.
- Configures Nginx to serve the Panel on port **`8080`**.
- Initializes the SQLite metadata database and registers the default `admin` profile with a randomly generated 7-character password.

At completion, the terminal will print:
```
==================================================
 WebHostPanel Installation Successful!
==================================================
 Panel Access URL: http://<your-vps-ip>:8080
 Username:         admin
 Password:         z9T3eQ4
==================================================
```

---

## 3. Admin Panel Dashboard Operations

When logging into `http://<your-vps-ip>:8080` for the first time:
- **Metrics Monitoring**: The dashboard automatically connects to a WebSocket server (`/api/system/ws/stats`) streaming real-time statistics for CPU usage, memory consumption, disk storage capacity, and network interface I/O speeds.
- **Active Resources summary**: Lists the total active count of websites, databases, and emails retrieved from the backend endpoints.

---

## 4. Services Control & Web Terminal

Navigate to **Server Status** in the sidebar:
- **System Services Daemon list**: Real-time status list of daemons (`lsws/nginx`, `mysql`, `redis`, `postfix`, `pure-ftpd`).
  - Use the micro-control icons to **Start**, **Stop**, or **Restart** individual services.
- **System actions**: Execute **Reboot Server**, **Shutdown Server**, or **Clear Cache & Temp Logs** (which drops system caches and flushes the Redis store). Safety confirmation alerts protect against accidental restarts.
- **Interactive Web Terminal Console**: Click **Connect Terminal** to launch a live command-line environment (`xterm.js`). On Linux, this hooks into `/bin/bash` via Unix PTY sockets; on Windows dev environments, it redirects pipes directly into PowerShell.

---

## 5. Website & WordPress Management

Navigate to **Websites**:
- **Deploy a Website**: Click **Create Website**, specify the domain name (e.g. `example.com`), select your preferred PHP engine version (8.0, 8.1, 8.2, 8.3), and click Create. This generates the document root at `/home/example.com/public_html`, writes Nginx vhost files, and reloads Nginx.
- **AutoSSL**: Provision and auto-renew Let's Encrypt certificates by mapping Let's Encrypt configurations.
- **PHP Version Swapping**: Modify active PHP interpreters dynamically from a simple dropdown menu.
- **WordPress Toolkit Wizard**:
  - Select your website and open **WP Toolkit**.
  - Fill in the **Site Title**, **Admin User**, **Password**, and **Email**.
  - The toolkit will fetch latest WordPress core archive, configure `wp-config.php`, bind the MariaDB connection, and setup the admin account.
  - Click **Hardening** to apply default security file permissions, or **Optimize DB** to optimize MySQL table rows.

---

## 6. File Manager & Database Management

### File Manager
Navigate to **File Manager**:
- **Directories navigation**: Click folders to walk directories. Use the path breadcrumbs at the top to jump back to parent roots.
- **File operations**: Upload files directly via browser, create folders/files, or delete items.
- **Monaco Code Editor**: Click any editable code file (PHP, JS, CSS, JSON, Conf) to open a full-screen IDE terminal. Make modifications and click **Save Changes** to commit writes directly to disk.

### Database Management
Navigate to **Databases**:
- **Manage database collections**: Lists active databases and user permissions.
- **Create DB**: Provision new MySQL databases, assign specific database usernames, and configure connection passwords.
- **Drop DB**: Drops MariaDB tables and database connections.

---

## 7. Email & FTP Configuration

### Emails
Navigate to **Emails**:
- **Mailbox Provisioning**: Select a domain name and input a prefix (e.g. `support` @ `example.com`).
- **Storage Limits**: Assign storage quotas (in MB).
- **Security features**: Creates virtual mailbox records for Postfix/Dovecot storage delivery.

### FTP Accounts
Navigate to **FTP Accounts**:
- **Virtual user mappings**: Create FTP connections mapped to website folders.
- **System Integration**: Sets up Pure-FTPd virtual directories (`pure-pw useradd`).

---

## 8. DNS, SSL & Security Policies

### DNS Zone Files
Navigate to **Settings** and click the **DNS Zones** tab:
- **Manage Zone maps**: Create zones mapping DNS records.
- **Record mapping forms**: Add `A`, `CNAME`, `MX`, `TXT`, and `NS` entries with custom TTLs and priority indicators.

### Firewall & Ports Security
Navigate to **Security Center**:
- **Firewall rules**: Lists active rules on the system UFW daemon.
- **Port adjustments**: Add port permission exceptions (e.g. adding port `8080` or `3306`) or delete inactive ports rules.

---

## 9. Backups Snapshot Archive

Navigate to **Settings** and click the **Backup Snapshots** tab:
- **Snapshot Creation**: Select a website and click **Create Backup**. This creates a compressed tarball archive of public folders (`tar.gz`) stored inside `/var/backups/webhostpanel`.
- **Restoration**: Click **Restore** next to any archive file. This extracts the archive back into the document root.

---

## 10. Troubleshooting & Log File Locations

If you encounter issues during installation or runtime, inspect these logs:

| Component | Log Path |
| :--- | :--- |
| **FastAPI Backend Server** | `/var/log/webhostpanel-backend.log` |
| **Nginx Access logs** | `/var/log/nginx/access.log` |
| **Nginx Error logs** | `/var/log/nginx/error.log` |
| **Website-specific logs** | `/var/log/nginx/<domain>.error.log` |
| **UFW Firewall Status** | `ufw status verbose` |
| **Postfix Mail logs** | `/var/log/mail.log` |
| **Pure-FTPd connections** | `/var/log/pure-ftpd/transfer.log` |
