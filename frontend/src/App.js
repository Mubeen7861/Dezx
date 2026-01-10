import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import '@/App.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import FreelancePage from './pages/FreelancePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CompetitionsPage from './pages/CompetitionsPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';

// Designer Pages
import DesignerDashboard from './pages/designer/Dashboard';
import DesignerProposals from './pages/designer/Proposals';
import DesignerSubmissions from './pages/designer/Submissions';
import DesignerProfile from './pages/designer/Profile';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import { ClientProjects, CreateProject, ProjectDetail } from './pages/client/Projects';
import { ClientCompetitions, CreateCompetition, CompetitionDetail } from './pages/client/Competitions';
import ClientProfile from './pages/client/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminContent from './pages/admin/Content';
import AdminProjects from './pages/admin/Projects';
import AdminCompetitions from './pages/admin/Competitions';
import AdminSettings from './pages/admin/Settings';
import AdminAudit from './pages/admin/Audit';

// Notifications
import NotificationsPage from './pages/NotificationsPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.is_blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Blocked</h1>
          <p className="text-slate-600">Your account has been blocked. Please contact support.</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route - Redirect if authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'designer':
        return <Navigate to="/designer/dashboard" replace />;
      case 'client':
        return <Navigate to="/client/dashboard" replace />;
      case 'superadmin':
        return <Navigate to="/super-admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/freelance" element={<FreelancePage />} />
      <Route path="/freelance/:id" element={<ProjectDetailPage />} />
      <Route path="/competitions" element={<CompetitionsPage />} />
      <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Designer Routes */}
      <Route path="/designer/dashboard" element={
        <ProtectedRoute allowedRoles={['designer']}>
          <DesignerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/designer/proposals" element={
        <ProtectedRoute allowedRoles={['designer']}>
          <DesignerProposals />
        </ProtectedRoute>
      } />
      <Route path="/designer/submissions" element={
        <ProtectedRoute allowedRoles={['designer']}>
          <DesignerSubmissions />
        </ProtectedRoute>
      } />
      <Route path="/designer/profile" element={
        <ProtectedRoute allowedRoles={['designer']}>
          <DesignerProfile />
        </ProtectedRoute>
      } />

      {/* Client Routes */}
      <Route path="/client/dashboard" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/client/projects" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientProjects />
        </ProtectedRoute>
      } />
      <Route path="/client/projects/new" element={
        <ProtectedRoute allowedRoles={['client']}>
          <CreateProject />
        </ProtectedRoute>
      } />
      <Route path="/client/projects/:id" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ProjectDetail />
        </ProtectedRoute>
      } />
      <Route path="/client/competitions" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientCompetitions />
        </ProtectedRoute>
      } />
      <Route path="/client/competitions/new" element={
        <ProtectedRoute allowedRoles={['client']}>
          <CreateCompetition />
        </ProtectedRoute>
      } />
      <Route path="/client/competitions/:id" element={
        <ProtectedRoute allowedRoles={['client']}>
          <CompetitionDetail />
        </ProtectedRoute>
      } />
      <Route path="/client/profile" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientProfile />
        </ProtectedRoute>
      } />

      {/* Super Admin Routes */}
      <Route path="/super-admin/dashboard" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/users" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/content" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminContent />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/projects" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminProjects />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/competitions" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminCompetitions />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/settings" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminSettings />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/audit" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminAudit />
        </ProtectedRoute>
      } />

      {/* Notifications (all authenticated users) */}
      <Route path="/notifications" element={
        <ProtectedRoute allowedRoles={['designer', 'client', 'superadmin']}>
          <NotificationsPage />
        </ProtectedRoute>
      } />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
