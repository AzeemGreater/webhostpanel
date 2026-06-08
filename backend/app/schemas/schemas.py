from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class WebsiteBase(BaseModel):
    domain: str
    php_version: str = "8.2"

class WebsiteCreate(WebsiteBase):
    pass

class Website(WebsiteBase):
    id: int
    owner_id: int
    is_active: bool
    is_suspended: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ServerStats(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    uptime: str
    load_average: List[float]

class WordPressInstall(BaseModel):
    website_id: int
    title: str
    admin_user: str
    admin_password: str
    admin_email: EmailStr
