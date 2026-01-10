from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class Prize(BaseModel):
    position: int
    amount: Optional[float] = None
    description: str

class Competition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    brief: str
    client_id: str
    client_name: str
    category: str  # ui-ux, graphic-design, branding, logo, etc.
    prizes: List[Prize] = Field(default_factory=list)
    start_date: datetime
    end_date: datetime
    skills_required: List[str] = Field(default_factory=list)
    attachments: List[str] = Field(default_factory=list)
    thumbnail: Optional[str] = None
    status: str = "upcoming"  # upcoming, active, voting, completed
    winner_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompetitionCreate(BaseModel):
    title: str
    description: str
    brief: str
    category: str
    prizes: List[Prize] = Field(default_factory=list)
    start_date: str
    end_date: str
    skills_required: List[str] = Field(default_factory=list)

class CompetitionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    brief: Optional[str] = None
    category: Optional[str] = None
    prizes: Optional[List[Prize]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    skills_required: Optional[List[str]] = None
    status: Optional[str] = None

class CompetitionResponse(BaseModel):
    id: str
    title: str
    description: str
    brief: str
    client_id: str
    client_name: str
    category: str
    prizes: List[Prize]
    start_date: datetime
    end_date: datetime
    skills_required: List[str]
    attachments: List[str]
    thumbnail: Optional[str] = None
    status: str
    winner_ids: List[str]
    created_at: datetime
    submission_count: int = 0
