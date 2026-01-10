import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { proposalsAPI } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';

const DesignerProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await proposalsAPI.my();
        setProposals(response.data);
      } catch (error) {
        console.error('Failed to fetch proposals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <DashboardLayout>
      <div data-testid="designer-proposals">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Proposals</h1>
          <p className="text-slate-600">Track all your submitted proposals</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-1/3 mb-2" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="card p-12 text-center">
            <Send className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No proposals yet</h3>
            <p className="text-slate-600 mb-6">Start by browsing open projects and submitting proposals.</p>
            <Link to="/freelance" className="btn-gradient">
              Browse Projects
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal, i) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(proposal.status)}
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {proposal.project_title || 'Project Proposal'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Submitted {formatDate(proposal.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(proposal.status)}`}>
                    {proposal.status}
                  </span>
                </div>

                <p className="text-slate-600 mb-4 line-clamp-2">{proposal.cover_letter}</p>

                <div className="flex items-center gap-6 text-sm text-slate-500">
                  {proposal.proposed_budget && (
                    <span>Budget: {formatCurrency(proposal.proposed_budget)}</span>
                  )}
                  {proposal.estimated_duration && (
                    <span>Duration: {proposal.estimated_duration}</span>
                  )}
                </div>

                {proposal.status === 'approved' && (
                  <div className="mt-4 p-4 bg-green-50 rounded-xl">
                    <p className="text-green-700 font-medium">
                      Congratulations! Your proposal was approved.
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DesignerProposals;
