from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import models
from ..services.email_service import EmailService
from .deps import get_current_user
from pydantic import BaseModel, EmailStr

router = APIRouter()

class EmailCreateRequest(BaseModel):
    email: EmailStr
    password: str
    quota_mb: int = 1024

@router.get("/")
async def list_email_accounts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == 'admin':
        return db.query(models.EmailAccount).all()
    return db.query(models.EmailAccount).filter(models.EmailAccount.owner_id == current_user.id).all()

@router.post("/")
async def create_email_account(req: EmailCreateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Simple email check domain ownership:
    domain = req.email.split("@")[-1]
    website = db.query(models.Website).filter(models.Website.domain == domain).first()
    if not website:
        raise HTTPException(status_code=400, detail=f"Domain {domain} is not registered in this panel")
        
    # Check limit
    user_emails = db.query(models.EmailAccount).filter(models.EmailAccount.owner_id == current_user.id).count()
    if user_emails >= current_user.max_emails:
        raise HTTPException(status_code=400, detail="Email account limit reached")
        
    # In virtualization we would run:
    EmailService.create_account(req.email, req.password, req.quota_mb)
    
    new_email = models.EmailAccount(email=req.email, password=req.password, quota_mb=req.quota_mb, owner_id=current_user.id)
    db.add(new_email)
    db.commit()
    db.refresh(new_email)
    return new_email

@router.delete("/{email_id}")
async def delete_email_account(email_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    email_rec = db.query(models.EmailAccount).filter(models.EmailAccount.id == email_id).first()
    if not email_rec:
        raise HTTPException(status_code=404, detail="Email account not found")
        
    if current_user.role != 'admin' and email_rec.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this email account")
         
    db.delete(email_rec)
    db.commit()
    return {"status": "success", "message": "Email account deleted successfully"}
