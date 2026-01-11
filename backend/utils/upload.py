import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException

import os

# Upload directory
# Render/Vercel/etc: use /tmp which is writable
# Local: default to ./uploads
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# Allowed file types
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.zip'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def save_upload(file: UploadFile, folder: str = "general") -> str:
    """
    Save uploaded file to local storage
    Returns the file URL/path
    
    Cloudinary-ready: Replace this function to use Cloudinary when keys are available
    """
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")
    
    # Create folder if not exists
    folder_path = UPLOAD_DIR / folder
    folder_path.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = folder_path / unique_filename
    
    # Read and validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Return relative URL path
    return f"/uploads/{folder}/{unique_filename}"

async def delete_upload(file_path: str) -> bool:
    """Delete an uploaded file"""
    try:
        # Remove leading slash and construct full path
        relative_path = file_path.lstrip('/')
        full_path = Path("/app") / relative_path
        
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception:
        return False

# Cloudinary placeholder for future integration
# When Cloudinary keys are available, implement these:
# 
# import cloudinary
# import cloudinary.uploader
# 
# cloudinary.config(
#     cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
#     api_key=os.environ.get('CLOUDINARY_API_KEY'),
#     api_secret=os.environ.get('CLOUDINARY_API_SECRET')
# )
# 
# async def save_upload_cloudinary(file: UploadFile, folder: str = "dezx") -> str:
#     content = await file.read()
#     result = cloudinary.uploader.upload(content, folder=folder)
#     return result['secure_url']
