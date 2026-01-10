import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { contentAPI } from '../../lib/api';
import { toast } from 'sonner';

const AdminContent = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await contentAPI.get();
        setContent(response.data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentAPI.update(content);
      toast.success('Content saved successfully!');
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div data-testid="admin-content">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Site Content</h1>
            <p className="text-slate-600">Edit landing page content (CMS)</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gradient flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>

        <div className="space-y-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Hero Section</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Headline</label>
                <input
                  type="text"
                  value={content?.hero_headline || ''}
                  onChange={(e) => handleChange('hero_headline', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Subheadline</label>
                <textarea
                  value={content?.hero_subheadline || ''}
                  onChange={(e) => handleChange('hero_subheadline', e.target.value)}
                  className="input min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary CTA</label>
                  <input
                    type="text"
                    value={content?.primary_cta || ''}
                    onChange={(e) => handleChange('primary_cta', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Secondary CTA</label>
                  <input
                    type="text"
                    value={content?.secondary_cta || ''}
                    onChange={(e) => handleChange('secondary_cta', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Trust Line</label>
                <input
                  type="text"
                  value={content?.micro_trust_line || ''}
                  onChange={(e) => handleChange('micro_trust_line', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Features Section</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Section Title</label>
                <input
                  type="text"
                  value={content?.features_title || ''}
                  onChange={(e) => handleChange('features_title', e.target.value)}
                  className="input"
                />
              </div>
              <p className="text-sm text-slate-500">
                Feature cards are configured in the database. Contact developer to modify.
              </p>
            </div>
          </motion.div>

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">How It Works Section</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Section Title</label>
                <input
                  type="text"
                  value={content?.how_it_works_title || ''}
                  onChange={(e) => handleChange('how_it_works_title', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </motion.div>

          {/* Reputation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Reputation Section</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={content?.reputation_title || ''}
                  onChange={(e) => handleChange('reputation_title', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={content?.reputation_text || ''}
                  onChange={(e) => handleChange('reputation_text', e.target.value)}
                  className="input min-h-[100px]"
                />
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Footer</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Footer Text</label>
                <input
                  type="text"
                  value={content?.footer_text || ''}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminContent;
