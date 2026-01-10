import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, FileText, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../lib/api';
import { toast } from 'sonner';

const DesignerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      await usersAPI.update(user.id, {
        name,
        bio,
        skills: skillsArray,
      });
      
      updateUser({ ...user, name, bio, skills: skillsArray });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div data-testid="designer-profile">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
          <p className="text-slate-600">Update your profile information</p>
        </div>

        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            {/* Profile Image */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{user?.name}</h3>
                <p className="text-slate-500">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium capitalize">
                  {user?.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  data-testid="profile-name"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input bg-slate-100"
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input min-h-[120px]"
                  placeholder="Tell us about yourself..."
                  data-testid="profile-bio"
                />
              </div>

              <div>
                <label className="label">Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="input"
                  placeholder="UI/UX Design, Figma, React, etc."
                  data-testid="profile-skills"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full py-3 flex items-center justify-center gap-2"
                data-testid="profile-save"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
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

export default DesignerProfile;
