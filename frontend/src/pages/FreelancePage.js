import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Briefcase, DollarSign, Clock, Users, ArrowRight } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { projectsAPI } from '../lib/api';
import { formatCurrency, formatDate, getCategoryLabel, truncate } from '../lib/utils';

const FreelancePage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'ui-ux', label: 'UI/UX Design' },
    { value: 'graphic-design', label: 'Graphic Design' },
    { value: 'branding', label: 'Branding' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'logo', label: 'Logo Design' },
    { value: 'web-design', label: 'Web Design' },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const params = {};
        if (category) params.category = category;
        params.status = 'open';
        const response = await projectsAPI.list(params);
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [category]);

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(search.toLowerCase()) ||
    project.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="freelance-page">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
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

      {/* Filters */}
      <section className="pb-8">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="input pl-12"
                data-testid="search-projects"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input w-full md:w-48"
                data-testid="filter-category"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="pb-24">
        <div className="container">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card p-6">
                  <div className="skeleton h-6 w-3/4 mb-4" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-2/3 mb-6" />
                  <div className="flex gap-2">
                    <div className="skeleton h-8 w-20 rounded-full" />
                    <div className="skeleton h-8 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects found</h3>
              <p className="text-slate-600">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    to={`/freelance/${project.id}`}
                    className="card p-6 block h-full"
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

                    <h3 className="text-xl font-bold text-slate-900 mb-2 hover:text-violet-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                      {truncate(project.description, 120)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                        {getCategoryLabel(project.category)}
                      </span>
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
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {project.proposal_count || 0} proposals
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-sm text-slate-600">
                        by <span className="font-medium">{project.client_name}</span>
                      </span>
                      <span className="text-violet-600 font-medium text-sm flex items-center gap-1">
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
