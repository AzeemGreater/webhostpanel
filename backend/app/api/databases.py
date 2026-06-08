from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import models
from ..schemas import schemas
from ..services.database_service import DatabaseService

router = APIRouter()

@router.post("/")
async def create_db(db_data: dict, db: Session = Depends(get_db)):
    # logic to create database
    DatabaseService.create_database(db_data['name'])
    return {"message": "Database created"}

@router.get("/")
async def list_dbs(db: Session = Depends(get_db)):
    return db.query(models.Database).all()
