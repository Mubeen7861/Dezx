from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

class UploadLimits(BaseModel):
    proposal_max_mb: int = 10
    submission_max_mb: int = 20

class HomepageFeatureLimits(BaseModel):
    projects_count: int = 6
    competitions_count: int = 6

class PlatformSettings(BaseModel):
    id: str = Field(default="platform_settings")
    is_freelance_enabled: bool = True
    is_competitions_enabled: bool = True
    is_registration_enabled: bool = True
    upload_limits: UploadLimits = Field(default_factory=UploadLimits)
    homepage_feature_limits: HomepageFeatureLimits = Field(default_factory=HomepageFeatureLimits)
    maintenance_mode: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlatformSettingsUpdate(BaseModel):
    is_freelance_enabled: Optional[bool] = None
    is_competitions_enabled: Optional[bool] = None
    is_registration_enabled: Optional[bool] = None
    upload_limits: Optional[UploadLimits] = None
    homepage_feature_limits: Optional[HomepageFeatureLimits] = None
    maintenance_mode: Optional[bool] = None
