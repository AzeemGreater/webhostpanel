from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # admin, reseller, user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Resource Limits (for RBAC/Quotas)
    max_websites = Column(Integer, default=10)
    max_databases = Column(Integer, default=10)
    max_emails = Column(Integer, default=10)
    max_bandwidth_mb = Column(BigInteger, default=102400) # 100GB
    
    websites = relationship("Website", back_populates="owner")

class Website(Base):
    __tablename__ = "websites"
    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    php_version = Column(String, default="8.2")
    ssl_enabled = Column(Boolean, default=False)
    ssl_expiry = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_suspended = Column(Boolean, default=False)
    bandwidth_usage_mb = Column(BigInteger, default=0)
    disk_usage_mb = Column(BigInteger, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="websites")

class Database(Base):
    __tablename__ = "databases"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    db_user = Column(String)
    db_pass = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EmailAccount(Base):
    __tablename__ = "email_accounts"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    quota_mb = Column(Integer, default=1024)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DnsZone(Base):
    __tablename__ = "dns_zones"
    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

class DnsRecord(Base):
    __tablename__ = "dns_records"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("dns_zones.id"))
    type = Column(String)
    name = Column(String)
    content = Column(Text)
    priority = Column(Integer, nullable=True)
    ttl = Column(Integer, default=3600)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(Text)
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FtpAccount(Base):
    __tablename__ = "ftp_accounts"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    doc_root = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

