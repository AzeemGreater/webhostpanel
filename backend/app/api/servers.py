from fastapi import APIRouter, Depends
from ..services.server_service import ServerService
from ..schemas import schemas
from .deps import get_admin_user

router = APIRouter()

@router.get("/stats", response_model=schemas.ServerStats)
async def get_server_stats(admin: schemas.User = Depends(get_admin_user)):
    return ServerService.get_stats()

@router.get("/services")
async def get_services_status():
    return ServerService.get_services_status()
