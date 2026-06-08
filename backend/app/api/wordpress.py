from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import models
from ..schemas import schemas
from ..services.wordpress_service import WordPressService

router = APIRouter()

@router.post("/install")
async def install_wordpress(install_data: schemas.WordPressInstall, db: Session = Depends(get_db)):
    website = db.query(models.Website).filter(models.Website.id == install_data.website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    path = f"/home/{website.domain}/public_html"
    success = WordPressService.install(
        path=path,
        url=f"http://{website.domain}",
        title=install_data.title,
        admin_user=install_data.admin_user,
        admin_pass=install_data.admin_password,
        admin_email=install_data.admin_email
    )
    if not success:
         raise HTTPException(status_code=500, detail="WordPress installation failed")
    return {"status": "success", "message": "WordPress successfully installed"}

@router.get("/info/{website_id}")
async def get_wordpress_info(website_id: int, db: Session = Depends(get_db)):
    website = db.query(models.Website).filter(models.Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    path = f"/home/{website.domain}/public_html"
    version = WordPressService.get_site_info(path)
    return {"version": version}

@router.post("/harden/{website_id}")
async def harden_wordpress(website_id: int, db: Session = Depends(get_db)):
    website = db.query(models.Website).filter(models.Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    path = f"/home/{website.domain}/public_html"
    WordPressService.hardening(path)
    return {"status": "success", "message": "WordPress security hardened"}

@router.post("/optimize/{website_id}")
async def optimize_wordpress(website_id: int, db: Session = Depends(get_db)):
    website = db.query(models.Website).filter(models.Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    path = f"/home/{website.domain}/public_html"
    WordPressService.cleanup_database(path)
    return {"status": "success", "message": "WordPress database optimized"}

