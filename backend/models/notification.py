from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # new_user, new_project, new_competition, new_proposal, new_submission, proposal_approved, etc.
    to_user_id: Optional[str] = None  # nullable for broadcast
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationCreate(BaseModel):
    type: str
    to_user_id: Optional[str] = None
    message: str
    link: Optional[str] = None
