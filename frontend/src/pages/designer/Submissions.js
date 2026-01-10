import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Award } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { submissionsAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const DesignerSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await submissionsAPI.my();
        setSubmissions(response.data);
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <DashboardLayout>
      <div data-testid="designer-submissions">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Submissions</h1>
          <p className="text-slate-600">Track all your competition entries</p>
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
        ) : submissions.length === 0 ? (
          <div className="card p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No submissions yet</h3>
            <p className="text-slate-600 mb-6">Join competitions and showcase your design skills!</p>
            <Link to="/competitions" className="btn-gradient">
              Browse Competitions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission, i) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-900">{submission.title}</h3>
                      {submission.is_winner && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                          <Award className="w-4 h-4" />
                          #{submission.position} Winner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {submission.competition_title || 'Competition'} • Submitted {formatDate(submission.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    submission.competition_status === 'active' ? 'bg-green-100 text-green-700' :
                    submission.competition_status === 'completed' ? 'bg-slate-100 text-slate-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {submission.competition_status || 'active'}
                  </span>
                </div>

                <p className="text-slate-600 mb-4">{submission.description}</p>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{submission.votes || 0} votes</span>
                </div>

                {submission.is_winner && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl">
                    <p className="text-amber-700 font-medium flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Congratulations on winning position #{submission.position}!
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

export default DesignerSubmissions;
