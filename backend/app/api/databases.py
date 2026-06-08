from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import models
from ..schemas import schemas
from ..services.database_service import DatabaseService
from .deps import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.Database)
async def create_db(db_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_name = db_data.get('name')
    db_user = db_data.get('db_user')
    db_pass = db_data.get('db_pass')
    
    if not db_name or not db_user or not db_pass:
        raise HTTPException(status_code=400, detail="Missing fields")
        
    # Check limit
    user_dbs = db.query(models.Database).filter(models.Database.owner_id == current_user.id).count()
    if user_dbs >= current_user.max_databases:
        raise HTTPException(status_code=400, detail="Database limit reached")

    # Emulated System Action (CyberPanel approach)
    DatabaseService.create_database(db_name, db_user, db_pass)
    
    new_db = models.Database(name=db_name, db_user=db_user, db_pass=db_pass, owner_id=current_user.id)
    db.add(new_db)
    db.commit()
    db.refresh(new_db)
    return new_db

@router.get("/")
async def list_dbs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == 'admin':
        return db.query(models.Database).all()
    return db.query(models.Database).filter(models.Database.owner_id == current_user.id).all()

@router.delete("/{db_id}")
async def delete_db(db_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_record = db.query(models.Database).filter(models.Database.id == db_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Database not found")
        
    # Security: Ensure owner deletes
    if current_user.role != 'admin' and db_record.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this database")
        
    DatabaseService.delete_database(db_record.name)
    db.delete(db_record)
    db.commit()
    return {"status": "success", "message": "Database deleted successfully"}

