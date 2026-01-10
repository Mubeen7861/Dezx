from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class Proposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    designer_id: str
    designer_name: str
    designer_image: Optional[str] = None
    cover_letter: str
    proposed_budget: Optional[float] = None
    estimated_duration: Optional[str] = None  # e.g., "2 weeks", "1 month"
    attachments: List[str] = Field(default_factory=list)
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProposalCreate(BaseModel):
    project_id: str
    cover_letter: str
    proposed_budget: Optional[float] = None
    estimated_duration: Optional[str] = None

class ProposalUpdate(BaseModel):
    status: Optional[str] = None
