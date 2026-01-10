import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Plus, ArrowLeft, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { projectsAPI, proposalsAPI } from '../../lib/api';
import { formatDate, formatCurrency, getCategoryLabel } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

// Projects List
export const ClientProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsAPI.my();
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
      <div data-testid="client-projects">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Projects</h1>
            <p className="text-slate-600">Manage your freelance projects</p>
          </div>
          <Link to="/client/projects/new" className="btn-gradient flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Project
          </Link>
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
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 mb-6">Create your first project to find designers.</p>
            <Link to="/client/projects/new" className="btn-gradient">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{project.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'open' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{getCategoryLabel(project.category)}</span>
                      <span>{project.proposal_count || 0} proposals</span>
                      <span>Posted {formatDate(project.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/client/projects/${project.id}`}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-violet-600"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. All proposals will be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(project.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

// Create Project
export const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ui-ux');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [skills, setSkills] = useState('');

  const categories = [
    { value: 'ui-ux', label: 'UI/UX Design' },
    { value: 'graphic-design', label: 'Graphic Design' },
    { value: 'branding', label: 'Branding' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'logo', label: 'Logo Design' },
    { value: 'web-design', label: 'Web Design' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      await projectsAPI.create({
        title,
        description,
        category,
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        deadline: deadline || null,
        skills_required: skillsArray,
      });
      toast.success('Project created successfully!');
      navigate('/client/projects');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div data-testid="create-project">
        <Link 
          to="/client/projects"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Project</h1>
          <p className="text-slate-600 mb-8">Post a project to find designers</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Project Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="e.g., Mobile App UI Design"
                  data-testid="project-title"
                />
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[150px]"
                  placeholder="Describe your project requirements..."
                  data-testid="project-description"
                />
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                  data-testid="project-category"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Budget Min ($)</label>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="input"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="label">Budget Max ($)</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="input"
                    placeholder="2000"
                  />
                </div>
              </div>

              <div>
                <label className="label">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="input"
                  placeholder="Figma, UI/UX, Mobile Design"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full py-3"
                data-testid="project-submit"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Project Detail with Proposals
export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, proposalsRes] = await Promise.all([
          projectsAPI.get(id),
          proposalsAPI.forProject(id)
        ]);
        setProject(projectRes.data);
        setProposals(proposalsRes.data);
      } catch (error) {
        console.error('Failed to fetch project:', error);
        toast.error('Project not found');
        navigate('/client/projects');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleApprove = async (proposalId) => {
    try {
      await proposalsAPI.approve(proposalId);
      toast.success('Proposal approved!');
      // Refresh data
      const [projectRes, proposalsRes] = await Promise.all([
        projectsAPI.get(id),
        proposalsAPI.forProject(id)
      ]);
      setProject(projectRes.data);
      setProposals(proposalsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async (proposalId) => {
    try {
      await proposalsAPI.reject(proposalId);
      toast.success('Proposal rejected');
      setProposals(proposals.map(p => 
        p.id === proposalId ? { ...p, status: 'rejected' } : p
      ));
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="skeleton h-10 w-1/3 mb-4" />
        <div className="skeleton h-6 w-2/3 mb-8" />
        <div className="skeleton h-40 w-full" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div data-testid="project-detail">
        <Link 
          to="/client/projects"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="card p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">{project?.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project?.status === 'open' ? 'bg-green-100 text-green-700' :
              project?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {project?.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-600 mb-4">{project?.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{getCategoryLabel(project?.category)}</span>
            {project?.budget_min && <span>Budget: {formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}</span>}
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Proposals ({proposals.length})
          </h2>

          {proposals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No proposals yet. Share your project to attract designers!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map(proposal => (
                <div key={proposal.id} className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                        {proposal.designer_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{proposal.designer_name}</p>
                        <p className="text-sm text-slate-500">{formatDate(proposal.created_at)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      proposal.status === 'approved' ? 'bg-green-100 text-green-700' :
                      proposal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>
                  
                  <p className="mt-3 text-slate-600">{proposal.cover_letter}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    {proposal.proposed_budget && <span>Budget: {formatCurrency(proposal.proposed_budget)}</span>}
                    {proposal.estimated_duration && <span>Duration: {proposal.estimated_duration}</span>}
                  </div>

                  {proposal.status === 'pending' && project?.status === 'open' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleApprove(proposal.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(proposal.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
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

export default ClientProjects;
