from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    password_hash: str
    role: str = Field(default="designer")  # designer | client | superadmin
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    is_blocked: bool = False
    is_featured: bool = False
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "designer"  # designer | client

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    profile_image: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    is_blocked: bool = False
    is_featured: bool = False
    created_at: datetime
