from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import models
from ..services.ftp_service import FtpService
from .deps import get_current_user
from pydantic import BaseModel

router = APIRouter()

class FtpCreateRequest(BaseModel):
    username: str
    password: str
    doc_root: str

@router.get("/")
async def list_ftp_accounts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == 'admin':
        return db.query(models.FtpAccount).all()
    return db.query(models.FtpAccount).filter(models.FtpAccount.owner_id == current_user.id).all()

@router.post("/")
async def create_ftp_account(req: FtpCreateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check limit or duplicate
    exist = db.query(models.FtpAccount).filter(models.FtpAccount.username == req.username).first()
    if exist:
        raise HTTPException(status_code=400, detail="FTP username already exists")
        
    # Standard security directory resolver
    # Check if doc_root is subpath of /home (or C:/Users/Greater/temp_home)
    import os, platform
    base = os.path.abspath("C:/Users/Greater/temp_home" if platform.system() == "Windows" else "/home")
    target_abs = os.path.abspath(req.doc_root)
    if not target_abs.startswith(base):
        # Auto append if not absolute
        target_abs = os.path.abspath(os.path.join(base, req.doc_root.lstrip("/").lstrip("\\")))
        if not target_abs.startswith(base):
             raise HTTPException(status_code=403, detail="Invalid directory root")
             
    # Create system FTP mapping
    success = FtpService.create_ftp_account(req.username, req.password, target_abs)
    if not success:
         raise HTTPException(status_code=500, detail="Failed to initialize system FTP configuration")
         
    new_ftp = models.FtpAccount(username=req.username, password=req.password, doc_root=target_abs, owner_id=current_user.id)
    db.add(new_ftp)
    db.commit()
    db.refresh(new_ftp)
    return new_ftp

@router.delete("/{ftp_id}")
async def delete_ftp_account(ftp_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ftp_rec = db.query(models.FtpAccount).filter(models.FtpAccount.id == ftp_id).first()
    if not ftp_rec:
        raise HTTPException(status_code=404, detail="FTP account not found")
        
    if current_user.role != 'admin' and ftp_rec.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this FTP account")
         
    FtpService.delete_ftp_account(ftp_rec.username)
    db.delete(ftp_rec)
    db.commit()
    return {"status": "success", "message": "FTP account deleted successfully"}
