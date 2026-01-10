import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Plus, ArrowLeft, Eye, Trash2, Award } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { competitionsAPI, submissionsAPI } from '../../lib/api';
import { formatDate, formatCurrency, getCategoryLabel } from '../../lib/utils';
import { toast } from 'sonner';
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

// Competitions List
export const ClientCompetitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await competitionsAPI.my();
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
      <div data-testid="client-competitions">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Competitions</h1>
            <p className="text-slate-600">Manage your design competitions</p>
          </div>
          <Link to="/client/competitions/new" className="btn-gradient flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Competition
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
        ) : competitions.length === 0 ? (
          <div className="card p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No competitions yet</h3>
            <p className="text-slate-600 mb-6">Create your first competition to find talented designers.</p>
            <Link to="/client/competitions/new" className="btn-gradient">
              Create Competition
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {competitions.map((comp, i) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{comp.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        comp.status === 'active' ? 'bg-green-100 text-green-700' :
                        comp.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{comp.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{getCategoryLabel(comp.category)}</span>
                      <span>{comp.submission_count || 0} entries</span>
                      <span>Ends {formatDate(comp.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/client/competitions/${comp.id}`}
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
                          <AlertDialogTitle>Delete Competition?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. All submissions will be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(comp.id)}
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

// Create Competition
export const CreateCompetition = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brief, setBrief] = useState('');
  const [category, setCategory] = useState('ui-ux');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [skills, setSkills] = useState('');
  const [firstPrize, setFirstPrize] = useState('');
  const [secondPrize, setSecondPrize] = useState('');
  const [thirdPrize, setThirdPrize] = useState('');

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
    
    if (!title || !description || !brief || !startDate || !endDate) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const prizes = [];
      if (firstPrize) prizes.push({ position: 1, amount: parseFloat(firstPrize), description: '1st Place' });
      if (secondPrize) prizes.push({ position: 2, amount: parseFloat(secondPrize), description: '2nd Place' });
      if (thirdPrize) prizes.push({ position: 3, amount: parseFloat(thirdPrize), description: '3rd Place' });

      await competitionsAPI.create({
        title,
        description,
        brief,
        category,
        start_date: startDate,
        end_date: endDate,
        skills_required: skillsArray,
        prizes,
      });
      toast.success('Competition created successfully!');
      navigate('/client/competitions');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create competition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div data-testid="create-competition">
        <Link 
          to="/client/competitions"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competitions
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Competition</h1>
          <p className="text-slate-600 mb-8">Launch a design competition</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Competition Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="e.g., Mobile App Design Challenge"
                  data-testid="competition-title"
                />
              </div>

              <div>
                <label className="label">Short Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Brief overview of the competition..."
                  data-testid="competition-description"
                />
              </div>

              <div>
                <label className="label">Detailed Brief *</label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className="input min-h-[150px]"
                  placeholder="Detailed requirements and guidelines..."
                  data-testid="competition-brief"
                />
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Prizes ($)</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">1st Place</p>
                    <input
                      type="number"
                      value={firstPrize}
                      onChange={(e) => setFirstPrize(e.target.value)}
                      className="input"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">2nd Place</p>
                    <input
                      type="number"
                      value={secondPrize}
                      onChange={(e) => setSecondPrize(e.target.value)}
                      className="input"
                      placeholder="300"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">3rd Place</p>
                    <input
                      type="number"
                      value={thirdPrize}
                      onChange={(e) => setThirdPrize(e.target.value)}
                      className="input"
                      placeholder="100"
                    />
                  </div>
                </div>
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
                data-testid="competition-submit"
              >
                {loading ? 'Creating...' : 'Create Competition'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Competition Detail with Submissions
export const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

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
        navigate('/client/competitions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleSetWinner = async (submissionId, position) => {
    try {
      await submissionsAPI.setWinner(submissionId, position);
      toast.success(`Winner #${position} selected!`);
      const subRes = await submissionsAPI.forCompetition(id);
      setSubmissions(subRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to set winner');
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
      <div data-testid="competition-detail">
        <Link 
          to="/client/competitions"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competitions
        </Link>

        <div className="card p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">{competition?.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              competition?.status === 'active' ? 'bg-green-100 text-green-700' :
              competition?.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {competition?.status}
            </span>
          </div>
          <p className="text-slate-600 mb-4">{competition?.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{getCategoryLabel(competition?.category)}</span>
            <span>{formatDate(competition?.start_date)} - {formatDate(competition?.end_date)}</span>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Submissions ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No submissions yet. Share your competition to attract designers!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                        {sub.designer_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{sub.title}</p>
                        <p className="text-sm text-slate-500">by {sub.designer_name}</p>
                      </div>
                    </div>
                    {sub.is_winner && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        <Award className="w-4 h-4" />
                        #{sub.position} Winner
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-3 text-slate-600">{sub.description}</p>

                  {!sub.is_winner && (
                    <div className="flex gap-2 mt-4">
                      {[1, 2, 3].map(pos => (
                        <button
                          key={pos}
                          onClick={() => handleSetWinner(sub.id, pos)}
                          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium text-sm"
                        >
                          Set #{pos} Winner
                        </button>
                      ))}
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

export default ClientCompetitions;
