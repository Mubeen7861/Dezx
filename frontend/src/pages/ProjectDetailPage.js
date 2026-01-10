import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, DollarSign, Clock, Users, Calendar, Send, Briefcase, 
  Paperclip, X, Upload, FileText, Image as ImageIcon, CheckCircle
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { projectsAPI, proposalsAPI, uploadAPI } from '../lib/api';
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
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Proposal form state
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [attachments, setAttachments] = useState([]);

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

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limit total attachments
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 attachments allowed');
      return;
    }

    setUploadingFile(true);
    try {
      for (const file of files) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 10MB per file.`);
          continue;
        }

        const response = await uploadAPI.upload(file, 'proposals');
        setAttachments(prev => [...prev, {
          name: file.name,
          url: response.data.url,
          type: file.type,
          size: file.size
        }]);
      }
      toast.success('File(s) uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    
    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }

    if (coverLetter.length < 50) {
      toast.error('Cover letter should be at least 50 characters');
      return;
    }

    setSubmitting(true);
    try {
      await proposalsAPI.create({
        project_id: id,
        cover_letter: coverLetter,
        proposed_budget: proposedBudget ? parseFloat(proposedBudget) : null,
        estimated_duration: estimatedDuration || null,
        attachments: attachments.map(a => a.url),
      });
      toast.success('Proposal submitted successfully!');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCoverLetter('');
    setProposedBudget('');
    setEstimatedDuration('');
    setAttachments([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <div className="pt-32 pb-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="skeleton h-6 w-32 mb-8" />
              <div className="card p-8 mb-6">
                <div className="skeleton h-6 w-24 mb-6" />
                <div className="skeleton h-10 w-3/4 mb-4" />
                <div className="flex gap-4 mb-6">
                  <div className="skeleton h-8 w-32 rounded-full" />
                  <div className="skeleton h-8 w-40" />
                  <div className="skeleton h-8 w-28" />
                </div>
                <div className="skeleton h-16 w-full rounded-xl" />
              </div>
              <div className="card p-8">
                <div className="skeleton h-6 w-48 mb-4" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4" />
              </div>
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
              className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-8 transition-colors"
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
                  <span className={`badge ${project.status === 'open' ? 'badge-success' : project.status === 'in_progress' ? 'badge-primary' : 'badge-secondary'}`}>
                    {project.status.replace('_', ' ')}
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
                    <span className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
                      <DollarSign className="w-4 h-4" />
                      {project.budget_min && project.budget_max 
                        ? `${formatCurrency(project.budget_min)} - ${formatCurrency(project.budget_max)}`
                        : project.budget_max ? `Up to ${formatCurrency(project.budget_max)}` : formatCurrency(project.budget_min)
                      }
                    </span>
                  )}
                  {project.deadline && (
                    <span className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
                      <Calendar className="w-4 h-4" />
                      Due {formatDate(project.deadline)}
                    </span>
                  )}
                  <span className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
                    <Users className="w-4 h-4" />
                    {project.proposal_count || 0} proposals
                  </span>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-violet-50/30 rounded-xl border border-slate-100">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-200">
                    {project.client_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-lg">{project.client_name}</p>
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
                      <span 
                        key={i} 
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
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
                    <div className="text-center py-4">
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
                      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-xl">Submit Your Proposal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitProposal} className="space-y-5 mt-4">
                          {/* Cover Letter */}
                          <div>
                            <label className="label">
                              Cover Letter <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              className="input min-h-[180px] resize-none"
                              placeholder="Introduce yourself and explain why you're the best fit for this project. Highlight relevant experience and how you plan to approach this work..."
                              data-testid="proposal-cover-letter"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              {coverLetter.length}/500 characters (min 50)
                            </p>
                          </div>

                          {/* Budget & Duration */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="label">Proposed Budget ($)</label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="number"
                                  value={proposedBudget}
                                  onChange={(e) => setProposedBudget(e.target.value)}
                                  className="input input-icon-left-sm"
                                  placeholder="1500"
                                  data-testid="proposal-budget"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="label">Estimated Duration</label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  value={estimatedDuration}
                                  onChange={(e) => setEstimatedDuration(e.target.value)}
                                  className="input input-icon-left-sm"
                                  placeholder="2 weeks"
                                  data-testid="proposal-duration"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Attachments */}
                          <div>
                            <label className="label">Attachments (Optional)</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-violet-300 transition-colors">
                              <input
                                type="file"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                multiple
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.fig,.sketch"
                                disabled={uploadingFile}
                              />
                              <label 
                                htmlFor="file-upload" 
                                className="flex flex-col items-center justify-center cursor-pointer py-4"
                              >
                                {uploadingFile ? (
                                  <div className="flex items-center gap-2 text-violet-600">
                                    <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                                    Uploading...
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600 text-center">
                                      <span className="text-violet-600 font-medium">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      PDF, DOC, PNG, JPG up to 10MB each (max 5 files)
                                    </p>
                                  </>
                                )}
                              </label>
                            </div>

                            {/* Uploaded files list */}
                            {attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {attachments.map((file, index) => (
                                  <div 
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                                        {getFileIcon(file.type)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                                          {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {formatFileSize(file.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeAttachment(index)}
                                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Submit Button */}
                          <button
                            type="submit"
                            disabled={submitting || uploadingFile}
                            className="btn-gradient w-full py-3 flex items-center justify-center gap-2"
                            data-testid="proposal-submit"
                          >
                            {submitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5" />
                                Submit Proposal
                              </>
                            )}
                          </button>

                          <p className="text-xs text-slate-500 text-center">
                            By submitting, you agree to our terms and conditions.
                          </p>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-600">
                        Only designers can submit proposals. {' '}
                        <Link to="/freelance" className="text-violet-600 font-medium hover:underline">
                          Browse other projects
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Project Closed Message */}
              {project.status !== 'open' && (
                <div className="card p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    This project is {project.status.replace('_', ' ')}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    This project is no longer accepting new proposals.
                  </p>
                  <Link to="/freelance" className="btn-secondary">
                    Browse Open Projects
                  </Link>
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
