import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Send, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { proposalsAPI, submissionsAPI, competitionsAPI, projectsAPI } from '../../lib/api';
import { formatDate, truncate } from '../../lib/utils';

const DesignerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ proposals: 0, submissions: 0, approved: 0 });
  const [recentProposals, setRecentProposals] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [activeCompetitions, setActiveCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proposalsRes, submissionsRes, projectsRes, competitionsRes] = await Promise.all([
          proposalsAPI.my(),
          submissionsAPI.my(),
          projectsAPI.list({ status: 'open' }),
          competitionsAPI.list({ status: 'active' })
        ]);

        const proposals = proposalsRes.data;
        const submissions = submissionsRes.data;

        setStats({
          proposals: proposals.length,
          submissions: submissions.length,
          approved: proposals.filter(p => p.status === 'approved').length
        });

        setRecentProposals(proposals.slice(0, 3));
        setRecentSubmissions(submissions.slice(0, 3));
        setOpenProjects(projectsRes.data.slice(0, 4));
        setActiveCompetitions(competitionsRes.data.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Proposals', value: stats.proposals, icon: Send, color: 'violet' },
    { label: 'Approved', value: stats.approved, icon: TrendingUp, color: 'green' },
    { label: 'Submissions', value: stats.submissions, icon: Trophy, color: 'amber' },
  ];

  return (
    <DashboardLayout>
      <div data-testid="designer-dashboard">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-600">Here's your activity overview</p>
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
          {/* Recent Proposals */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Proposals</h2>
              <Link to="/designer/proposals" className="text-violet-600 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : recentProposals.length === 0 ? (
              <div className="text-center py-8">
                <Send className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No proposals yet</p>
                <Link to="/freelance" className="text-violet-600 text-sm font-medium">
                  Browse Projects
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProposals.map(proposal => (
                  <div key={proposal.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900">{proposal.project_title || 'Project'}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        proposal.status === 'approved' ? 'bg-green-100 text-green-700' :
                        proposal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(proposal.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Submissions</h2>
              <Link to="/designer/submissions" className="text-violet-600 text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No submissions yet</p>
                <Link to="/competitions" className="text-violet-600 text-sm font-medium">
                  Browse Competitions
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map(sub => (
                  <div key={sub.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-900">{sub.title}</p>
                      {sub.is_winner && (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                          Winner #{sub.position}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{sub.competition_title || 'Competition'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Opportunities */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Open Opportunities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Open Projects */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-slate-900">Latest Projects</h3>
              </div>
              {openProjects.slice(0, 3).map(project => (
                <Link 
                  key={project.id} 
                  to={`/freelance/${project.id}`}
                  className="block p-3 hover:bg-slate-50 rounded-lg transition-colors mb-2"
                >
                  <p className="font-medium text-slate-900">{project.title}</p>
                  <p className="text-sm text-slate-500">{truncate(project.description, 60)}</p>
                </Link>
              ))}
              <Link to="/freelance" className="text-violet-600 text-sm font-medium flex items-center gap-1 mt-2">
                View All Projects <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Active Competitions */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Active Competitions</h3>
              </div>
              {activeCompetitions.slice(0, 3).map(comp => (
                <Link 
                  key={comp.id} 
                  to={`/competitions/${comp.id}`}
                  className="block p-3 hover:bg-slate-50 rounded-lg transition-colors mb-2"
                >
                  <p className="font-medium text-slate-900">{comp.title}</p>
                  <p className="text-sm text-slate-500">Ends {formatDate(comp.end_date)}</p>
                </Link>
              ))}
              <Link to="/competitions" className="text-violet-600 text-sm font-medium flex items-center gap-1 mt-2">
                View All Competitions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DesignerDashboard;
