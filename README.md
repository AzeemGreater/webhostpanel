# WebHostPanel

A modern, feature-rich web hosting control panel for managing WordPress websites and server infrastructure, inspired by Hostinger's hPanel.

## Features

- **Dashboard**: Real-time server resource monitoring, website cards, quick actions.
- **Server Management**: Service control, firewall, SSH keys, cron jobs, system updates.
- **Website Management**: PHP versioning (7.4-8.3), Nginx optimized configs, cloning, subdomains.
- **WordPress Toolkit**: One-click install, staging, bulk updates, security hardening, performance optimization.
- **Database Management**: MySQL/MariaDB operations, user management, phpMyAdmin integration.
- **Email System**: Postfix/Dovecot, Roundcube webmail, SPF/DKIM/DMARC, spam protection.
- **DNS Management**: Full zone editor, DNSSEC, templates.
- **SSL/TLS**: Let's Encrypt integration, auto-renewal, custom certificates.
- **File Manager**: Web-based manager with Monaco Editor.
- **Backup & Recovery**: Scheduled backups to S3, FTP, Local.
- **Security**: WAF (ModSecurity), Malware scanning (ClamAV), 2FA.
- **Developer Tools**: Web SSH, Git integration, WP-CLI, Composer, Node.js/Python support.

## Technology Stack

- **Frontend**: React 18, TypeScript, Shadcn UI, Zustand, Recharts, Socket.io.
- **Backend**: Python FastAPI, PostgreSQL, Redis, RabbitMQ.
- **Web Server**: Nginx.
- **Containers**: Docker.

## Installation

```bash
curl -sSL https://raw.githubusercontent.com/AzeemGreater/webhostpanel/main/scripts/install.sh | bash
```

## License

MIT
