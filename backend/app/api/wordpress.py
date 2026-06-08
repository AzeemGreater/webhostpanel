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
    
    path = f"/var/www/{website.domain}/public_html"
    WordPressService.install(
        path=path,
        url=f"http://{website.domain}",
        title=install_data.title,
        admin_user=install_data.admin_user,
        admin_pass=install_data.admin_password,
        admin_email=install_data.admin_email
    )
    return {"message": "WordPress installation started"}
