import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Plus, ArrowLeft, Eye, Trash2, CheckCircle, XCircle, 
  DollarSign, Clock, Calendar, User, FileText, ExternalLink, 
  MessageSquare, Award, MoreVertical, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { projectsAPI, proposalsAPI } from '../../lib/api';
import { formatDate, formatCurrency, getCategoryLabel } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// Projects List
export const ClientProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const handleClose = async (id) => {
    try {
      await projectsAPI.close(id);
      setProjects(projects.map(p => p.id === id ? { ...p, status: 'closed' } : p));
      toast.success('Project closed');
    } catch (error) {
      toast.error('Failed to close project');
    }
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const statusCounts = {
    all: projects.length,
    open: projects.filter(p => p.status === 'open').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    closed: projects.filter(p => p.status === 'closed').length,
  };

  return (
    <DashboardLayout>
      <div data-testid="client-projects">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Projects</h1>
            <p className="text-slate-600">Manage your freelance projects and review proposals</p>
          </div>
          <Link to="/client/projects/new" className="btn-gradient flex items-center gap-2" data-testid="new-project-btn">
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'closed', label: 'Closed' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.value 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label} ({statusCounts[tab.value]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="skeleton h-6 w-1/3 mb-2" />
                    <div className="skeleton h-4 w-2/3 mb-3" />
                    <div className="flex gap-4">
                      <div className="skeleton h-4 w-24" />
                      <div className="skeleton h-4 w-20" />
                      <div className="skeleton h-4 w-28" />
                    </div>
                  </div>
                  <div className="skeleton h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 text-center"
          >
            <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {filter === 'all' ? 'No projects yet' : `No ${filter.replace('_', ' ')} projects`}
            </h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all' 
                ? 'Create your first project to find designers.'
                : 'Try changing the filter to see other projects.'
              }
            </p>
            {filter === 'all' && (
              <Link to="/client/projects/new" className="btn-gradient">
                Create Project
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        to={`/client/projects/${project.id}`}
                        className="font-semibold text-slate-900 text-lg hover:text-violet-600 transition-colors"
                      >
                        {project.title}
                      </Link>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'open' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'completed' ? 'bg-violet-100 text-violet-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {getCategoryLabel(project.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {project.proposal_count || 0} proposals
                      </span>
                      {project.budget_max && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Posted {formatDate(project.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/client/projects/${project.id}`}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-violet-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/client/projects/${project.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/freelance/${project.id}`} className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View Public Page
                          </Link>
                        </DropdownMenuItem>
                        {project.status === 'open' && (
                          <DropdownMenuItem 
                            onClick={() => handleClose(project.id)}
                            className="text-amber-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Close Project
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    { value: 'mobile-app', label: 'Mobile App' },
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
          className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Project</h1>
          <p className="text-slate-600 mb-8">Post a project to find talented designers</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Project Title <span className="text-red-500">*</span></label>
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
                <label className="label">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[150px]"
                  placeholder="Describe your project requirements in detail..."
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
                  min={new Date().toISOString().split('T')[0]}
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
                className="btn-gradient w-full py-3 flex items-center justify-center gap-2"
                data-testid="project-submit"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Project
                  </>
                )}
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
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleApprove = async () => {
    if (!selectedProposal) return;
    
    setProcessingId(selectedProposal.id);
    try {
      await proposalsAPI.approve(selectedProposal.id);
      toast.success(`Approved ${selectedProposal.designer_name}'s proposal!`);
      setApproveDialogOpen(false);
      setSelectedProposal(null);
      // Refresh data
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;
    
    setProcessingId(selectedProposal.id);
    try {
      await proposalsAPI.reject(selectedProposal.id);
      toast.success('Proposal rejected');
      setRejectDialogOpen(false);
      setSelectedProposal(null);
      setProposals(proposals.map(p => 
        p.id === selectedProposal.id ? { ...p, status: 'rejected' } : p
      ));
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="skeleton h-6 w-32 mb-6" />
        <div className="card p-8 mb-6">
          <div className="skeleton h-8 w-1/2 mb-4" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-3/4" />
        </div>
        <div className="card p-8">
          <div className="skeleton h-6 w-40 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div data-testid="project-detail">
        <Link 
          to="/client/projects"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Project Info Card */}
        <div className="card p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project?.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project?.status === 'open' ? 'bg-green-100 text-green-700' :
                project?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                project?.status === 'completed' ? 'bg-violet-100 text-violet-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {project?.status?.replace('_', ' ')}
              </span>
            </div>
            <Link 
              to={`/freelance/${project?.id}`}
              className="text-sm text-violet-600 hover:underline flex items-center gap-1"
            >
              View Public Page
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-slate-600 mb-4">{project?.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {getCategoryLabel(project?.category)}
            </span>
            {project?.budget_min && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}
              </span>
            )}
            {project?.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Due {formatDate(project.deadline)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {proposals.length} proposals
            </span>
          </div>
        </div>

        {/* Proposals Section */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Proposals ({proposals.length})
            </h2>
            {project?.status === 'in_progress' && (
              <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Award className="w-4 h-4" />
                Designer Selected
              </span>
            )}
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No proposals yet</h3>
              <p className="text-slate-500">Share your project to attract designers!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal, i) => (
                <motion.div 
                  key={proposal.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-5 border rounded-xl transition-colors ${
                    proposal.status === 'approved' 
                      ? 'border-green-200 bg-green-50/50' 
                      : proposal.status === 'rejected'
                      ? 'border-red-100 bg-red-50/30'
                      : 'border-slate-200 hover:border-violet-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {proposal.designer_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-lg">{proposal.designer_name}</p>
                        <p className="text-sm text-slate-500">{formatDate(proposal.created_at)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(proposal.status)}`}>
                      {proposal.status === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {proposal.status}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 mb-4 whitespace-pre-wrap">{proposal.cover_letter}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                    {proposal.proposed_budget && (
                      <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(proposal.proposed_budget)}
                      </span>
                    )}
                    {proposal.estimated_duration && (
                      <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4" />
                        {proposal.estimated_duration}
                      </span>
                    )}
                    {proposal.attachments?.length > 0 && (
                      <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                        <FileText className="w-4 h-4" />
                        {proposal.attachments.length} attachment(s)
                      </span>
                    )}
                  </div>

                  {proposal.status === 'pending' && project?.status === 'open' && (
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setApproveDialogOpen(true);
                        }}
                        disabled={processingId === proposal.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                        data-testid={`approve-proposal-${proposal.id}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve & Hire
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setRejectDialogOpen(true);
                        }}
                        disabled={processingId === proposal.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 font-medium text-sm transition-colors"
                        data-testid={`reject-proposal-${proposal.id}`}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Approve Confirmation Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                Approve Proposal
              </DialogTitle>
              <DialogDescription className="pt-2">
                You&apos;re about to approve <span className="font-semibold text-slate-900">{selectedProposal?.designer_name}&apos;s</span> proposal.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-amber-800 mb-2">What happens next:</p>
                <ul className="text-amber-700 space-y-1">
                  <li>• All other proposals will be automatically rejected</li>
                  <li>• The project status will change to "In Progress"</li>
                  <li>• The designer will be notified of your selection</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <button 
                onClick={() => setApproveDialogOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleApprove}
                disabled={processingId}
                className="btn-gradient bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {processingId ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirm & Approve
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Confirmation Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-6 h-6" />
                Reject Proposal
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to reject <span className="font-semibold text-slate-900">{selectedProposal?.designer_name}</span>'s proposal?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-slate-600">
                The designer will be notified that their proposal was not selected. 
                This action cannot be undone.
              </p>
            </div>

            <DialogFooter>
              <button 
                onClick={() => setRejectDialogOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={processingId}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                {processingId ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject Proposal
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClientProjects;
