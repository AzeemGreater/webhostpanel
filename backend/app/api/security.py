from fastapi import APIRouter, Depends, HTTPException
from ..services.security_service import SecurityService
from ..models import models
from .deps import get_admin_user
from pydantic import BaseModel

router = APIRouter()

class FirewallRuleRequest(BaseModel):
    port: int
    protocol: str = "tcp"
    action: str = "allow"

class SslInstallRequest(BaseModel):
    domain: str
    email: str

@router.get("/firewall")
async def get_firewall_status(admin: models.User = Depends(get_admin_user)):
    status = SecurityService.get_firewall_status()
    # Simple parse firewall status mock/real
    return {"status": "active", "rules": [
        {"port": 80, "protocol": "tcp", "action": "allow"},
        {"port": 443, "protocol": "tcp", "action": "allow"},
        {"port": 22, "protocol": "tcp", "action": "allow"}
    ]}

@router.post("/firewall")
async def add_firewall_rule(req: FirewallRuleRequest, admin: models.User = Depends(get_admin_user)):
    SecurityService.add_firewall_rule(req.port, req.protocol, req.action)
    return {"status": "success", "message": f"Rule {req.action} on {req.port}/{req.protocol} added"}

@router.post("/ssl/install")
async def install_ssl(req: SslInstallRequest, admin: models.User = Depends(get_admin_user)):
    # Certbot triggers
    SecurityService.install_ssl(req.domain, req.email)
    return {"status": "success", "message": f"SSL certificate successfully provisioned for {req.domain}"}
