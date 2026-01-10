"""
DEZX Seed Script
Creates demo data for testing the platform
"""
import asyncio
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import bcrypt
import uuid

load_dotenv()

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def seed_database():
    print("🌱 Starting database seed...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.site_content.delete_many({})
    await db.projects.delete_many({})
    await db.competitions.delete_many({})
    await db.proposals.delete_many({})
    await db.submissions.delete_many({})
    await db.notifications.delete_many({})
    print("✅ Cleared existing data")
    
    # Create Super Admin
    superadmin = {
        "id": str(uuid.uuid4()),
        "name": "Admin User",
        "email": "admin@dezx.com",
        "password_hash": hash_password("admin123"),
        "role": "superadmin",
        "profile_image": None,
        "bio": "Platform administrator",
        "skills": [],
        "is_blocked": False,
        "is_featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(superadmin)
    print(f"✅ Created superadmin: admin@dezx.com / admin123")
    
    # Create Designers
    designers = []
    designer_data = [
        {"name": "Sarah Chen", "email": "sarah@designer.com", "bio": "UI/UX Designer with 5+ years experience", "skills": ["UI/UX", "Figma", "Mobile Design"]},
        {"name": "Marcus Johnson", "email": "marcus@designer.com", "bio": "Brand designer and illustrator", "skills": ["Branding", "Illustration", "Logo Design"]},
        {"name": "Emily Rodriguez", "email": "emily@designer.com", "bio": "Web and product designer", "skills": ["Web Design", "Product Design", "Prototyping"]},
    ]
    
    for data in designer_data:
        designer = {
            "id": str(uuid.uuid4()),
            "name": data["name"],
            "email": data["email"],
            "password_hash": hash_password("password123"),
            "role": "designer",
            "profile_image": None,
            "bio": data["bio"],
            "skills": data["skills"],
            "is_blocked": False,
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(designer)
        designers.append(designer)
    print(f"✅ Created 3 designers (password: password123)")
    
    # Create Clients
    clients = []
    client_data = [
        {"name": "TechStart Inc.", "email": "client@techstart.com", "bio": "Innovative tech startup"},
        {"name": "Creative Agency", "email": "hello@creative.co", "bio": "Full-service creative agency"},
    ]
    
    for data in client_data:
        client_user = {
            "id": str(uuid.uuid4()),
            "name": data["name"],
            "email": data["email"],
            "password_hash": hash_password("password123"),
            "role": "client",
            "profile_image": None,
            "bio": data["bio"],
            "skills": [],
            "is_blocked": False,
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(client_user)
        clients.append(client_user)
    print(f"✅ Created 2 clients (password: password123)")
    
    # Create Projects
    projects = []
    project_data = [
        {
            "title": "Mobile Banking App Redesign",
            "description": "We need a complete redesign of our mobile banking application. The current design is outdated and we want a modern, user-friendly interface that appeals to millennials and Gen Z users. Key features include: dashboard overview, transaction history, money transfer, bill payments, and investment tracking.",
            "category": "ui-ux",
            "budget_min": 2000,
            "budget_max": 5000,
            "skills_required": ["UI/UX", "Mobile Design", "Figma"],
            "status": "open"
        },
        {
            "title": "E-commerce Website Design",
            "description": "Looking for a talented designer to create a modern e-commerce website design for our fashion brand. We sell premium clothing and accessories, targeting young professionals aged 25-40. Need designs for homepage, product listing, product detail, cart, and checkout pages.",
            "category": "web-design",
            "budget_min": 1500,
            "budget_max": 3000,
            "skills_required": ["Web Design", "E-commerce", "Responsive Design"],
            "status": "open"
        },
        {
            "title": "Brand Identity Package",
            "description": "We're launching a new sustainable coffee brand and need a complete brand identity package including logo, color palette, typography, and brand guidelines. The brand should convey eco-friendliness, premium quality, and modern aesthetics.",
            "category": "branding",
            "budget_min": 1000,
            "budget_max": 2500,
            "skills_required": ["Branding", "Logo Design", "Typography"],
            "status": "open"
        },
        {
            "title": "SaaS Dashboard UI Kit",
            "description": "Need a comprehensive UI kit for our B2B SaaS analytics platform. Should include various dashboard layouts, data visualization components, forms, tables, and notification systems. Must follow modern design trends and be developer-friendly.",
            "category": "ui-ux",
            "budget_min": 3000,
            "budget_max": 6000,
            "skills_required": ["UI/UX", "Dashboard Design", "Component Systems"],
            "status": "open"
        },
        {
            "title": "Social Media Content Templates",
            "description": "Create a set of 20 social media templates for Instagram and LinkedIn. Templates should be for quotes, announcements, testimonials, and promotional content. Brand colors are blue and orange.",
            "category": "graphic-design",
            "budget_min": 500,
            "budget_max": 1000,
            "skills_required": ["Graphic Design", "Social Media", "Canva/Figma"],
            "status": "open"
        },
    ]
    
    for i, data in enumerate(project_data):
        project = {
            "id": str(uuid.uuid4()),
            "title": data["title"],
            "description": data["description"],
            "client_id": clients[i % 2]["id"],
            "client_name": clients[i % 2]["name"],
            "category": data["category"],
            "budget_min": data["budget_min"],
            "budget_max": data["budget_max"],
            "deadline": (datetime.now(timezone.utc) + timedelta(days=30 + i * 10)).isoformat(),
            "skills_required": data["skills_required"],
            "attachments": [],
            "status": data["status"],
            "approved_proposal_id": None,
            "thumbnail": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=i * 2)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.projects.insert_one(project)
        projects.append(project)
    print(f"✅ Created 5 freelance projects")
    
    # Create Competitions
    competitions = []
    competition_data = [
        {
            "title": "Mobile App Design Challenge",
            "description": "Design an innovative fitness tracking app that motivates users to stay active.",
            "brief": "Create a complete mobile app design for a fitness tracking application. The app should include: onboarding flow, home dashboard, workout tracking, progress charts, social features, and settings. Focus on gamification elements to keep users engaged.",
            "category": "ui-ux",
            "prizes": [
                {"position": 1, "amount": 500, "description": "1st Place"},
                {"position": 2, "amount": 300, "description": "2nd Place"},
                {"position": 3, "amount": 100, "description": "3rd Place"}
            ],
            "skills_required": ["Mobile Design", "UI/UX", "Prototyping"],
            "status": "active"
        },
        {
            "title": "Logo Design Contest",
            "description": "Design a memorable logo for an AI-powered writing assistant.",
            "brief": "We need a logo for 'WriteAI', an AI writing assistant tool. The logo should be modern, tech-forward, and convey intelligence and creativity. Provide variations for different use cases (full logo, icon only, monochrome).",
            "category": "logo",
            "prizes": [
                {"position": 1, "amount": 300, "description": "1st Place"},
                {"position": 2, "amount": 150, "description": "2nd Place"}
            ],
            "skills_required": ["Logo Design", "Brand Identity"],
            "status": "active"
        },
        {
            "title": "Landing Page Design Challenge",
            "description": "Create a high-converting landing page design for a SaaS product.",
            "brief": "Design a landing page for a project management SaaS tool. The page should include hero section, features overview, pricing table, testimonials, and call-to-action sections. Focus on conversion optimization and modern aesthetics.",
            "category": "web-design",
            "prizes": [
                {"position": 1, "amount": 400, "description": "1st Place"},
                {"position": 2, "amount": 200, "description": "2nd Place"},
                {"position": 3, "amount": 100, "description": "3rd Place"}
            ],
            "skills_required": ["Web Design", "Landing Pages", "Conversion Design"],
            "status": "active"
        },
        {
            "title": "Icon Set Design",
            "description": "Create a cohesive icon set for a productivity app.",
            "brief": "Design a set of 30 icons for various productivity-related actions (tasks, calendar, notes, reminders, etc.). Icons should be consistent in style, work in multiple sizes, and be available in both outline and filled versions.",
            "category": "illustration",
            "prizes": [
                {"position": 1, "amount": 250, "description": "1st Place"}
            ],
            "skills_required": ["Icon Design", "Illustration", "Vector Graphics"],
            "status": "upcoming"
        },
        {
            "title": "Brand Style Guide Challenge",
            "description": "Create a comprehensive brand style guide for a modern restaurant.",
            "brief": "Develop a complete brand style guide for 'Nourish Kitchen', a farm-to-table restaurant. Include logo usage, color palette, typography, photography style, pattern elements, and application examples across various touchpoints.",
            "category": "branding",
            "prizes": [
                {"position": 1, "amount": 600, "description": "1st Place"},
                {"position": 2, "amount": 300, "description": "2nd Place"}
            ],
            "skills_required": ["Branding", "Style Guides", "Visual Design"],
            "status": "upcoming"
        },
    ]
    
    for i, data in enumerate(competition_data):
        start_offset = -5 if data["status"] == "active" else 10
        end_offset = 25 if data["status"] == "active" else 40
        
        competition = {
            "id": str(uuid.uuid4()),
            "title": data["title"],
            "description": data["description"],
            "brief": data["brief"],
            "client_id": clients[i % 2]["id"],
            "client_name": clients[i % 2]["name"],
            "category": data["category"],
            "prizes": data["prizes"],
            "start_date": (datetime.now(timezone.utc) + timedelta(days=start_offset)).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=end_offset)).isoformat(),
            "skills_required": data["skills_required"],
            "attachments": [],
            "thumbnail": None,
            "status": data["status"],
            "winner_ids": [],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=i * 3)).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.competitions.insert_one(competition)
        competitions.append(competition)
    print(f"✅ Created 5 design competitions")
    
    # Create Proposals
    proposal_descriptions = [
        "I'm excited to work on this project! With my 5+ years of experience in UI/UX design, I can deliver a modern, user-friendly solution that meets your requirements.",
        "This project aligns perfectly with my expertise. I've worked on similar projects and can bring fresh ideas while staying aligned with your brand vision.",
        "I'd love to take on this challenge. My approach focuses on user research and iterative design to ensure the final product exceeds expectations.",
    ]
    
    for i, project in enumerate(projects[:3]):
        for j, designer in enumerate(designers[:2]):
            proposal = {
                "id": str(uuid.uuid4()),
                "project_id": project["id"],
                "designer_id": designer["id"],
                "designer_name": designer["name"],
                "designer_image": None,
                "cover_letter": proposal_descriptions[(i + j) % 3],
                "proposed_budget": project["budget_min"] + (project["budget_max"] - project["budget_min"]) * 0.6,
                "estimated_duration": f"{2 + j} weeks",
                "attachments": [],
                "status": "pending",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat()
            }
            await db.proposals.insert_one(proposal)
    print(f"✅ Created 6 proposals")
    
    # Create Submissions
    submission_titles = [
        "Modern Minimalist Approach",
        "Bold and Vibrant Design",
        "Clean and Professional Style",
        "User-Centric Solution",
        "Innovative Design Concept",
    ]
    
    for i, competition in enumerate(competitions[:3]):
        for j, designer in enumerate(designers[:2]):
            submission = {
                "id": str(uuid.uuid4()),
                "competition_id": competition["id"],
                "designer_id": designer["id"],
                "designer_name": designer["name"],
                "designer_image": None,
                "title": submission_titles[(i + j) % 5],
                "description": f"My submission focuses on creating a design that balances aesthetics with functionality. I've incorporated modern design trends while ensuring the solution meets all the requirements outlined in the brief.",
                "files": [],
                "thumbnail": None,
                "votes": (10 - i - j) * 5,
                "is_winner": False,
                "position": None,
                "created_at": (datetime.now(timezone.utc) - timedelta(days=i * 2)).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.submissions.insert_one(submission)
    print(f"✅ Created 6 submissions")
    
    # Create Site Content
    site_content = {
        "id": "site_content_main",
        "hero_headline": "Where Designers Compete, Win & Get Clients",
        "hero_subheadline": "DEZX is a premium platform where designers join challenges, build portfolio proof, and win freelance projects — all in one place.",
        "primary_cta": "Join DEZX",
        "secondary_cta": "Explore Competitions",
        "micro_trust_line": "Freelance Projects • Design Competitions • Portfolio Growth • Recognition",
        "hero_banner_image": None,
        "features_title": "Launch Features",
        "feature_cards": [
            {
                "title": "Freelance Marketplace",
                "description": "Browse design projects, send proposals, and get approved faster. Built to help designers earn and grow.",
                "icon": "briefcase"
            },
            {
                "title": "Design Competitions",
                "description": "Join weekly and monthly challenges. Improve skills, earn recognition, and get featured publicly.",
                "icon": "trophy"
            }
        ],
        "how_it_works_title": "How DEZX Works",
        "steps": [
            {"step_number": 1, "title": "Create your designer profile", "description": "Sign up and showcase your skills"},
            {"step_number": 2, "title": "Compete or apply for projects", "description": "Find opportunities that match your expertise"},
            {"step_number": 3, "title": "Win, grow & get noticed", "description": "Build your reputation and portfolio"}
        ],
        "reputation_title": "Level Up Your Reputation",
        "reputation_text": "Your activity builds your credibility. Compete, deliver projects, and rise through platform recognition.",
        "faqs": [
            {"question": "Is DEZX only for UI/UX designers?", "answer": "No. DEZX is for UI/UX, graphic design, branding, and digital creators."},
            {"question": "Can beginners join competitions?", "answer": "Yes. Competitions are open for all levels and designed to help you grow fast."},
            {"question": "How do freelance approvals work?", "answer": "When you apply, the client reviews proposals and approves the best one. You'll get notified instantly."},
            {"question": "Is DEZX free?", "answer": "DEZX launch may include limited free access. Advanced features will be added soon."},
            {"question": "What features are coming next?", "answer": "Courses, jobs, assets marketplace and verification will be introduced in the next phases."}
        ],
        "footer_text": "© DEZX — The Freelance + Competition Hub for Designers",
        "footer_links": [
            {"label": "Home", "url": "/"},
            {"label": "Freelance", "url": "/freelance"},
            {"label": "Competitions", "url": "/competitions"},
            {"label": "Login", "url": "/login"},
            {"label": "Register", "url": "/register"}
        ],
        "social_links": [
            {"platform": "Twitter", "url": "https://twitter.com", "icon": "twitter"},
            {"platform": "Instagram", "url": "https://instagram.com", "icon": "instagram"},
            {"platform": "LinkedIn", "url": "https://linkedin.com", "icon": "linkedin"}
        ],
        "theme_settings": {
            "gradient_primary": "#8B5CF6",
            "gradient_secondary": "#6366F1",
            "button_style": "gradient"
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.site_content.insert_one(site_content)
    print(f"✅ Created site content")
    
    # Create some notifications
    notifications = [
        {"type": "new_user", "message": "[Admin] New designer registered: Sarah Chen", "link": "/super-admin/users"},
        {"type": "new_project", "message": "[Admin] New project posted: Mobile Banking App Redesign", "link": "/super-admin/projects"},
        {"type": "new_competition", "message": "[Admin] New competition: Mobile App Design Challenge", "link": "/super-admin/competitions"},
    ]
    
    for notif in notifications:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "type": notif["type"],
            "to_user_id": None,
            "message": notif["message"],
            "link": notif["link"],
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    print(f"✅ Created notifications")
    
    print("\n" + "="*50)
    print("🎉 Database seeded successfully!")
    print("="*50)
    print("\n📋 Test Accounts:")
    print("  Admin:    admin@dezx.com / admin123")
    print("  Designer: sarah@designer.com / password123")
    print("  Designer: marcus@designer.com / password123")
    print("  Designer: emily@designer.com / password123")
    print("  Client:   client@techstart.com / password123")
    print("  Client:   hello@creative.co / password123")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(seed_database())
