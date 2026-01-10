# DEZX Platform - Product Requirements Document

## Overview
DEZX is a premium freelance marketplace and design competitions platform where designers join challenges, build portfolio proof, and win freelance projects.

## Architecture
- **Frontend**: React with Framer Motion animations, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with httpOnly cookies
- **File Upload**: Local storage (Cloudinary-ready)

## User Roles & Permissions
| Role | Capabilities |
|------|-------------|
| Designer | Submit competition entries, send proposals for freelance projects |
| Client | Create freelance projects, create competitions, receive/view proposals |
| Superadmin | Full control over everything + receives notifications for all activity |

## Core Features Implemented
### Landing Page (CMS-Driven)
- [x] Hero section with dynamic content
- [x] Features section (bento grid)
- [x] How It Works section
- [x] Reputation teaser
- [x] FAQs accordion
- [x] Footer with social links

### Authentication
- [x] User registration (designer/client roles)
- [x] Login with JWT
- [x] Logout
- [x] Forgot password flow
- [x] Reset password flow
- [x] Role-based route protection

### Freelance Marketplace
- [x] Browse open projects
- [x] Project details page
- [x] Submit proposals (designers)
- [x] View/approve/reject proposals (clients)
- [x] Create new projects (clients)

### Design Competitions
- [x] Browse competitions (active/upcoming/completed)
- [x] Competition details page
- [x] Submit entries (designers)
- [x] View submissions (clients)
- [x] Set winners (clients)
- [x] Create new competitions (clients)

### Dashboards
- [x] Designer dashboard (stats, recent activity, opportunities)
- [x] Client dashboard (manage projects & competitions)
- [x] Super Admin dashboard (platform stats, user management, CMS)

### Admin Panel
- [x] User management (block/unblock, feature users)
- [x] Site content CMS editing
- [x] View all projects and competitions

## Database Models
- User (name, email, password, role, profile, skills, status)
- SiteContent (hero, features, how it works, FAQs, footer)
- Project (title, description, category, budget, deadline, skills)
- Competition (title, brief, category, prizes, dates, skills)
- Proposal (cover letter, budget, duration, status)
- Submission (title, description, files, votes, position)
- Notification (type, message, link, read status)

## Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dezx.com | admin123 |
| Designer | sarah@designer.com | password123 |
| Designer | marcus@designer.com | password123 |
| Designer | emily@designer.com | password123 |
| Client | client@techstart.com | password123 |
| Client | hello@creative.co | password123 |

## What's Been Implemented (Jan 10, 2026)
- Complete full-stack DEZX platform MVP
- Premium light theme with violet gradients
- Framer Motion animations
- JWT authentication with role-based access
- Full CRUD for projects, competitions, proposals, submissions
- CMS for landing page content
- Admin panel with user management
- Seed data with demo accounts

## Prioritized Backlog
### P0 (Critical)
- ✅ All MVP features complete

### P1 (Next Phase)
- Cloudinary integration for file uploads
- Email notifications (SendGrid/Resend)
- Advanced search and filtering
- Designer portfolios
- Rating and review system

### P2 (Future)
- Courses marketplace
- Jobs board
- Assets marketplace
- Designer verification badges
- Payment integration (Stripe)
- Real-time notifications (WebSocket)

## Next Tasks
1. Integrate Cloudinary when API keys available
2. Add email notifications for proposals/submissions
3. Implement designer portfolio pages
4. Add payment processing for competitions
