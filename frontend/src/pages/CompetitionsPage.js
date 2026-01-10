import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Trophy, Calendar, Award, Users, ArrowRight } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { competitionsAPI } from '../lib/api';
import { formatDate, getCategoryLabel, truncate, formatCurrency } from '../lib/utils';

const CompetitionsPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const statuses = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
  ];

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const params = {};
        if (status) params.status = status;
        const response = await competitionsAPI.list(params);
        setCompetitions(response.data);
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitions();
  }, [status]);

  const filteredCompetitions = competitions.filter(comp =>
    comp.title.toLowerCase().includes(search.toLowerCase()) ||
    comp.description.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="competitions-page">
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
              Design <span className="gradient-text">Competitions</span>
            </h1>
            <p className="text-lg text-slate-600">
              Compete, showcase your skills, and win prizes. Build your reputation through design challenges.
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
                placeholder="Search competitions..."
                className="input input-icon-left"
                data-testid="search-competitions"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input w-full md:w-48"
                data-testid="filter-status"
              >
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Competitions Grid */}
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
          ) : filteredCompetitions.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No competitions found</h3>
              <p className="text-slate-600">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompetitions.map((comp, i) => (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    to={`/competitions/${comp.id}`}
                    className="card p-6 block h-full"
                    data-testid={`competition-card-${comp.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className={`badge ${getStatusBadge(comp.status)}`}>
                        {comp.status}
                      </span>
                      {comp.prizes && comp.prizes.length > 0 && comp.prizes[0].amount && (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Award className="w-4 h-4" />
                          {formatCurrency(comp.prizes[0].amount)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 hover:text-violet-600 transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                      {truncate(comp.description, 120)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                        {getCategoryLabel(comp.category)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(comp.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {comp.submission_count || 0} entries
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-sm text-slate-600">
                        by <span className="font-medium">{comp.client_name}</span>
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

export default CompetitionsPage;
