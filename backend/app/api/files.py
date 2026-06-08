import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel
import platform
from ..models import models
from .deps import get_current_user

router = APIRouter()

# Safe base paths
def get_safe_base():
    if platform.system() == "Windows":
        return os.path.abspath("C:/Users/Greater/temp_home")
    return os.path.abspath("/home")

def resolve_safe_path(requested_path: str) -> str:
    base = get_safe_base()
    # Ensure directory exists
    os.makedirs(base, exist_ok=True)
    
    # Clean and resolve path
    absolute_path = os.path.abspath(requested_path)
    
    # Check if absolute path is subpath of base
    if not absolute_path.startswith(base):
        # Fallback to append requested path to base
        # Strip leading slashes/drive letters
        clean_rel = requested_path.replace("\\", "/").lstrip("/")
        if ":" in clean_rel:
            clean_rel = clean_rel.split(":", 1)[-1].lstrip("/")
        absolute_path = os.path.abspath(os.path.join(base, clean_rel))
        
        if not absolute_path.startswith(base):
            raise HTTPException(status_code=403, detail="Directory traversal attempt detected")
            
    return absolute_path

class FileWriteRequest(BaseModel):
    path: str
    content: str

class FileCreateRequest(BaseModel):
    path: str
    is_dir: bool = False

@router.get("/list")
async def list_directory(path: str = "", current_user: models.User = Depends(get_current_user)):
    safe_path = resolve_safe_path(path)
    if not os.path.exists(safe_path):
        # Create user directory if not exists
        if path == "" or path == "/":
            os.makedirs(safe_path, exist_ok=True)
        else:
            raise HTTPException(status_code=404, detail="Directory not found")
            
    items = []
    try:
        for entry in os.scandir(safe_path):
            stat_info = entry.stat()
            items.append({
                "name": entry.name,
                "path": os.path.join(path, entry.name).replace("\\", "/"),
                "is_dir": entry.is_dir(),
                "size": stat_info.st_size if entry.is_file() else 0,
                "modified": stat_info.st_mtime
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list directory: {str(e)}")
        
    return {"path": path.replace("\\", "/"), "items": items}

@router.get("/read")
async def read_file_content(path: str, current_user: models.User = Depends(get_current_user)):
    safe_path = resolve_safe_path(path)
    if not os.path.isfile(safe_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(safe_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return {"path": path, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

@router.post("/write")
async def write_file_content(req: FileWriteRequest, current_user: models.User = Depends(get_current_user)):
    safe_path = resolve_safe_path(req.path)
    try:
        # Create parent directory if missing
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(req.content)
        return {"status": "success", "message": "File written successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {str(e)}")

@router.post("/create")
async def create_file_or_dir(req: FileCreateRequest, current_user: models.User = Depends(get_current_user)):
    safe_path = resolve_safe_path(req.path)
    try:
        if req.is_dir:
            os.makedirs(safe_path, exist_ok=True)
            return {"status": "success", "message": "Directory created"}
        else:
            os.makedirs(os.path.dirname(safe_path), exist_ok=True)
            with open(safe_path, "w") as f:
                f.write("")
            return {"status": "success", "message": "File created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create item: {str(e)}")

@router.delete("/delete")
async def delete_file_or_dir(path: str, current_user: models.User = Depends(get_current_user)):
    safe_path = resolve_safe_path(path)
    if not os.path.exists(safe_path):
        raise HTTPException(status_code=404, detail="Item not found")
    try:
        if os.path.isdir(safe_path):
            shutil.rmtree(safe_path)
        else:
            os.remove(safe_path)
        return {"status": "success", "message": "Item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")

@router.post("/upload")
async def upload_file(
    path: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    # Resolve target directory path
    safe_dir = resolve_safe_path(path)
    os.makedirs(safe_dir, exist_ok=True)
    
    target_path = os.path.join(safe_dir, file.filename)
    safe_target = resolve_safe_path(target_path)
    
    try:
        with open(safe_target, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "success", "message": f"File {file.filename} uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
