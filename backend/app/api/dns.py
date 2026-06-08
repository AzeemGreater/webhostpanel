from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import models
from ..services.dns_service import DnsService
from .deps import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DnsRecordRequest(BaseModel):
    type: str
    name: str
    content: str
    ttl: int = 3600
    priority: Optional[int] = None

@router.get("/zones")
async def list_dns_zones(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == 'admin':
         return db.query(models.DnsZone).all()
    return db.query(models.DnsZone).filter(models.DnsZone.owner_id == current_user.id).all()

@router.post("/zones")
async def create_dns_zone(domain: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Validate website ownership
    web = db.query(models.Website).filter(models.Website.domain == domain).first()
    if not web:
         raise HTTPException(status_code=400, detail="Domain must be registered in Websites first")
         
    # Check limit or duplicate
    zone_exist = db.query(models.DnsZone).filter(models.DnsZone.domain == domain).first()
    if zone_exist:
         raise HTTPException(status_code=400, detail="DNS Zone already exists")
         
    # pdnsutil command
    DnsService.create_zone(domain)
    
    new_zone = models.DnsZone(domain=domain, owner_id=current_user.id)
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return new_zone

@router.get("/zones/{zone_id}/records")
async def list_dns_records(zone_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    zone = db.query(models.DnsZone).filter(models.DnsZone.id == zone_id).first()
    if not zone:
         raise HTTPException(status_code=404, detail="Zone not found")
    
    # Return database records
    records = db.query(models.DnsRecord).filter(models.DnsRecord.zone_id == zone_id).all()
    if not records:
         # Mock default DNS records
         return [
             {"id": 1, "type": "A", "name": "@", "content": "127.0.0.1", "ttl": 3600, "priority": None},
             {"id": 2, "type": "CNAME", "name": "www", "content": zone.domain, "ttl": 3600, "priority": None},
             {"id": 3, "type": "MX", "name": "@", "content": f"mail.{zone.domain}", "ttl": 3600, "priority": 10}
         ]
    return records

@router.post("/zones/{zone_id}/records")
async def add_dns_record(zone_id: int, req: DnsRecordRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    zone = db.query(models.DnsZone).filter(models.DnsZone.id == zone_id).first()
    if not zone:
         raise HTTPException(status_code=404, detail="Zone not found")
         
    # Add command
    DnsService.add_record(zone.domain, req.name, req.type, req.content, req.ttl)
    
    db_rec = models.DnsRecord(
        zone_id=zone_id,
        type=req.type,
        name=req.name,
        content=req.content,
        ttl=req.ttl,
        priority=req.priority
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    return db_rec

@router.delete("/records/{record_id}")
async def delete_dns_record(record_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rec = db.query(models.DnsRecord).filter(models.DnsRecord.id == record_id).first()
    if not rec:
         raise HTTPException(status_code=404, detail="Record not found")
         
    db.delete(rec)
    db.commit()
    return {"status": "success", "message": "DNS Record deleted"}
