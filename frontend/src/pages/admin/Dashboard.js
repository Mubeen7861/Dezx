import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Briefcase, Trophy, FileText, Activity, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI, notificationsAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          adminAPI.stats(),
          adminAPI.recentActivity()
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'violet', link: '/super-admin/users' },
    { label: 'Designers', value: stats?.designers || 0, icon: Users, color: 'blue', link: '/super-admin/users' },
    { label: 'Clients', value: stats?.clients || 0, icon: Users, color: 'green', link: '/super-admin/users' },
    { label: 'Projects', value: stats?.projects || 0, icon: Briefcase, color: 'amber', link: '/super-admin/projects' },
    { label: 'Competitions', value: stats?.competitions || 0, icon: Trophy, color: 'pink', link: '/super-admin/competitions' },
    { label: 'Proposals', value: stats?.proposals || 0, icon: FileText, color: 'cyan', link: '/super-admin/projects' },
  ];

  return (
    <DashboardLayout>
      <div data-testid="admin-dashboard">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Overview of platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={stat.link} className="card p-4 block hover:shadow-lg transition-shadow">
                <stat.icon className={`w-8 h-8 text-${stat.color}-500 mb-2`} />
                <p className="text-2xl font-bold text-slate-900">{loading ? '-' : stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-violet-600" />
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type.includes('new') ? 'bg-green-500' : 'bg-violet-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-slate-900">{item.message}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                  {item.link && (
                    <Link to={item.link} className="text-violet-600 text-sm font-medium hover:underline">
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
