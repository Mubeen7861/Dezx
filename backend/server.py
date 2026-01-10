from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
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

# Import utils
from utils.auth import hash_password, verify_password, create_token, verify_token, get_current_user, require_role
from utils.upload import save_upload, delete_upload

# Create the main app
app = FastAPI(title="DEZX API", version="1.0.0")

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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== HELPERS ==============
async def create_notification(type: str, message: str, to_user_id: str = None, link: str = None):
    """Create a notification and also notify superadmins"""
    notification = Notification(type=type, message=message, to_user_id=to_user_id, link=link)
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    
    # Also create broadcast for superadmins
    if to_user_id:
        admin_notif = Notification(type=type, message=f"[Admin] {message}", to_user_id=None, link=link)
        admin_doc = admin_notif.model_dump()
        admin_doc['created_at'] = admin_doc['created_at'].isoformat()
        await db.notifications.insert_one(admin_doc)

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
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if user_data.role not in ["designer", "client"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'designer' or 'client'")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    token = create_token(user.id, user.email, user.role)
    
    # Set cookie
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7  # 7 days
    )
    
    # Notify admins
    await create_notification("new_user", f"New {user.role} registered: {user.name}", link=f"/super-admin/users")
    
    return {
        "message": "Registration successful",
        "user": UserResponse(**user.model_dump()).model_dump(),
        "token": token
    }

