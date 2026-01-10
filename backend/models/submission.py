from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class Submission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    competition_id: str
    designer_id: str
    designer_name: str
    designer_image: Optional[str] = None
    title: str
    description: str
    files: List[str] = Field(default_factory=list)  # submission files/images
    thumbnail: Optional[str] = None
    votes: int = 0
    is_winner: bool = False
    position: Optional[int] = None  # 1st, 2nd, 3rd if winner
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubmissionCreate(BaseModel):
    competition_id: str
    title: str
    description: str

class SubmissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_winner: Optional[bool] = None
    position: Optional[int] = None
