# DEZX Platform - Product Requirements Document

## Overview
DEZX is a premium freelance marketplace and design competitions platform where designers join challenges, build portfolio proof, and win freelance projects.

## Architecture
- **Frontend**: React with Framer Motion animations, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with httpOnly cookies
- **File Upload**: Local storage (Cloudinary-ready when keys provided)

## User Roles & Permissions
| Role | Capabilities |
|------|-------------|
| Designer | Submit competition entries, send proposals for freelance projects |
| Client | Create freelance projects, create competitions, receive/view proposals |
| Superadmin | Full control over everything + receives notifications for all activity |

## Core Features Implemented

### Phase 1 - MVP (COMPLETED Jan 10, 2026)

#### Landing Page (CMS-Driven)
- [x] Hero section with dynamic content
- [x] Features section (bento grid)
- [x] How It Works section
- [x] Reputation teaser
- [x] FAQs accordion
- [x] Footer with social links

#### Authentication
- [x] User registration (designer/client roles)
- [x] Login with JWT
- [x] Logout
- [x] Forgot password flow
- [x] Reset password flow
- [x] Role-based route protection

#### Freelance Marketplace
- [x] Browse open projects
- [x] Project details page
- [x] Submit proposals (designers)
- [x] View/approve/reject proposals (clients)
- [x] Create new projects (clients)

#### Design Competitions
- [x] Browse competitions (active/upcoming/completed)
- [x] Competition details page
- [x] Submit entries (designers)
- [x] View submissions (clients)
- [x] Set winners (clients)
- [x] Create new competitions (clients)

#### Dashboards
- [x] Designer dashboard (stats, recent activity, opportunities)
- [x] Client dashboard (manage projects & competitions)
- [x] Super Admin dashboard (platform stats, user management, CMS)

### Phase 2 - GOD MODE Admin Panel (COMPLETED Jan 10, 2026)

#### Admin Panel Features
- [x] User management (block/unblock, feature users)
- [x] Site content CMS editing
- [x] View all projects and competitions
- [x] Platform Settings page (feature toggles, upload limits)
- [x] Audit Logs page (track all admin actions)
- [x] Full notification system with bell icon

#### Sidebar Navigation (All Roles)
- [x] Designer: Dashboard, My Submissions, My Proposals, Profile, Notifications
- [x] Client: Dashboard, My Projects, My Competitions, Profile, Notifications
- [x] Superadmin: Dashboard, Users, Site Content, All Projects, All Competitions, Settings, Audit Logs, Notifications

## Database Models
- User (name, email, password, role, profile, skills, status)
- SiteContent (hero, features, how it works, FAQs, footer)
- Project (title, description, category, budget, deadline, skills)
- Competition (title, brief, category, prizes, dates, skills)
- Proposal (cover letter, budget, duration, status)
- Submission (title, description, files, votes, position)
- Notification (type, message, link, read status)
- PlatformSettings (feature toggles, upload limits, homepage limits)
- AuditLog (admin actions tracking)

## Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dezx.com | admin123 |
| Designer | sarah@designer.com | password123 |
| Designer | marcus@designer.com | password123 |
| Designer | emily@designer.com | password123 |
| Client | client@techstart.com | password123 |
| Client | hello@creative.co | password123 |

## API Endpoints
- `/api/auth/` - Authentication (register, login, logout, me, forgot-password, reset-password)
- `/api/users/` - User management
- `/api/content/` - Site content CMS
- `/api/projects/` - Freelance projects CRUD
- `/api/competitions/` - Design competitions CRUD
- `/api/proposals/` - Proposal management
- `/api/submissions/` - Competition submissions
- `/api/notifications/` - Notification system
- `/api/admin/` - Admin stats and activity
- `/api/settings/` - Platform settings
- `/api/audit/` - Audit logs
- `/api/upload/` - File upload (MOCKED)

## Known Limitations
- **File Uploads**: Currently MOCKED to local storage (`/app/uploads/`). Cloudinary integration ready, pending API keys from user.

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] All MVP features
- [x] GOD MODE Super Admin panel
- [x] Full notification system
- [x] Settings and Audit pages

### P1 (Next Phase)
- [ ] Full Freelance Module (filters, proposal attachments, approve/reject workflow)
- [ ] Full Competition Module (status tabs, submission flow, winner selection)
- [ ] Cloudinary integration for file uploads (pending API keys)
- [ ] Email notifications (SendGrid/Resend)

### P2 (Future)
- [ ] Designer portfolios
- [ ] Rating and review system
- [ ] Courses marketplace
- [ ] Jobs board
- [ ] Assets marketplace
- [ ] Designer verification badges
- [ ] Payment integration (Stripe)
- [ ] Real-time notifications (WebSocket)

## Test Results (Jan 10, 2026)
- Backend API tests: 28/28 passed (100%)
- Frontend UI tests: All critical flows verified (100%)
- Test file: `/app/tests/test_dezx_api.py`

## Files of Reference
- `/app/backend/server.py` - Main API server
- `/app/frontend/src/App.js` - Route configuration
- `/app/frontend/src/components/layout/DashboardLayout.js` - Sidebar navigation
- `/app/frontend/src/lib/api.js` - API client
- `/app/backend/seed.py` - Database seeding
- `/app/backend/models/` - All database models
