from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Import models
from models.user import User, UserCreate, UserUpdate, UserResponse
from models.site_content import SiteContent, SiteContentUpdate
from models.notification import Notification, NotificationCreate
from models.project import Project, ProjectCreate, ProjectUpdate, ProjectResponse
from models.competition import Competition, CompetitionCreate, CompetitionUpdate, CompetitionResponse, Prize
from models.proposal import Proposal, ProposalCreate, ProposalUpdate
from models.submission import Submission, SubmissionCreate, SubmissionUpdate
from models.platform_settings import PlatformSettings, PlatformSettingsUpdate
from models.audit_log import AuditLog, AuditLogCreate

# Import utils
from utils.auth import hash_password, verify_password, create_token, verify_token, get_current_user, require_role
from utils.upload import save_upload, delete_upload

# Create the main app
app = FastAPI(title="DEZX API", version="1.0.0", redirect_slashes=False)

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["Users"])
content_router = APIRouter(prefix="/content", tags=["Site Content"])
projects_router = APIRouter(prefix="/projects", tags=["Projects"])
competitions_router = APIRouter(prefix="/competitions", tags=["Competitions"])
proposals_router = APIRouter(prefix="/proposals", tags=["Proposals"])
submissions_router = APIRouter(prefix="/submissions", tags=["Submissions"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])
upload_router = APIRouter(prefix="/upload", tags=["Upload"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
settings_router = APIRouter(prefix="/settings", tags=["Settings"])
audit_router = APIRouter(prefix="/audit", tags=["Audit"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== HELPERS ==============
async def create_notification(type: str, message: str, to_user_id: str = None, link: str = None):
    """Create a notification and also notify superadmins"""
    notification = Notification(type=type, message=message, to_user_id=to_user_id, link=link)
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    
    # Also create broadcast for superadmins if targeted notification
    if to_user_id:
        admin_notif = Notification(type=type, message=f"[Admin] {message}", to_user_id=None, link=link)
        admin_doc = admin_notif.model_dump()
        admin_doc['created_at'] = admin_doc['created_at'].isoformat()
        await db.notifications.insert_one(admin_doc)

async def create_audit_log(admin_id: str, admin_name: str, action_type: str, entity_type: str, entity_id: str, description: str):
    """Create an audit log entry"""
    log = AuditLog(
        admin_id=admin_id,
        admin_name=admin_name,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description
    )
    doc = log.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.audit_logs.insert_one(doc)

async def check_blocked(user_id: str):
    """Check if user is blocked"""
    user = await db.users.find_one({"id": user_id})
    if user and user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Your account is blocked")

# ============== ROOT ==============
@api_router.get("/")
async def root():
    return {"message": "Welcome to DEZX API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============== AUTH ROUTES ==============
@auth_router.post("/register")
async def register(user_data: UserCreate, response: Response):
    # Check platform settings
    settings = await db.platform_settings.find_one({"id": "platform_settings"})
    if settings and not settings.get("is_registration_enabled", True):
        raise HTTPException(status_code=403, detail="Registration is currently disabled")
    
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_data.role not in ["designer", "client"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_token(user.id, user.email, user.role)
    response.set_cookie(key="token", value=token, httponly=True, secure=True, samesite="none", max_age=60*60*24*7)
    
    await create_notification("new_user", f"New {user.role} registered: {user.name}", link="/super-admin/users")
    
    return {"message": "Registration successful", "user": UserResponse(**user.model_dump()).model_dump(), "token": token}

@auth_router.post("/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email, password = body.get("email"), body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc or not verify_password(password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user_doc.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked")
    
    token = create_token(user_doc["id"], user_doc["email"], user_doc["role"])
    response.set_cookie(key="token", value=token, httponly=True, secure=True, samesite="none", max_age=60*60*24*7)
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return {"message": "Login successful", "user": UserResponse(**user_doc).model_dump(), "token": token}

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="token")
    return {"message": "Logged out successfully"}

@auth_router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    return UserResponse(**user_doc).model_dump()

@auth_router.post("/forgot-password")
async def forgot_password(request: Request):
    body = await request.json()
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        return {"message": "If email exists, reset instructions have been sent"}
    
    reset_token = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.users.update_one({"email": email}, {"$set": {"reset_token": reset_token, "reset_token_expires": expires.isoformat()}})
    
    return {"message": "If email exists, reset instructions have been sent", "reset_token": reset_token}

@auth_router.post("/reset-password")
async def reset_password(request: Request):
    body = await request.json()
    token, new_password = body.get("token"), body.get("password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and password required")
    
    user_doc = await db.users.find_one({"reset_token": token})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    expires = user_doc.get("reset_token_expires")
    if expires:
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reset token expired")
    
    await db.users.update_one({"reset_token": token}, {"$set": {"password_hash": hash_password(new_password)}, "$unset": {"reset_token": "", "reset_token_expires": ""}})
    return {"message": "Password reset successful"}

# ============== USER ROUTES ==============
@users_router.get("/")
async def list_users(user: dict = Depends(require_role("superadmin")), role: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [{"name": {"$regex": search, "$options": "i"}}, {"email": {"$regex": search, "$options": "i"}}]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0, "reset_token": 0}).to_list(1000)
    for u in users:
        if isinstance(u.get('created_at'), str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    return users

@users_router.get("/{user_id}")
async def get_user(user_id: str):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "reset_token": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    return user_doc

@users_router.put("/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, user: dict = Depends(get_current_user)):
    if user["user_id"] != user_id and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully"}

@users_router.put("/{user_id}/block")
async def toggle_block_user(user_id: str, user: dict = Depends(require_role("superadmin"))):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user_doc.get("is_blocked", False)
    await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": new_status}})
    
    action = "blocked" if new_status else "unblocked"
    await create_audit_log(user["user_id"], user["email"], action, "user", user_id, f"User {user_doc['name']} {action}")
    await create_notification(f"user_{action}", f"User {user_doc['name']} has been {action}", link="/super-admin/users")
    
    return {"message": f"User {action}", "is_blocked": new_status}

@users_router.put("/{user_id}/feature")
async def toggle_feature_user(user_id: str, user: dict = Depends(require_role("superadmin"))):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user_doc.get("is_featured", False)
    await db.users.update_one({"id": user_id}, {"$set": {"is_featured": new_status}})
    
    action = "featured" if new_status else "unfeatured"
    await create_audit_log(user["user_id"], user["email"], action, "user", user_id, f"Designer {user_doc['name']} {action}")
    
    return {"message": f"User {action}", "is_featured": new_status}

@users_router.delete("/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_role("superadmin"))):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if user_doc["role"] == "superadmin":
        raise HTTPException(status_code=400, detail="Cannot delete admin")
    
    await db.users.delete_one({"id": user_id})
    await create_audit_log(user["user_id"], user["email"], "delete", "user", user_id, f"User {user_doc['name']} deleted")
    
    return {"message": "User deleted"}

# ============== SITE CONTENT ROUTES ==============
@content_router.get("/")
async def get_site_content():
    content = await db.site_content.find_one({"id": "site_content_main"}, {"_id": 0})
    if not content:
        default = SiteContent()
        return default.model_dump()
    return content

@content_router.put("/")
async def update_site_content(update_data: SiteContentUpdate, user: dict = Depends(require_role("superadmin"))):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    for key in ["feature_cards", "steps", "faqs", "footer_links", "social_links"]:
        if key in update_dict:
            update_dict[key] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in update_dict[key]]
    if "theme_settings" in update_dict and hasattr(update_dict["theme_settings"], 'model_dump'):
        update_dict["theme_settings"] = update_dict["theme_settings"].model_dump()
    
    await db.site_content.update_one({"id": "site_content_main"}, {"$set": update_dict}, upsert=True)
    await create_audit_log(user["user_id"], user["email"], "update", "cms", "site_content_main", "CMS content updated")
    
    return {"message": "Site content updated"}

@content_router.post("/init")
async def init_site_content():
    existing = await db.site_content.find_one({"id": "site_content_main"})
    if existing:
        return {"message": "Site content already exists"}
    
    default = SiteContent()
    doc = default.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.site_content.insert_one(doc)
    return {"message": "Site content initialized"}

# ============== PROJECT ROUTES ==============
@projects_router.get("/")
async def list_projects(status: Optional[str] = None, category: Optional[str] = None, budget_min: Optional[float] = None, budget_max: Optional[float] = None, skills: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if budget_min:
        query["budget_max"] = {"$gte": budget_min}
    if budget_max:
        query["budget_min"] = {"$lte": budget_max}
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query["skills_required"] = {"$in": skill_list}
    if featured:
        query["is_featured"] = True
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for project in projects:
        for key in ['created_at', 'updated_at', 'deadline']:
            if isinstance(project.get(key), str):
                project[key] = datetime.fromisoformat(project[key])
        project["proposal_count"] = await db.proposals.count_documents({"project_id": project["id"]})
    
    return projects

@projects_router.get("/my")
async def get_my_projects(user: dict = Depends(get_current_user)):
    await check_blocked(user["user_id"])
    projects = await db.projects.find({"client_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for project in projects:
        for key in ['created_at', 'updated_at', 'deadline']:
            if isinstance(project.get(key), str):
                project[key] = datetime.fromisoformat(project[key])
        project["proposal_count"] = await db.proposals.count_documents({"project_id": project["id"]})
    
    return projects

@projects_router.get("/featured")
async def get_featured_projects():
    settings = await db.platform_settings.find_one({"id": "platform_settings"})
    limit = settings.get("homepage_feature_limits", {}).get("projects_count", 6) if settings else 6
    
    projects = await db.projects.find({"is_featured": True, "status": "open"}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for project in projects:
        for key in ['created_at', 'updated_at', 'deadline']:
            if isinstance(project.get(key), str):
                project[key] = datetime.fromisoformat(project[key])
    return projects

@projects_router.get("/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key in ['created_at', 'updated_at', 'deadline']:
        if isinstance(project.get(key), str):
            project[key] = datetime.fromisoformat(project[key])
    project["proposal_count"] = await db.proposals.count_documents({"project_id": project_id})
    
    return project

@projects_router.post("/")
async def create_project(project_data: ProjectCreate, user: dict = Depends(require_role("client", "superadmin"))):
    await check_blocked(user["user_id"])
    
    settings = await db.platform_settings.find_one({"id": "platform_settings"})
    if settings and not settings.get("is_freelance_enabled", True):
        raise HTTPException(status_code=403, detail="Freelance is currently disabled")
    
    user_doc = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    
    project = Project(
        title=project_data.title,
        description=project_data.description,
        client_id=user["user_id"],
        client_name=user_doc["name"] if user_doc else "Unknown",
        category=project_data.category,
        budget_min=project_data.budget_min,
        budget_max=project_data.budget_max,
        deadline=datetime.fromisoformat(project_data.deadline) if project_data.deadline else None,
        skills_required=project_data.skills_required
    )
    
    doc = project.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['is_featured'] = False
    if doc['deadline']:
        doc['deadline'] = doc['deadline'].isoformat()
    
    await db.projects.insert_one(doc)
    await create_notification("project_created", f"New project posted: {project.title}", link=f"/freelance/{project.id}")
    
    return {"message": "Project created", "project_id": project.id}

@projects_router.put("/{project_id}")
async def update_project(project_id: str, update_data: ProjectUpdate, user: dict = Depends(get_current_user)):
    await check_blocked(user["user_id"])
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "deadline" in update_dict and update_dict["deadline"]:
        update_dict["deadline"] = datetime.fromisoformat(update_dict["deadline"]).isoformat()
    
    await db.projects.update_one({"id": project_id}, {"$set": update_dict})
    await create_notification("project_updated", f"Project updated: {project['title']}", link=f"/freelance/{project_id}")
    
    return {"message": "Project updated"}

@projects_router.put("/{project_id}/close")
async def close_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.projects.update_one({"id": project_id}, {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Project closed"}

@projects_router.put("/{project_id}/feature")
async def toggle_feature_project(project_id: str, user: dict = Depends(require_role("superadmin"))):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_status = not project.get("is_featured", False)
    await db.projects.update_one({"id": project_id}, {"$set": {"is_featured": new_status}})
    await create_audit_log(user["user_id"], user["email"], "feature", "project", project_id, f"Project {project['title']} {'featured' if new_status else 'unfeatured'}")
    
    return {"message": f"Project {'featured' if new_status else 'unfeatured'}", "is_featured": new_status}

@projects_router.delete("/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.projects.delete_one({"id": project_id})
    await db.proposals.delete_many({"project_id": project_id})
    await create_notification("project_deleted", f"Project deleted: {project['title']}", link="/super-admin/projects")
    
    if user["role"] == "superadmin":
        await create_audit_log(user["user_id"], user["email"], "delete", "project", project_id, f"Project {project['title']} deleted")
    
    return {"message": "Project deleted"}

# ============== COMPETITION ROUTES ==============
@competitions_router.get("/")
async def list_competitions(status: Optional[str] = None, category: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if featured:
        query["is_featured"] = True
    
    competitions = await db.competitions.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for comp in competitions:
        for key in ['created_at', 'updated_at', 'start_date', 'end_date']:
            if isinstance(comp.get(key), str):
                comp[key] = datetime.fromisoformat(comp[key])
        comp["submission_count"] = await db.submissions.count_documents({"competition_id": comp["id"]})
    
    return competitions

@competitions_router.get("/my")
async def get_my_competitions(user: dict = Depends(get_current_user)):
    await check_blocked(user["user_id"])
    competitions = await db.competitions.find({"client_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for comp in competitions:
        for key in ['created_at', 'updated_at', 'start_date', 'end_date']:
            if isinstance(comp.get(key), str):
                comp[key] = datetime.fromisoformat(comp[key])
        comp["submission_count"] = await db.submissions.count_documents({"competition_id": comp["id"]})
    
    return competitions

@competitions_router.get("/featured")
async def get_featured_competitions():
    settings = await db.platform_settings.find_one({"id": "platform_settings"})
    limit = settings.get("homepage_feature_limits", {}).get("competitions_count", 6) if settings else 6
    
    competitions = await db.competitions.find({"is_featured": True}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for comp in competitions:
        for key in ['created_at', 'updated_at', 'start_date', 'end_date']:
            if isinstance(comp.get(key), str):
                comp[key] = datetime.fromisoformat(comp[key])
    return competitions

@competitions_router.get("/{competition_id}")
async def get_competition(competition_id: str):
    comp = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    for key in ['created_at', 'updated_at', 'start_date', 'end_date']:
        if isinstance(comp.get(key), str):
            comp[key] = datetime.fromisoformat(comp[key])
    comp["submission_count"] = await db.submissions.count_documents({"competition_id": competition_id})
    
    # Get winners
    winners = await db.submissions.find({"competition_id": competition_id, "is_winner": True}, {"_id": 0}).to_list(10)
    comp["winners"] = winners
    
    return comp

@competitions_router.post("/")
async def create_competition(comp_data: CompetitionCreate, user: dict = Depends(require_role("client", "superadmin"))):
    await check_blocked(user["user_id"])
    
    settings = await db.platform_settings.find_one({"id": "platform_settings"})
    if settings and not settings.get("is_competitions_enabled", True):
        raise HTTPException(status_code=403, detail="Competitions are currently disabled")
    
    user_doc = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    
    competition = Competition(
        title=comp_data.title,
        description=comp_data.description,
        brief=comp_data.brief,
        client_id=user["user_id"],
        client_name=user_doc["name"] if user_doc else "Unknown",
        category=comp_data.category,
        prizes=[Prize(**p.model_dump()) if hasattr(p, 'model_dump') else Prize(**p) for p in comp_data.prizes],
        start_date=datetime.fromisoformat(comp_data.start_date),
        end_date=datetime.fromisoformat(comp_data.end_date),
        skills_required=comp_data.skills_required
    )
    
    now = datetime.now(timezone.utc)
    if competition.start_date > now:
        competition.status = "upcoming"
    elif competition.end_date > now:
        competition.status = "active"
    else:
        competition.status = "ended"
    
    doc = competition.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    doc['is_featured'] = False
    
    await db.competitions.insert_one(doc)
    await create_notification("competition_created", f"New competition: {competition.title}", link=f"/competitions/{competition.id}")
    
    return {"message": "Competition created", "competition_id": competition.id}

@competitions_router.put("/{competition_id}")
async def update_competition(competition_id: str, update_data: CompetitionUpdate, user: dict = Depends(get_current_user)):
    await check_blocked(user["user_id"])
    comp = await db.competitions.find_one({"id": competition_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    for key in ["start_date", "end_date"]:
        if key in update_dict:
            update_dict[key] = datetime.fromisoformat(update_dict[key]).isoformat()
    if "prizes" in update_dict:
        update_dict["prizes"] = [p.model_dump() if hasattr(p, 'model_dump') else p for p in update_dict["prizes"]]
    
    await db.competitions.update_one({"id": competition_id}, {"$set": update_dict})
    await create_notification("competition_updated", f"Competition updated: {comp['title']}", link=f"/competitions/{competition_id}")
    
    return {"message": "Competition updated"}

@competitions_router.put("/{competition_id}/feature")
async def toggle_feature_competition(competition_id: str, user: dict = Depends(require_role("superadmin"))):
    comp = await db.competitions.find_one({"id": competition_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    new_status = not comp.get("is_featured", False)
    await db.competitions.update_one({"id": competition_id}, {"$set": {"is_featured": new_status}})
    await create_audit_log(user["user_id"], user["email"], "feature", "competition", competition_id, f"Competition {comp['title']} {'featured' if new_status else 'unfeatured'}")
    
    return {"message": f"Competition {'featured' if new_status else 'unfeatured'}", "is_featured": new_status}

@competitions_router.delete("/{competition_id}")
async def delete_competition(competition_id: str, user: dict = Depends(get_current_user)):
    comp = await db.competitions.find_one({"id": competition_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.competitions.delete_one({"id": competition_id})
    await db.submissions.delete_many({"competition_id": competition_id})
    await create_notification("competition_deleted", f"Competition deleted: {comp['title']}", link="/super-admin/competitions")
    
    if user["role"] == "superadmin":
        await create_audit_log(user["user_id"], user["email"], "delete", "competition", competition_id, f"Competition {comp['title']} deleted")
    
    return {"message": "Competition deleted"}

# ============== PROPOSAL ROUTES ==============
@proposals_router.get("/project/{project_id}")
async def get_project_proposals(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    proposals = await db.proposals.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for p in proposals:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return proposals

@proposals_router.get("/my")
async def get_my_proposals(user: dict = Depends(get_current_user)):
    await check_blocked(user["user_id"])
    proposals = await db.proposals.find({"designer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for p in proposals:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        project = await db.projects.find_one({"id": p["project_id"]}, {"_id": 0, "title": 1, "status": 1})
        if project:
            p["project_title"] = project.get("title", "Unknown")
            p["project_status"] = project.get("status", "unknown")
    return proposals

@proposals_router.get("/all")
async def get_all_proposals(user: dict = Depends(require_role("superadmin"))):
    proposals = await db.proposals.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for p in proposals:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        project = await db.projects.find_one({"id": p["project_id"]}, {"_id": 0, "title": 1})
        if project:
            p["project_title"] = project.get("title", "Unknown")
    return proposals

@proposals_router.post("/")
async def create_proposal(proposal_data: ProposalCreate, user: dict = Depends(require_role("designer", "superadmin"))):
    await check_blocked(user["user_id"])
    
    project = await db.projects.find_one({"id": proposal_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["status"] != "open":
        raise HTTPException(status_code=400, detail="Project is not open")
    
    existing = await db.proposals.find_one({"project_id": proposal_data.project_id, "designer_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")
    
    user_doc = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    
    proposal = Proposal(
        project_id=proposal_data.project_id,
        designer_id=user["user_id"],
        designer_name=user_doc["name"] if user_doc else "Unknown",
        designer_image=user_doc.get("profile_image") if user_doc else None,
        cover_letter=proposal_data.cover_letter,
        proposed_budget=proposal_data.proposed_budget,
        estimated_duration=proposal_data.estimated_duration
    )
    
    doc = proposal.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['attachments'] = []
    
    await db.proposals.insert_one(doc)
    
    await create_notification("proposal_submitted", f"New proposal for '{project['title']}' from {proposal.designer_name}", to_user_id=project["client_id"], link=f"/client/projects/{project['id']}")
    
    return {"message": "Proposal submitted", "proposal_id": proposal.id}

@proposals_router.put("/{proposal_id}/approve")
async def approve_proposal(proposal_id: str, user: dict = Depends(get_current_user)):
    proposal = await db.proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    project = await db.projects.find_one({"id": proposal["project_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.proposals.update_one({"id": proposal_id}, {"$set": {"status": "approved"}})
    await db.proposals.update_many({"project_id": project["id"], "id": {"$ne": proposal_id}}, {"$set": {"status": "rejected"}})
    await db.projects.update_one({"id": project["id"]}, {"$set": {"status": "in_progress", "approved_proposal_id": proposal_id}})
    
    await create_notification("proposal_approved", f"Your proposal for '{project['title']}' has been approved!", to_user_id=proposal["designer_id"], link="/designer/proposals")
    
    if user["role"] == "superadmin":
        await create_audit_log(user["user_id"], user["email"], "approve", "proposal", proposal_id, f"Proposal approved for project {project['title']}")
    
    return {"message": "Proposal approved"}

@proposals_router.put("/{proposal_id}/reject")
async def reject_proposal(proposal_id: str, user: dict = Depends(get_current_user)):
    proposal = await db.proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    project = await db.projects.find_one({"id": proposal["project_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.proposals.update_one({"id": proposal_id}, {"$set": {"status": "rejected"}})
    await create_notification("proposal_rejected", f"Your proposal for '{project['title']}' was not selected", to_user_id=proposal["designer_id"], link="/designer/proposals")
    
    if user["role"] == "superadmin":
        await create_audit_log(user["user_id"], user["email"], "reject", "proposal", proposal_id, f"Proposal rejected for project {project['title']}")
    
    return {"message": "Proposal rejected"}

@proposals_router.delete("/{proposal_id}")
async def delete_proposal(proposal_id: str, user: dict = Depends(require_role("superadmin"))):
    proposal = await db.proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    await db.proposals.delete_one({"id": proposal_id})
    await create_audit_log(user["user_id"], user["email"], "delete", "proposal", proposal_id, f"Proposal deleted (spam/abuse)")
    
    return {"message": "Proposal deleted"}

# ============== SUBMISSION ROUTES ==============
@submissions_router.get("/competition/{competition_id}")
async def get_competition_submissions(competition_id: str):
    submissions = await db.submissions.find({"competition_id": competition_id}, {"_id": 0}).sort("votes", -1).to_list(100)
    for s in submissions:
        for key in ['created_at', 'updated_at']:
            if isinstance(s.get(key), str):
                s[key] = datetime.fromisoformat(s[key])
    return submissions

@submissions_router.get("/my")
async def get_my_submissions(user: dict = Depends(get_current_user)):
    await check_blocked(user["user_id"])
    submissions = await db.submissions.find({"designer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for s in submissions:
        for key in ['created_at', 'updated_at']:
            if isinstance(s.get(key), str):
                s[key] = datetime.fromisoformat(s[key])
        comp = await db.competitions.find_one({"id": s["competition_id"]}, {"_id": 0, "title": 1, "status": 1})
        if comp:
            s["competition_title"] = comp.get("title", "Unknown")
            s["competition_status"] = comp.get("status", "unknown")
    return submissions

@submissions_router.get("/all")
async def get_all_submissions(user: dict = Depends(require_role("superadmin"))):
    submissions = await db.submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for s in submissions:
        for key in ['created_at', 'updated_at']:
            if isinstance(s.get(key), str):
                s[key] = datetime.fromisoformat(s[key])
        comp = await db.competitions.find_one({"id": s["competition_id"]}, {"_id": 0, "title": 1})
        if comp:
            s["competition_title"] = comp.get("title", "Unknown")
    return submissions

@submissions_router.post("/")
async def create_submission(submission_data: SubmissionCreate, user: dict = Depends(require_role("designer", "superadmin"))):
    await check_blocked(user["user_id"])
    
    comp = await db.competitions.find_one({"id": submission_data.competition_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    if comp["status"] not in ["active", "upcoming"]:
        raise HTTPException(status_code=400, detail="Competition not accepting submissions")
    
    existing = await db.submissions.find_one({"competition_id": submission_data.competition_id, "designer_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")
    
    user_doc = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    
    submission = Submission(
        competition_id=submission_data.competition_id,
        designer_id=user["user_id"],
        designer_name=user_doc["name"] if user_doc else "Unknown",
        designer_image=user_doc.get("profile_image") if user_doc else None,
        title=submission_data.title,
        description=submission_data.description
    )
    
    doc = submission.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['images'] = []
    doc['tools_used'] = []
    doc['status'] = 'pending'
    
    await db.submissions.insert_one(doc)
    
    await create_notification("submission_submitted", f"New submission for '{comp['title']}' from {submission.designer_name}", to_user_id=comp["client_id"], link=f"/client/competitions/{comp['id']}")
    
    return {"message": "Submission created", "submission_id": submission.id}

@submissions_router.put("/{submission_id}")
async def update_submission(submission_id: str, update_data: SubmissionUpdate, user: dict = Depends(get_current_user)):
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if submission["designer_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.submissions.update_one({"id": submission_id}, {"$set": update_dict})
    return {"message": "Submission updated"}

@submissions_router.put("/{submission_id}/approve")
async def approve_submission(submission_id: str, user: dict = Depends(get_current_user)):
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    comp = await db.competitions.find_one({"id": submission["competition_id"]})
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.submissions.update_one({"id": submission_id}, {"$set": {"status": "approved"}})
    await create_notification("submission_approved", f"Your submission for '{comp['title']}' has been approved!", to_user_id=submission["designer_id"], link=f"/competitions/{comp['id']}")
    
    if user["role"] == "superadmin":
        await create_audit_log(user["user_id"], user["email"], "approve", "submission", submission_id, f"Submission approved")
    
    return {"message": "Submission approved"}

@submissions_router.put("/{submission_id}/reject")
async def reject_submission(submission_id: str, user: dict = Depends(get_current_user)):
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    comp = await db.competitions.find_one({"id": submission["competition_id"]})
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.submissions.update_one({"id": submission_id}, {"$set": {"status": "rejected"}})
    await create_notification("submission_rejected", f"Your submission for '{comp['title']}' was not approved", to_user_id=submission["designer_id"], link=f"/competitions/{comp['id']}")
    
    if user["role"] == "superadmin":
        await create_audit_log(user["user_id"], user["email"], "reject", "submission", submission_id, f"Submission rejected")
    
    return {"message": "Submission rejected"}

@submissions_router.put("/{submission_id}/winner")
async def set_winner(submission_id: str, position: int = Query(..., ge=1, le=3), user: dict = Depends(get_current_user)):
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    comp = await db.competitions.find_one({"id": submission["competition_id"]})
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Remove existing winner at this position
    await db.submissions.update_many({"competition_id": comp["id"], "winner_position": position}, {"$set": {"is_winner": False, "winner_position": None}})
    
    await db.submissions.update_one({"id": submission_id}, {"$set": {"is_winner": True, "winner_position": position, "status": "approved"}})
    
    winner_ids = comp.get("winner_ids", [])
    if submission["designer_id"] not in winner_ids:
        winner_ids.append(submission["designer_id"])
    await db.competitions.update_one({"id": comp["id"]}, {"$set": {"winner_ids": winner_ids}})
    
    await create_notification("winner_published", f"Congratulations! You won #{position} in '{comp['title']}'!", to_user_id=submission["designer_id"], link=f"/competitions/{comp['id']}")
    
    if user["role"] == "superadmin":
        await create_audit_log(user["user_id"], user["email"], "winner", "submission", submission_id, f"Set winner #{position} for {comp['title']}")
    
    return {"message": f"Winner #{position} set"}

@submissions_router.put("/{submission_id}/remove-winner")
async def remove_winner(submission_id: str, user: dict = Depends(require_role("superadmin"))):
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    await db.submissions.update_one({"id": submission_id}, {"$set": {"is_winner": False, "winner_position": None}})
    await create_audit_log(user["user_id"], user["email"], "remove_winner", "submission", submission_id, f"Winner removed")
    
    return {"message": "Winner removed"}

@submissions_router.delete("/{submission_id}")
async def delete_submission(submission_id: str, user: dict = Depends(require_role("superadmin"))):
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    await db.submissions.delete_one({"id": submission_id})
    await create_audit_log(user["user_id"], user["email"], "delete", "submission", submission_id, f"Submission deleted (abuse)")
    
    return {"message": "Submission deleted"}

# ============== NOTIFICATION ROUTES ==============
@notifications_router.get("/")
async def get_notifications(user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    query = {"$or": [{"to_user_id": user["user_id"]}, {"to_user_id": None}]}
    
    total = await db.notifications.count_documents(query)
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for n in notifications:
        if isinstance(n.get('created_at'), str):
            n['created_at'] = datetime.fromisoformat(n['created_at'])
    
    unread_count = await db.notifications.count_documents({**query, "is_read": False})
    
    return {"notifications": notifications, "total": total, "unread_count": unread_count, "page": page, "limit": limit}

@notifications_router.get("/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    query = {"$or": [{"to_user_id": user["user_id"]}, {"to_user_id": None}], "is_read": False}
    count = await db.notifications.count_documents(query)
    return {"unread_count": count}

@notifications_router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notification_id}, {"$set": {"is_read": True}})
    return {"message": "Marked as read"}

@notifications_router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    query = {"$or": [{"to_user_id": user["user_id"]}, {"to_user_id": None}]}
    await db.notifications.update_many(query, {"$set": {"is_read": True}})
    return {"message": "All marked as read"}

@notifications_router.post("/broadcast")
async def send_broadcast(request: Request, user: dict = Depends(require_role("superadmin"))):
    body = await request.json()
    message = body.get("message")
    link = body.get("link")
    
    if not message:
        raise HTTPException(status_code=400, detail="Message required")
    
    await create_notification("admin_announcement", message, to_user_id=None, link=link)
    await create_audit_log(user["user_id"], user["email"], "broadcast", "notification", None, f"Broadcast: {message[:50]}...")
    
    return {"message": "Broadcast sent"}

@notifications_router.post("/send-to-user")
async def send_to_user(request: Request, user: dict = Depends(require_role("superadmin"))):
    body = await request.json()
    to_user_id = body.get("to_user_id")
    message = body.get("message")
    link = body.get("link")
    
    if not to_user_id or not message:
        raise HTTPException(status_code=400, detail="User ID and message required")
    
    await create_notification("admin_direct", message, to_user_id=to_user_id, link=link)
    return {"message": "Notification sent"}

@notifications_router.post("/send-to-role")
async def send_to_role(request: Request, user: dict = Depends(require_role("superadmin"))):
    body = await request.json()
    role = body.get("role")
    message = body.get("message")
    link = body.get("link")
    
    if not role or not message:
        raise HTTPException(status_code=400, detail="Role and message required")
    
    users = await db.users.find({"role": role}, {"_id": 0, "id": 1}).to_list(1000)
    for u in users:
        await create_notification("admin_role", message, to_user_id=u["id"], link=link)
    
    await create_audit_log(user["user_id"], user["email"], "role_notification", "notification", None, f"Sent to {role}s: {message[:50]}...")
    return {"message": f"Notification sent to {len(users)} {role}s"}

# ============== UPLOAD ROUTES ==============
@upload_router.post("/")
async def upload_file(file: UploadFile = File(...), folder: str = "general", user: dict = Depends(get_current_user)):
    await check_blocked(user["user_id"])
    file_url = await save_upload(file, folder)
    return {"url": file_url, "filename": file.filename}

@upload_router.delete("/")
async def delete_file(file_path: str, user: dict = Depends(get_current_user)):
    success = await delete_upload(file_path)
    if success:
        return {"message": "File deleted"}
    raise HTTPException(status_code=404, detail="File not found")

# ============== ADMIN ROUTES ==============
@admin_router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_role("superadmin"))):
    return {
        "total_users": await db.users.count_documents({}),
        "designers": await db.users.count_documents({"role": "designer"}),
        "clients": await db.users.count_documents({"role": "client"}),
        "blocked_users": await db.users.count_documents({"is_blocked": True}),
        "projects": await db.projects.count_documents({}),
        "open_projects": await db.projects.count_documents({"status": "open"}),
        "competitions": await db.competitions.count_documents({}),
        "active_competitions": await db.competitions.count_documents({"status": "active"}),
        "proposals": await db.proposals.count_documents({}),
        "submissions": await db.submissions.count_documents({})
    }

@admin_router.get("/recent-activity")
async def get_recent_activity(user: dict = Depends(require_role("superadmin"))):
    notifications = await db.notifications.find({"to_user_id": None}, {"_id": 0}).sort("created_at", -1).to_list(20)
    for n in notifications:
        if isinstance(n.get('created_at'), str):
            n['created_at'] = datetime.fromisoformat(n['created_at'])
    return notifications

# ============== SETTINGS ROUTES ==============
@settings_router.get("/")
async def get_settings(user: dict = Depends(require_role("superadmin"))):
    settings = await db.platform_settings.find_one({"id": "platform_settings"}, {"_id": 0})
    if not settings:
        default = PlatformSettings()
        return default.model_dump()
    return settings

@settings_router.put("/")
async def update_settings(update_data: PlatformSettingsUpdate, user: dict = Depends(require_role("superadmin"))):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    for key in ["upload_limits", "homepage_feature_limits"]:
        if key in update_dict and hasattr(update_dict[key], 'model_dump'):
            update_dict[key] = update_dict[key].model_dump()
    
    await db.platform_settings.update_one({"id": "platform_settings"}, {"$set": update_dict}, upsert=True)
    await create_audit_log(user["user_id"], user["email"], "update", "settings", "platform_settings", "Platform settings updated")
    
    return {"message": "Settings updated"}

@settings_router.post("/init")
async def init_settings():
    existing = await db.platform_settings.find_one({"id": "platform_settings"})
    if existing:
        return {"message": "Settings already exist"}
    
    default = PlatformSettings()
    doc = default.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.platform_settings.insert_one(doc)
    return {"message": "Settings initialized"}

# ============== AUDIT ROUTES ==============
@audit_router.get("/")
async def get_audit_logs(user: dict = Depends(require_role("superadmin")), page: int = 1, limit: int = 50, entity_type: Optional[str] = None):
    skip = (page - 1) * limit
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    
    total = await db.audit_logs.count_documents(query)
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log.get('created_at'), str):
            log['created_at'] = datetime.fromisoformat(log['created_at'])
    
    return {"logs": logs, "total": total, "page": page, "limit": limit}

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(content_router)
api_router.include_router(projects_router)
api_router.include_router(competitions_router)
api_router.include_router(proposals_router)
api_router.include_router(submissions_router)
api_router.include_router(notifications_router)
api_router.include_router(upload_router)
api_router.include_router(admin_router)
api_router.include_router(settings_router)
api_router.include_router(audit_router)

app.include_router(api_router)

from utils.upload import UPLOAD_DIR
from fastapi.staticfiles import StaticFiles

# Ensure dir exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount static uploads
from utils.upload import UPLOAD_DIR

# ensure upload dir exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
