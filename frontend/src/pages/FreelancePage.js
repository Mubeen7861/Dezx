import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Briefcase, DollarSign, Clock, Users, ArrowRight, 
  X, SlidersHorizontal, ArrowUpDown, Calendar, RefreshCw 
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { projectsAPI } from '../lib/api';
import { formatCurrency, formatDate, getCategoryLabel, truncate } from '../lib/utils';

// Skeleton loading card - defined outside component to avoid recreation on each render
const SkeletonCard = () => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="skeleton h-6 w-16 rounded-full" />
      <div className="skeleton h-4 w-24" />
    </div>
    <div className="skeleton h-6 w-3/4 mb-3" />
    <div className="skeleton h-4 w-full mb-2" />
    <div className="skeleton h-4 w-2/3 mb-4" />
    <div className="flex gap-2 mb-4">
      <div className="skeleton h-7 w-20 rounded-full" />
      <div className="skeleton h-7 w-24 rounded-full" />
    </div>
    <div className="flex items-center gap-4 mb-4">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-4 w-20" />
    </div>
    <div className="skeleton h-px w-full mb-4" />
    <div className="flex items-center justify-between">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-4 w-24" />
    </div>
  </div>
);

const FreelancePage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [category, setCategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [skills, setSkills] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'ui-ux', label: 'UI/UX Design' },
    { value: 'graphic-design', label: 'Graphic Design' },
    { value: 'branding', label: 'Branding' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'logo', label: 'Logo Design' },
    { value: 'web-design', label: 'Web Design' },
    { value: 'mobile-app', label: 'Mobile App' },
    { value: 'other', label: 'Other' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'budget-high', label: 'Budget: High to Low' },
    { value: 'budget-low', label: 'Budget: Low to High' },
    { value: 'deadline', label: 'Deadline Soonest' },
  ];

  const hasActiveFilters = category || budgetMin || budgetMax || skills;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: 'open' };
      if (category) params.category = category;
      if (budgetMin) params.budget_min = parseFloat(budgetMin);
      if (budgetMax) params.budget_max = parseFloat(budgetMax);
      if (skills) params.skills = skills;
      
      const response = await projectsAPI.list(params);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, [category, budgetMin, budgetMax, skills]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Client-side filtering and sorting
  const filteredAndSortedProjects = React.useMemo(() => {
    let result = [...projects];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.skills_required?.some(s => s.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'budget-high':
        result.sort((a, b) => (b.budget_max || 0) - (a.budget_max || 0));
        break;
      case 'budget-low':
        result.sort((a, b) => (a.budget_min || 0) - (b.budget_min || 0));
        break;
      case 'deadline':
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return result;
  }, [projects, search, sortBy]);

  const clearAllFilters = () => {
    setCategory('');
    setBudgetMin('');
    setBudgetMax('');
    setSkills('');
    setSearch('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="freelance-page">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-8 md:pt-40 md:pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Freelance <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-lg text-slate-600">
              Browse open design projects and send your proposals to land your next gig.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="pb-6">
        <div className="container">
          <div className="card p-4 md:p-6">
            {/* Main Search Row */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects by title, description, or skills..."
                  className="input pl-12 w-full"
                  data-testid="search-projects"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Select */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input md:w-48"
                data-testid="filter-category"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              {/* Sort Select */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400 hidden md:block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input md:w-44"
                  data-testid="sort-projects"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Toggle Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center justify-center gap-2 ${showFilters ? 'bg-violet-100 text-violet-700' : ''}`}
                data-testid="toggle-filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden md:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-violet-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Budget Range */}
                      <div>
                        <label className="label text-sm">Budget Min ($)</label>
                        <input
                          type="number"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                          placeholder="0"
                          className="input"
                          data-testid="filter-budget-min"
                        />
                      </div>
                      <div>
                        <label className="label text-sm">Budget Max ($)</label>
                        <input
                          type="number"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                          placeholder="10000"
                          className="input"
                          data-testid="filter-budget-max"
                        />
                      </div>

                      {/* Skills Filter */}
                      <div className="md:col-span-2">
                        <label className="label text-sm">Skills (comma separated)</label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="Figma, UI/UX, Mobile Design..."
                          className="input"
                          data-testid="filter-skills"
                        />
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-2"
                          data-testid="clear-filters"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Results Count */}
      <section className="pb-4">
        <div className="container">
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              {loading ? (
                <span className="skeleton h-5 w-32 inline-block" />
              ) : (
                <>
                  <span className="font-semibold text-slate-900">{filteredAndSortedProjects.length}</span> projects found
                </>
              )}
            </p>
            {hasActiveFilters && !loading && (
              <div className="flex flex-wrap gap-2">
                {category && (
                  <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm flex items-center gap-1">
                    {getCategoryLabel(category)}
                    <button onClick={() => setCategory('')} className="hover:text-violet-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(budgetMin || budgetMax) && (
                  <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm flex items-center gap-1">
                    ${budgetMin || '0'} - ${budgetMax || '∞'}
                    <button onClick={() => { setBudgetMin(''); setBudgetMax(''); }} className="hover:text-violet-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {skills && (
                  <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm flex items-center gap-1">
                    Skills: {skills.split(',').length}
                    <button onClick={() => setSkills('')} className="hover:text-violet-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="pb-24">
        <div className="container">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-12 text-center"
            >
              <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects found</h3>
              <p className="text-slate-600 mb-6">Try adjusting your search or filters.</p>
              {hasActiveFilters && (
                <button 
                  onClick={clearAllFilters}
                  className="btn-secondary"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link 
                    to={`/freelance/${project.id}`}
                    className="card p-6 block h-full group"
                    data-testid={`project-card-${project.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className={`badge ${project.status === 'open' ? 'badge-success' : 'badge-primary'}`}>
                        {project.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatDate(project.created_at)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed line-clamp-2">
                      {truncate(project.description, 100)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                        {getCategoryLabel(project.category)}
                      </span>
                      {project.skills_required?.slice(0, 2).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                          {skill}
                        </span>
                      ))}
                      {project.skills_required?.length > 2 && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                          +{project.skills_required.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      {(project.budget_min || project.budget_max) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {project.budget_min && project.budget_max 
                            ? `${formatCurrency(project.budget_min)} - ${formatCurrency(project.budget_max)}`
                            : project.budget_max ? `Up to ${formatCurrency(project.budget_max)}` : formatCurrency(project.budget_min)
                          }
                        </span>
                      )}
                      {project.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(project.deadline)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <Users className="w-4 h-4" />
                      <span>{project.proposal_count || 0} proposals</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-sm text-slate-600">
                        by <span className="font-medium">{project.client_name}</span>
                      </span>
                      <span className="text-violet-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FreelancePage;
