from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    client_id: str
    client_name: str
    category: str  # ui-ux, graphic-design, branding, illustration, etc.
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[datetime] = None
    skills_required: List[str] = Field(default_factory=list)
    attachments: List[str] = Field(default_factory=list)  # file URLs
    status: str = "open"  # open, in_progress, completed, cancelled
    approved_proposal_id: Optional[str] = None
    thumbnail: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    skills_required: List[str] = Field(default_factory=list)

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    skills_required: Optional[List[str]] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    client_id: str
    client_name: str
    category: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[datetime] = None
    skills_required: List[str]
    attachments: List[str]
    status: str
    approved_proposal_id: Optional[str] = None
    thumbnail: Optional[str] = None
    created_at: datetime
    proposal_count: int = 0
