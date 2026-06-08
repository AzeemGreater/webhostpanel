# 🚀 WebHostPanel - Modern WordPress Web Hosting Control Panel

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20TS-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20%7C%20MD3-38B2AC.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Infrastructure-Docker-2496ED.svg?style=flat&logo=docker)](https://www.docker.com)

WebHostPanel is a production-ready, full-stack hosting panel engineered specifically for WordPress applications. Built on **Google Material Design 3** aesthetics, it delivers real-time diagnostic performance metrics, interactive terminal consoles, and complete server/domain provisioning tools that serve as a modern replacement for aaPanel, CyberPanel, and Hostinger hPanel.

---

## ✨ Key Feature Set

*   **📈 Server Diagnostics Dashboard**: Real-time WebSocket resource metrics collector showing overall CPU utilization, memory allocations, disk sectors, and network interfaces I/O.
*   **💻 Interactive Web Terminal**: Console emulator (`xterm.js`) mapping Unix interactive PTY processes directly to the web client.
*   **🌐 Site & PHP Manager**: Single-click Nginx configuration directories creation, Let's Encrypt SSL certificate provisioning, and interpreter swaps (PHP 8.0, 8.1, 8.2, 8.3).
*   **📦 WordPress Auto-Installer**: 1-Click WordPress core downloader, virtual MariaDB database config creation, admin registration, security permissions hardening, and DB optimizations.
*   **📁 Web File Manager**: Navigation trees, file edits using **Monaco Editor**, delete controls, and direct multi-part uploads.
*   **🛢️ Databases Administrator**: Add, list, and delete isolated database connections and users.
*   **📧 Virtual Postmaster System**: Provision mailbox accounts with storage quotas (in MB) mapped to active domains.
*   **📡 Nameserver Zones Management**: DNS zone file editor mapping custom A, CNAME, MX, TXT, and NS records with custom TTLs.
*   **🛡️ System Firewall (UFW)**: Command rule ports configurations to allow/deny access.
*   **💾 Snapshots Backup System**: Create local compressed archives (`tar.gz`) of website roots and databases, with one-click restoration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Zustand, Recharts, Monaco Editor, Xterm.js |
| **Backend** | Python FastAPI, SQLAlchemy, Uvicorn, psutil, websockets, passlib |
| **Daemons** | Nginx, MariaDB, Postfix, Dovecot, Pure-FTPd, BIND9, UFW |
| **Deployment** | Docker Compose / Native Bash Installer |

---

## 🚀 One-Line VPS Installation

To deploy WebHostPanel on a clean **Ubuntu 22.04 / 24.04 LTS** virtual private server:

```bash
curl -sSL https://raw.githubusercontent.com/AzeemGreater/webhostpanel/main/scripts/install.sh | bash
```

Once installed, the terminal prints your access details:
```
==================================================
 WebHostPanel Installation Successful!
==================================================
 Panel Access URL:  http://<your-vps-ip>:8080
 Username:          admin
 Panel Password:    z9T3eQ4 (Generated)
 MariaDB root Pass: z9T3eQ4 (Same password)
==================================================
```

---

## 🐳 Docker Local Setup (Development)

For local development and testing, run the services inside Docker:

1.  **Start Containers**:
    ```bash
    docker-compose up -d --build
    ```
2.  **Access Panel**:
    - Web Interface: `http://localhost:3000`
    - Swagger API docs: `http://localhost:8000/docs`

---

## 📚 Advanced Documentation

For instructions on configuring virtual folders, SMTP setups, DNS zone maps, and troubleshooting log files, check the full [USER_MANUAL.md](USER_MANUAL.md) file.
