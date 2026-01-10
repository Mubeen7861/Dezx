from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    admin_name: str
    action_type: str  # create, update, delete, approve, reject, block, unblock, feature, winner
    entity_type: str  # user, project, proposal, competition, submission, cms, settings
    entity_id: Optional[str] = None
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuditLogCreate(BaseModel):
    action_type: str
    entity_type: str
    entity_id: Optional[str] = None
    description: str
