from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models import models
from ..schemas import schemas
from ..services.website_service import WebsiteService
from .deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Website])
async def get_websites(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(models.Website).all()
    return db.query(models.Website).filter(models.Website.owner_id == current_user.id).all()

@router.post("/", response_model=schemas.Website)
async def create_website(website: schemas.WebsiteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_website = models.Website(domain=website.domain, php_version=website.php_version, owner_id=current_user.id)
    db.add(db_website)
    db.commit()
    db.refresh(db_website)
    
    # Trigger system configuration
    WebsiteService.create_vhost(website.domain, website.php_version)
    
    return db_website

@router.delete("/{website_id}")
async def delete_website(website_id: int, db: Session = Depends(get_db)):
    website = db.query(models.Website).filter(models.Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    WebsiteService.delete_vhost(website.domain)
    db.delete(website)
    db.commit()
    return {"message": "Website deleted"}
