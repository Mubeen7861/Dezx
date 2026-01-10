import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Eye, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { competitionsAPI } from '../../lib/api';
import { formatDate, getCategoryLabel } from '../../lib/utils';
import { toast } from 'sonner';

const AdminCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await competitionsAPI.list();
        setCompetitions(response.data);
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this competition?')) return;
    try {
      await competitionsAPI.delete(id);
      setCompetitions(competitions.filter(c => c.id !== id));
      toast.success('Competition deleted');
    } catch (error) {
      toast.error('Failed to delete competition');
    }
  };

  return (
    <DashboardLayout>
      <div data-testid="admin-competitions">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Competitions</h1>
          <p className="text-slate-600">Manage all design competitions</p>
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
        ) : competitions.length === 0 ? (
          <div className="card p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No competitions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {competitions.map((comp, i) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{comp.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        comp.status === 'active' ? 'bg-green-100 text-green-700' :
                        comp.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>by {comp.client_name}</span>
                      <span>{getCategoryLabel(comp.category)}</span>
                      <span>{comp.submission_count || 0} entries</span>
                      <span>Ends {formatDate(comp.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/competitions/${comp.id}`}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCompetitions;
