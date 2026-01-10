import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Trophy,
  FileText,
  Send,
  User,
  Settings,
  LogOut,
  Bell,
  Users,
  Edit,
  BarChart3,
  Menu,
  X,
  ScrollText,
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    if (user?.role === 'designer') {
      return [
        { href: '/designer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/designer/submissions', label: 'My Submissions', icon: Trophy },
        { href: '/designer/proposals', label: 'My Proposals', icon: Send },
        { href: '/designer/profile', label: 'Profile', icon: User },
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
    } else if (user?.role === 'client') {
      return [
        { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/client/projects', label: 'My Projects', icon: Briefcase },
        { href: '/client/competitions', label: 'My Competitions', icon: Trophy },
        { href: '/client/profile', label: 'Profile', icon: User },
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
    } else if (user?.role === 'superadmin') {
      return [
        { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/super-admin/users', label: 'Users', icon: Users },
        { href: '/super-admin/content', label: 'Site Content', icon: Edit },
        { href: '/super-admin/projects', label: 'All Projects', icon: Briefcase },
        { href: '/super-admin/competitions', label: 'All Competitions', icon: Trophy },
        { href: '/super-admin/settings', label: 'Settings', icon: Settings },
        { href: '/super-admin/audit', label: 'Audit Logs', icon: ScrollText },
        { href: '/notifications', label: 'Notifications', icon: Bell },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black gradient-text">DEZX</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                data-testid={`sidebar-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-600"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="text-xl font-black gradient-text">DEZX</Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-slate-200
          transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
