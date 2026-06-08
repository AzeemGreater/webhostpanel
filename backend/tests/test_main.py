import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.models import models

# Set up an in-memory SQLite database for testing
from sqlalchemy.pool import StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Re-create tables
from app.models.models import User, Website, Database, EmailAccount, DnsZone, DnsRecord, ActivityLog, FtpAccount
Base.metadata.create_all(bind=engine)

# Dependency override
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Test Tokens cache
tokens = {}

def test_register_and_login():
    # 1. Register Admin User
    admin_reg = client.post("/api/auth/register", json={
        "email": "admin@panel.com",
        "password": "adminpassword",
        "role": "admin"
    })
    assert admin_reg.status_code == 200
    
    # 2. Login Admin
    admin_login = client.post("/api/auth/login", data={
        "username": "admin@panel.com",
        "password": "adminpassword"
    })
    assert admin_login.status_code == 200
    tokens["admin"] = admin_login.json()["access_token"]
    
    # 3. Register Regular User
    user_reg = client.post("/api/auth/register", json={
        "email": "user@panel.com",
        "password": "userpassword",
        "role": "user"
    })
    assert user_reg.status_code == 200
    
    # 4. Login User
    user_login = client.post("/api/auth/login", data={
        "username": "user@panel.com",
        "password": "userpassword"
    })
    assert user_login.status_code == 200
    tokens["user"] = user_login.json()["access_token"]

def test_websites_flow():
    headers = {"Authorization": f"Bearer {tokens['user']}"}
    
    # 1. Create Website
    res = client.post("/api/websites/", json={"domain": "test-domain.com", "php_version": "8.2"}, headers=headers)
    assert res.status_code == 200
    site_id = res.json()["id"]
    
    # 2. List Websites
    res = client.get("/api/websites/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    
    # 3. Change PHP version
    res = client.post(f"/api/websites/{site_id}/php?php_version=8.3", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    
    # 4. Toggle SSL
    res = client.post(f"/api/websites/{site_id}/ssl", headers=headers)
    assert res.status_code == 200
    assert res.json()["ssl_enabled"] is True

    # 5. Delete Website
    res = client.delete(f"/api/websites/{site_id}", headers=headers)
    assert res.status_code == 200

def test_databases_flow():
    headers = {"Authorization": f"Bearer {tokens['user']}"}
    
    # 1. Create DB
    res = client.post("/api/databases/", json={
        "name": "test_db",
        "db_user": "test_dbuser",
        "db_pass": "dbpass123!"
    }, headers=headers)
    assert res.status_code == 200
    db_id = res.json()["id"]
    
    # 2. List DBs
    res = client.get("/api/databases/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    
    # 3. Delete DB
    res = client.delete(f"/api/databases/{db_id}", headers=headers)
    assert res.status_code == 200

def test_ftp_flow():
    headers = {"Authorization": f"Bearer {tokens['user']}"}
    
    # 1. Create FTP Account
    res = client.post("/api/ftp/", json={
        "username": "ftp_user1",
        "password": "ftppassword",
        "doc_root": "/home/test-domain.com/public_html"
    }, headers=headers)
    assert res.status_code == 200
    ftp_id = res.json()["id"]
    
    # 2. List FTP Accounts
    res = client.get("/api/ftp/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    
    # 3. Delete FTP Account
    res = client.delete(f"/api/ftp/{ftp_id}", headers=headers)
    assert res.status_code == 200

def test_emails_flow():
    headers = {"Authorization": f"Bearer {tokens['user']}"}
    # Pre-requisite: Needs website registered to match domain validation
    client.post("/api/websites/", json={"domain": "maildomain.com", "php_version": "8.2"}, headers=headers)
    
    # 1. Create Email
    res = client.post("/api/emails/", json={
        "email": "contact@maildomain.com",
        "password": "emailpass123!",
        "quota_mb": 500
    }, headers=headers)
    assert res.status_code == 200
    email_id = res.json()["id"]
    
    # 2. List Emails
    res = client.get("/api/emails/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    
    # 3. Delete Email
    res = client.delete(f"/api/emails/{email_id}", headers=headers)
    assert res.status_code == 200

def test_system_stats_summary():
    headers = {"Authorization": f"Bearer {tokens['admin']}"}
    
    # 1. System stats GET
    res = client.get("/api/system/stats", headers=headers)
    assert res.status_code == 200
    assert "cpu" in res.json()
    assert "memory" in res.json()
    
    # 2. Summary GET
    res = client.get("/api/system/summary", headers=headers)
    assert res.status_code == 200
    assert "websites" in res.json()

def test_security_flow():
    headers = {"Authorization": f"Bearer {tokens['admin']}"}
    
    # 1. Install SSL
    res = client.post("/api/security/ssl/install", json={
        "domain": "test-domain.com",
        "email": "admin@domain.com"
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    
    # 2. Add Firewall Rule
    res = client.post("/api/security/firewall", json={
        "port": 8080,
        "protocol": "tcp",
        "action": "allow"
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    
    # 3. Get Firewall Rules
    res = client.get("/api/security/firewall", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["rules"]) >= 1
