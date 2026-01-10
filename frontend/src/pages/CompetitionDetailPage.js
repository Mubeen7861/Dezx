import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Award, Users, Trophy, Send } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { competitionsAPI, submissionsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getCategoryLabel, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const CompetitionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [competition, setCompetition] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, subRes] = await Promise.all([
          competitionsAPI.get(id),
          submissionsAPI.forCompetition(id)
        ]);
        setCompetition(compRes.data);
        setSubmissions(subRes.data);
      } catch (error) {
        console.error('Failed to fetch competition:', error);
        toast.error('Competition not found');
        navigate('/competitions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await submissionsAPI.create({
        competition_id: id,
        title,
        description,
      });
      toast.success('Entry submitted successfully!');
      setDialogOpen(false);
      setTitle('');
      setDescription('');
      // Refresh submissions
      const subRes = await submissionsAPI.forCompetition(id);
      setSubmissions(subRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'upcoming':
        return 'badge-warning';
      case 'completed':
        return 'badge-primary';
      default:
        return 'badge-primary';
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

  if (!competition) return null;

  const canSubmit = competition.status === 'active' || competition.status === 'upcoming';

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="competition-detail-page">
      <Header />

      <section className="pt-32 pb-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link 
              to="/competitions"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Competitions
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="card p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <span className={`badge ${getStatusBadge(competition.status)}`}>
                    {competition.status}
                  </span>
                  <span className="text-sm text-slate-500">
                    Posted {formatDate(competition.created_at)}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {competition.title}
                </h1>

                <div className="flex flex-wrap gap-4 mb-6">
                  <span className="px-4 py-2 bg-violet-50 text-violet-700 font-medium rounded-full">
                    {getCategoryLabel(competition.category)}
                  </span>
                  <span className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-5 h-5" />
                    {formatDate(competition.start_date)} - {formatDate(competition.end_date)}
                  </span>
                  <span className="flex items-center gap-2 text-slate-600">
                    <Users className="w-5 h-5" />
                    {competition.submission_count || 0} entries
                  </span>
                </div>

                {/* Prizes */}
                {competition.prizes && competition.prizes.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-600" />
                      Prizes
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {competition.prizes.map((prize, i) => (
                        <div key={i} className="text-center">
                          <p className="text-2xl font-bold text-amber-600">
                            {prize.amount ? formatCurrency(prize.amount) : `#${prize.position}`}
                          </p>
                          <p className="text-sm text-slate-600">{prize.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {competition.client_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{competition.client_name}</p>
                    <p className="text-sm text-slate-500">Host</p>
                  </div>
                </div>
              </div>

              {/* Brief */}
              <div className="card p-8 mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Competition Brief</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-4">
                    {competition.description}
                  </p>
                  {competition.brief && (
                    <>
                      <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Detailed Brief</h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {competition.brief}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Skills */}
              {competition.skills_required && competition.skills_required.length > 0 && (
                <div className="card p-8 mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Skills Required</h2>
                  <div className="flex flex-wrap gap-2">
                    {competition.skills_required.map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submissions */}
              {submissions.length > 0 && (
                <div className="card p-8 mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    Submissions ({submissions.length})
                  </h2>
                  <div className="space-y-4">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                              {sub.designer_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{sub.title}</p>
                              <p className="text-sm text-slate-500">by {sub.designer_name}</p>
                            </div>
                          </div>
                          {sub.is_winner && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                              <Trophy className="w-4 h-4" />
                              #{sub.position}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-slate-600 text-sm">{sub.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Entry */}
              {canSubmit && (
                <div className="card p-8">
                  {!isAuthenticated ? (
                    <div className="text-center">
                      <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Want to participate?
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Login or create an account to submit your entry.
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
                          data-testid="submit-entry-btn"
                        >
                          <Send className="w-5 h-5" />
                          Submit Entry
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Submit Your Entry</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitEntry} className="space-y-4 mt-4">
                          <div>
                            <label className="label">Entry Title *</label>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className="input"
                              placeholder="Give your entry a title"
                              data-testid="entry-title"
                            />
                          </div>
                          <div>
                            <label className="label">Description *</label>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="input min-h-[150px]"
                              placeholder="Describe your design approach and concept..."
                              data-testid="entry-description"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="btn-gradient w-full py-3"
                            data-testid="entry-submit"
                          >
                            {submitting ? 'Submitting...' : 'Submit Entry'}
                          </button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-600">
                        Only designers can submit entries. {' '}
                        <Link to="/competitions" className="text-violet-600 font-medium">
                          Browse other competitions
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

export default CompetitionDetailPage;
