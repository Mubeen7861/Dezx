import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Eye, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { projectsAPI } from '../../lib/api';
import { formatDate, getCategoryLabel } from '../../lib/utils';
import { toast } from 'sonner';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsAPI.list();
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <DashboardLayout>
      <div data-testid="admin-projects">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Projects</h1>
          <p className="text-slate-600">Manage all freelance projects</p>
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
        ) : projects.length === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No projects found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{project.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'open' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>by {project.client_name}</span>
                      <span>{getCategoryLabel(project.category)}</span>
                      <span>{project.proposal_count || 0} proposals</span>
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/freelance/${project.id}`}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
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

export default AdminProjects;
