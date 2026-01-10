import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Trophy, Users, Plus, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, competitionsAPI } from '../../lib/api';
import { formatDate, truncate } from '../../lib/utils';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, competitions: 0, totalProposals: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentCompetitions, setRecentCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, competitionsRes] = await Promise.all([
          projectsAPI.my(),
          competitionsAPI.my()
        ]);

        const projects = projectsRes.data;
        const competitions = competitionsRes.data;

        const totalProposals = projects.reduce((sum, p) => sum + (p.proposal_count || 0), 0);

        setStats({
          projects: projects.length,
          competitions: competitions.length,
          totalProposals
        });

        setRecentProjects(projects.slice(0, 4));
        setRecentCompetitions(competitions.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'My Projects', value: stats.projects, icon: Briefcase, color: 'violet' },
    { label: 'My Competitions', value: stats.competitions, icon: Trophy, color: 'amber' },
    { label: 'Total Proposals', value: stats.totalProposals, icon: Users, color: 'green' },
  ];

  return (
    <DashboardLayout>
      <div data-testid="client-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-600">Manage your projects and competitions</p>
          </div>
          <div className="flex gap-3">
            <Link to="/client/projects/new" className="btn-secondary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Project
            </Link>
            <Link to="/client/competitions/new" className="btn-gradient flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Competition
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{loading ? '-' : stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">My Projects</h2>
              <Link to="/client/projects" className="text-violet-600 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No projects yet</p>
                <Link to="/client/projects/new" className="text-violet-600 text-sm font-medium">
                  Create Your First Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map(project => (
                  <Link 
                    key={project.id} 
                    to={`/client/projects/${project.id}`}
                    className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900">{project.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'open' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{project.proposal_count || 0} proposals</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Competitions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">My Competitions</h2>
              <Link to="/client/competitions" className="text-violet-600 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : recentCompetitions.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No competitions yet</p>
                <Link to="/client/competitions/new" className="text-violet-600 text-sm font-medium">
                  Create Your First Competition
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCompetitions.map(comp => (
                  <Link 
                    key={comp.id} 
                    to={`/client/competitions/${comp.id}`}
                    className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900">{comp.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        comp.status === 'active' ? 'bg-green-100 text-green-700' :
                        comp.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{comp.submission_count || 0} entries</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