@auth_router.post("/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Find user
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password
    if not verify_password(password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if blocked
    if user_doc.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Account is blocked")
    
    # Create token
    token = create_token(user_doc["id"], user_doc["email"], user_doc["role"])
    
    # Set cookie
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7
    )
    
    # Parse datetime
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return {
        "message": "Login successful",
        "user": UserResponse(**user_doc).model_dump(),
        "token": token
    }

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
        # Don't reveal if email exists
        return {"message": "If email exists, reset instructions have been sent"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.users.update_one(
        {"email": email},
        {"$set": {"reset_token": reset_token, "reset_token_expires": expires.isoformat()}}
    )
    
    # In production, send email here
    logger.info(f"Password reset token for {email}: {reset_token}")
    
    return {"message": "If email exists, reset instructions have been sent", "reset_token": reset_token}

@auth_router.post("/reset-password")
async def reset_password(request: Request):
    body = await request.json()
    token = body.get("token")
    new_password = body.get("password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and password required")
    
    user_doc = await db.users.find_one({"reset_token": token})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Check expiration
    expires = user_doc.get("reset_token_expires")
    if expires:
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reset token expired")
    
    # Update password
    await db.users.update_one(
        {"reset_token": token},
        {
            "$set": {"password_hash": hash_password(new_password)},
            "$unset": {"reset_token": "", "reset_token_expires": ""}
        }
    )
    
    return {"message": "Password reset successful"}

# ============== USER ROUTES ==============
@users_router.get("/")
async def list_users(user: dict = Depends(require_role("superadmin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0, "reset_token": 0, "reset_token_expires": 0}).to_list(1000)
    for u in users:
        if isinstance(u.get('created_at'), str):
            u['created_at'] = datetime.fromisoformat(u['created_at'])
    return users

@users_router.get("/{user_id}")
async def get_user(user_id: str):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "reset_token": 0, "reset_token_expires": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    return user_doc

@users_router.put("/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, user: dict = Depends(get_current_user)):
    # Users can only update themselves unless admin
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
    
    return {"message": f"User {'blocked' if new_status else 'unblocked'}", "is_blocked": new_status}

@users_router.put("/{user_id}/feature")
async def toggle_feature_user(user_id: str, user: dict = Depends(require_role("superadmin"))):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user_doc.get("is_featured", False)
    await db.users.update_one({"id": user_id}, {"$set": {"is_featured": new_status}})
    
    return {"message": f"User {'featured' if new_status else 'unfeatured'}", "is_featured": new_status}

# ============== SITE CONTENT ROUTES ==============
@content_router.get("/")
async def get_site_content():
    content = await db.site_content.find_one({"id": "site_content_main"}, {"_id": 0})
    if not content:
        # Return default content
        default = SiteContent()
        return default.model_dump()
    return content

@content_router.put("/")
async def update_site_content(update_data: SiteContentUpdate, user: dict = Depends(require_role("superadmin"))):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Serialize nested models
    if "feature_cards" in update_dict:
        update_dict["feature_cards"] = [card.model_dump() if hasattr(card, 'model_dump') else card for card in update_dict["feature_cards"]]
    if "steps" in update_dict:
        update_dict["steps"] = [step.model_dump() if hasattr(step, 'model_dump') else step for step in update_dict["steps"]]
    if "faqs" in update_dict:
        update_dict["faqs"] = [faq.model_dump() if hasattr(faq, 'model_dump') else faq for faq in update_dict["faqs"]]
    if "footer_links" in update_dict:
        update_dict["footer_links"] = [link.model_dump() if hasattr(link, 'model_dump') else link for link in update_dict["footer_links"]]
    if "social_links" in update_dict:
        update_dict["social_links"] = [link.model_dump() if hasattr(link, 'model_dump') else link for link in update_dict["social_links"]]
    if "theme_settings" in update_dict and hasattr(update_dict["theme_settings"], 'model_dump'):
        update_dict["theme_settings"] = update_dict["theme_settings"].model_dump()
    
    await db.site_content.update_one(
        {"id": "site_content_main"},
        {"$set": update_dict},
        upsert=True
    )
    
    return {"message": "Site content updated"}

@content_router.post("/init")
async def init_site_content():
    """Initialize default site content"""
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
async def list_projects(status: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Add proposal count
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
        if isinstance(project.get('deadline'), str):
            project['deadline'] = datetime.fromisoformat(project['deadline'])
        
        proposal_count = await db.proposals.count_documents({"project_id": project["id"]})
        project["proposal_count"] = proposal_count
    
    return projects

@projects_router.get("/my")
async def get_my_projects(user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"client_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
        if isinstance(project.get('deadline'), str):
            project['deadline'] = datetime.fromisoformat(project['deadline'])
        proposal_count = await db.proposals.count_documents({"project_id": project["id"]})
        project["proposal_count"] = proposal_count
    
    return projects

@projects_router.get("/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project.get('created_at'), str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if isinstance(project.get('updated_at'), str):
        project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    if isinstance(project.get('deadline'), str):
        project['deadline'] = datetime.fromisoformat(project['deadline'])
    
    proposal_count = await db.proposals.count_documents({"project_id": project_id})
    project["proposal_count"] = proposal_count
    
    return project

@projects_router.post("/")
async def create_project(project_data: ProjectCreate, user: dict = Depends(require_role("client", "superadmin"))):
    # Get user details
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
    if doc['deadline']:
        doc['deadline'] = doc['deadline'].isoformat()
    
    await db.projects.insert_one(doc)
    
    # Notify
    await create_notification("new_project", f"New project posted: {project.title}", link=f"/freelance/{project.id}")
    
    return {"message": "Project created", "project_id": project.id}

@projects_router.put("/{project_id}")
async def update_project(project_id: str, update_data: ProjectUpdate, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check ownership
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "deadline" in update_dict and update_dict["deadline"]:
        update_dict["deadline"] = datetime.fromisoformat(update_dict["deadline"]).isoformat()
    
    await db.projects.update_one({"id": project_id}, {"$set": update_dict})
    
    return {"message": "Project updated"}

@projects_router.delete("/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.projects.delete_one({"id": project_id})
    await db.proposals.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted"}

# ============== COMPETITION ROUTES ==============
@competitions_router.get("/")
async def list_competitions(status: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    competitions = await db.competitions.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for comp in competitions:
        if isinstance(comp.get('created_at'), str):
            comp['created_at'] = datetime.fromisoformat(comp['created_at'])
        if isinstance(comp.get('updated_at'), str):
            comp['updated_at'] = datetime.fromisoformat(comp['updated_at'])
        if isinstance(comp.get('start_date'), str):
            comp['start_date'] = datetime.fromisoformat(comp['start_date'])
        if isinstance(comp.get('end_date'), str):
            comp['end_date'] = datetime.fromisoformat(comp['end_date'])
        
        submission_count = await db.submissions.count_documents({"competition_id": comp["id"]})
        comp["submission_count"] = submission_count
    
    return competitions

@competitions_router.get("/my")
async def get_my_competitions(user: dict = Depends(get_current_user)):
    competitions = await db.competitions.find({"client_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for comp in competitions:
        if isinstance(comp.get('created_at'), str):
            comp['created_at'] = datetime.fromisoformat(comp['created_at'])
        if isinstance(comp.get('updated_at'), str):
            comp['updated_at'] = datetime.fromisoformat(comp['updated_at'])
        if isinstance(comp.get('start_date'), str):
            comp['start_date'] = datetime.fromisoformat(comp['start_date'])
        if isinstance(comp.get('end_date'), str):
            comp['end_date'] = datetime.fromisoformat(comp['end_date'])
        submission_count = await db.submissions.count_documents({"competition_id": comp["id"]})
        comp["submission_count"] = submission_count
    
    return competitions

@competitions_router.get("/{competition_id}")
async def get_competition(competition_id: str):
    comp = await db.competitions.find_one({"id": competition_id}, {"_id": 0})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    if isinstance(comp.get('created_at'), str):
        comp['created_at'] = datetime.fromisoformat(comp['created_at'])
    if isinstance(comp.get('updated_at'), str):
        comp['updated_at'] = datetime.fromisoformat(comp['updated_at'])
    if isinstance(comp.get('start_date'), str):
        comp['start_date'] = datetime.fromisoformat(comp['start_date'])
    if isinstance(comp.get('end_date'), str):
        comp['end_date'] = datetime.fromisoformat(comp['end_date'])
    
    submission_count = await db.submissions.count_documents({"competition_id": competition_id})
    comp["submission_count"] = submission_count
    
    return comp

@competitions_router.post("/")
async def create_competition(comp_data: CompetitionCreate, user: dict = Depends(require_role("client", "superadmin"))):
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
    
    # Set status based on dates
    now = datetime.now(timezone.utc)
    if competition.start_date > now:
        competition.status = "upcoming"
    elif competition.end_date > now:
        competition.status = "active"
    else:
        competition.status = "completed"
    
    doc = competition.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    
    await db.competitions.insert_one(doc)
    
    await create_notification("new_competition", f"New competition: {competition.title}", link=f"/competitions/{competition.id}")
    
    return {"message": "Competition created", "competition_id": competition.id}

@competitions_router.put("/{competition_id}")
async def update_competition(competition_id: str, update_data: CompetitionUpdate, user: dict = Depends(get_current_user)):
    comp = await db.competitions.find_one({"id": competition_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "start_date" in update_dict:
        update_dict["start_date"] = datetime.fromisoformat(update_dict["start_date"]).isoformat()
    if "end_date" in update_dict:
        update_dict["end_date"] = datetime.fromisoformat(update_dict["end_date"]).isoformat()
    if "prizes" in update_dict:
        update_dict["prizes"] = [p.model_dump() if hasattr(p, 'model_dump') else p for p in update_dict["prizes"]]
    
    await db.competitions.update_one({"id": competition_id}, {"$set": update_dict})
    
    return {"message": "Competition updated"}

@competitions_router.delete("/{competition_id}")
async def delete_competition(competition_id: str, user: dict = Depends(get_current_user)):
    comp = await db.competitions.find_one({"id": competition_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.competitions.delete_one({"id": competition_id})
    await db.submissions.delete_many({"competition_id": competition_id})
    
    return {"message": "Competition deleted"}

# ============== PROPOSAL ROUTES ==============
@proposals_router.get("/project/{project_id}")
async def get_project_proposals(project_id: str, user: dict = Depends(get_current_user)):
    # Check if user owns the project or is admin
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized to view proposals")
    
    proposals = await db.proposals.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for p in proposals:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    return proposals

@proposals_router.get("/my")
async def get_my_proposals(user: dict = Depends(get_current_user)):
    proposals = await db.proposals.find({"designer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for p in proposals:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        
        # Get project details
        project = await db.projects.find_one({"id": p["project_id"]}, {"_id": 0, "title": 1, "status": 1})
        if project:
            p["project_title"] = project.get("title", "Unknown")
            p["project_status"] = project.get("status", "unknown")
    
    return proposals

@proposals_router.post("/")
async def create_proposal(proposal_data: ProposalCreate, user: dict = Depends(require_role("designer", "superadmin"))):
    # Check project exists
    project = await db.projects.find_one({"id": proposal_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["status"] != "open":
        raise HTTPException(status_code=400, detail="Project is not open for proposals")
    
    # Check if already submitted
    existing = await db.proposals.find_one({"project_id": proposal_data.project_id, "designer_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already submitted a proposal for this project")
    
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
    
    await db.proposals.insert_one(doc)
    
    # Notify project owner
    await create_notification(
        "new_proposal",
        f"New proposal for '{project['title']}' from {proposal.designer_name}",
        to_user_id=project["client_id"],
        link=f"/client/projects/{project['id']}"
    )
    
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
    
    # Update proposal status
    await db.proposals.update_one({"id": proposal_id}, {"$set": {"status": "approved"}})
    
    # Reject other proposals
    await db.proposals.update_many(
        {"project_id": project["id"], "id": {"$ne": proposal_id}},
        {"$set": {"status": "rejected"}}
    )
    
    # Update project
    await db.projects.update_one(
        {"id": project["id"]},
        {"$set": {"status": "in_progress", "approved_proposal_id": proposal_id}}
    )
    
    # Notify designer
    await create_notification(
        "proposal_approved",
        f"Your proposal for '{project['title']}' has been approved!",
        to_user_id=proposal["designer_id"],
        link=f"/designer/proposals"
    )
    
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
    
    return {"message": "Proposal rejected"}

# ============== SUBMISSION ROUTES ==============
@submissions_router.get("/competition/{competition_id}")
async def get_competition_submissions(competition_id: str):
    submissions = await db.submissions.find({"competition_id": competition_id}, {"_id": 0}).sort("votes", -1).to_list(100)
    
    for s in submissions:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
        if isinstance(s.get('updated_at'), str):
            s['updated_at'] = datetime.fromisoformat(s['updated_at'])
    
    return submissions

@submissions_router.get("/my")
async def get_my_submissions(user: dict = Depends(get_current_user)):
    submissions = await db.submissions.find({"designer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for s in submissions:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
        if isinstance(s.get('updated_at'), str):
            s['updated_at'] = datetime.fromisoformat(s['updated_at'])
        
        # Get competition details
        comp = await db.competitions.find_one({"id": s["competition_id"]}, {"_id": 0, "title": 1, "status": 1})
        if comp:
            s["competition_title"] = comp.get("title", "Unknown")
            s["competition_status"] = comp.get("status", "unknown")
    
    return submissions

@submissions_router.post("/")
async def create_submission(submission_data: SubmissionCreate, user: dict = Depends(require_role("designer", "superadmin"))):
    # Check competition exists
    comp = await db.competitions.find_one({"id": submission_data.competition_id})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    if comp["status"] not in ["active", "upcoming"]:
        raise HTTPException(status_code=400, detail="Competition is not accepting submissions")
    
    # Check if already submitted
    existing = await db.submissions.find_one({"competition_id": submission_data.competition_id, "designer_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already submitted to this competition")
    
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
    
    await db.submissions.insert_one(doc)
    
    # Notify competition owner
    await create_notification(
        "new_submission",
        f"New submission for '{comp['title']}' from {submission.designer_name}",
        to_user_id=comp["client_id"],
        link=f"/client/competitions/{comp['id']}"
    )
    
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

@submissions_router.put("/{submission_id}/winner")
async def set_winner(submission_id: str, position: int = 1, user: dict = Depends(get_current_user)):
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    comp = await db.competitions.find_one({"id": submission["competition_id"]})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    if comp["client_id"] != user["user_id"] and user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update submission
    await db.submissions.update_one(
        {"id": submission_id},
        {"$set": {"is_winner": True, "position": position}}
    )
    
    # Update competition winners list
    winner_ids = comp.get("winner_ids", [])
    if submission["designer_id"] not in winner_ids:
        winner_ids.append(submission["designer_id"])
    await db.competitions.update_one(
        {"id": comp["id"]},
        {"$set": {"winner_ids": winner_ids}}
    )
    
    # Notify winner
    await create_notification(
        "competition_winner",
        f"Congratulations! You won position #{position} in '{comp['title']}'!",
        to_user_id=submission["designer_id"],
        link=f"/competitions/{comp['id']}"
    )
    
    return {"message": "Winner set"}

# ============== NOTIFICATION ROUTES ==============
@notifications_router.get("/")
async def get_notifications(user: dict = Depends(get_current_user)):
    # Get user notifications + broadcast notifications
    notifications = await db.notifications.find(
        {"$or": [{"to_user_id": user["user_id"]}, {"to_user_id": None}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    for n in notifications:
        if isinstance(n.get('created_at'), str):
            n['created_at'] = datetime.fromisoformat(n['created_at'])
    
    return notifications

@notifications_router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notification_id}, {"$set": {"is_read": True}})
    return {"message": "Notification marked as read"}

@notifications_router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"$or": [{"to_user_id": user["user_id"]}, {"to_user_id": None}]},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

# ============== UPLOAD ROUTES ==============
@upload_router.post("/")
async def upload_file(file: UploadFile = File(...), folder: str = "general", user: dict = Depends(get_current_user)):
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
    users_count = await db.users.count_documents({})
    designers_count = await db.users.count_documents({"role": "designer"})
    clients_count = await db.users.count_documents({"role": "client"})
    projects_count = await db.projects.count_documents({})
    competitions_count = await db.competitions.count_documents({})
    proposals_count = await db.proposals.count_documents({})
    submissions_count = await db.submissions.count_documents({})
    
    return {
        "total_users": users_count,
        "designers": designers_count,
        "clients": clients_count,
        "projects": projects_count,
        "competitions": competitions_count,
        "proposals": proposals_count,
        "submissions": submissions_count
    }

@admin_router.get("/recent-activity")
async def get_recent_activity(user: dict = Depends(require_role("superadmin"))):
    # Get recent notifications (admin broadcasts)
    notifications = await db.notifications.find(
        {"to_user_id": None},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    for n in notifications:
        if isinstance(n.get('created_at'), str):
            n['created_at'] = datetime.fromisoformat(n['created_at'])
    
    return notifications

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

app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

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
