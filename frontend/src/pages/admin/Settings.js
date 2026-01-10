import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { settingsAPI } from '../../lib/api';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.get();
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-lg" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div data-testid="admin-settings">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Platform Settings</h1>
            <p className="text-slate-600">Manage platform-wide settings</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-gradient flex items-center gap-2">
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* Feature Toggles */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Feature Toggles</h2>
            <div className="space-y-4">
              {[
                { key: 'is_freelance_enabled', label: 'Freelance Marketplace', desc: 'Enable/disable freelance projects' },
                { key: 'is_competitions_enabled', label: 'Competitions', desc: 'Enable/disable design competitions' },
                { key: 'is_registration_enabled', label: 'User Registration', desc: 'Allow new user signups' },
                { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Put platform in maintenance mode' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.[item.key] ?? true}
                    onChange={(e) => handleChange(item.key, e.target.checked)}
                    className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                  />
                </label>
              ))}
            </div>
          </motion.div>

          {/* Upload Limits */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Upload Limits</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Proposal Max Size (MB)</label>
                <input
                  type="number"
                  value={settings?.upload_limits?.proposal_max_mb || 10}
                  onChange={(e) => handleNestedChange('upload_limits', 'proposal_max_mb', parseInt(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Submission Max Size (MB)</label>
                <input
                  type="number"
                  value={settings?.upload_limits?.submission_max_mb || 20}
                  onChange={(e) => handleNestedChange('upload_limits', 'submission_max_mb', parseInt(e.target.value))}
                  className="input"
                />
              </div>
            </div>
          </motion.div>

          {/* Homepage Limits */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Homepage Feature Limits</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Featured Projects Count</label>
                <input
                  type="number"
                  value={settings?.homepage_feature_limits?.projects_count || 6}
                  onChange={(e) => handleNestedChange('homepage_feature_limits', 'projects_count', parseInt(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Featured Competitions Count</label>
                <input
                  type="number"
                  value={settings?.homepage_feature_limits?.competitions_count || 6}
                  onChange={(e) => handleNestedChange('homepage_feature_limits', 'competitions_count', parseInt(e.target.value))}
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

export default AdminSettings;
