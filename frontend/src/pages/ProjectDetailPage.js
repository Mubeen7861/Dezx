import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Clock, Users, Calendar, Send, Briefcase } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { projectsAPI, proposalsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, getCategoryLabel } from '../lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.get(id);
        setProject(response.data);
      } catch (error) {
        console.error('Failed to fetch project:', error);
        toast.error('Project not found');
        navigate('/freelance');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    
    if (!coverLetter) {
      toast.error('Please write a cover letter');
      return;
    }

    setSubmitting(true);
    try {
      await proposalsAPI.create({
        project_id: id,
        cover_letter: coverLetter,
        proposed_budget: proposedBudget ? parseFloat(proposedBudget) : null,
        estimated_duration: estimatedDuration || null,
      });
      toast.success('Proposal submitted successfully!');
      setDialogOpen(false);
      setCoverLetter('');
      setProposedBudget('');
      setEstimatedDuration('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <div className="pt-32 pb-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="skeleton h-10 w-1/2 mb-4" />
              <div className="skeleton h-6 w-full mb-2" />
              <div className="skeleton h-6 w-3/4 mb-8" />
              <div className="skeleton h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="project-detail-page">
      <Header />

      <section className="pt-32 pb-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link 
              to="/freelance"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="card p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <span className={`badge ${project.status === 'open' ? 'badge-success' : 'badge-primary'}`}>
                    {project.status}
                  </span>
                  <span className="text-sm text-slate-500">
                    Posted {formatDate(project.created_at)}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {project.title}
                </h1>

                <div className="flex flex-wrap gap-4 mb-6">
                  <span className="px-4 py-2 bg-violet-50 text-violet-700 font-medium rounded-full">
                    {getCategoryLabel(project.category)}
                  </span>
                  {(project.budget_min || project.budget_max) && (
                    <span className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="w-5 h-5" />
                      {project.budget_min && project.budget_max 
                        ? `${formatCurrency(project.budget_min)} - ${formatCurrency(project.budget_max)}`
                        : project.budget_max ? `Up to ${formatCurrency(project.budget_max)}` : formatCurrency(project.budget_min)
                      }
                    </span>
                  )}
                  {project.deadline && (
                    <span className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-5 h-5" />
                      Due {formatDate(project.deadline)}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-slate-600">
                    <Users className="w-5 h-5" />
                    {project.proposal_count || 0} proposals
                  </span>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {project.client_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{project.client_name}</p>
                    <p className="text-sm text-slate-500">Client</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="card p-8 mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Project Description</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {project.skills_required && project.skills_required.length > 0 && (
                <div className="card p-8 mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Skills Required</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.skills_required.map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Proposal */}
              {project.status === 'open' && (
                <div className="card p-8">
                  {!isAuthenticated ? (
                    <div className="text-center">
                      <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Want to submit a proposal?
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Login or create an account to send your proposal.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Link to="/login" className="btn-secondary">
                          Login
                        </Link>
                        <Link to="/register" className="btn-gradient">
                          Create Account
                        </Link>
                      </div>
                    </div>
                  ) : user?.role === 'designer' ? (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <button 
                          className="btn-gradient w-full py-4 text-lg flex items-center justify-center gap-2"
                          data-testid="submit-proposal-btn"
                        >
                          <Send className="w-5 h-5" />
                          Submit Proposal
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Submit Your Proposal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitProposal} className="space-y-4 mt-4">
                          <div>
                            <label className="label">Cover Letter *</label>
                            <textarea
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              className="input min-h-[150px]"
                              placeholder="Introduce yourself and explain why you're the best fit for this project..."
                              data-testid="proposal-cover-letter"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="label">Proposed Budget ($)</label>
                              <input
                                type="number"
                                value={proposedBudget}
                                onChange={(e) => setProposedBudget(e.target.value)}
                                className="input"
                                placeholder="500"
                                data-testid="proposal-budget"
                              />
                            </div>
                            <div>
                              <label className="label">Estimated Duration</label>
                              <input
                                type="text"
                                value={estimatedDuration}
                                onChange={(e) => setEstimatedDuration(e.target.value)}
                                className="input"
                                placeholder="2 weeks"
                                data-testid="proposal-duration"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="btn-gradient w-full py-3"
                            data-testid="proposal-submit"
                          >
                            {submitting ? 'Submitting...' : 'Submit Proposal'}
                          </button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-600">
                        Only designers can submit proposals. {' '}
                        <Link to="/freelance" className="text-violet-600 font-medium">
                          Browse other projects
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProjectDetailPage;
