import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Briefcase, Palette } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('designer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = await register(name, email, password, role);
      toast.success(`Welcome to DEZX, ${user.name}!`);
      
      // Redirect based on role
      switch (user.role) {
        case 'designer':
          navigate('/designer/dashboard');
          break;
        case 'client':
          navigate('/client/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex" data-testid="register-page">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-block mb-8">
            <span className="text-3xl font-black gradient-text">DEZX</span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Join DEZX
          </h1>
          <p className="text-slate-600 mb-8">
            Create your account and start your design journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('designer')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'designer'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid="role-designer"
                >
                  <Palette className={`w-6 h-6 mx-auto mb-2 ${role === 'designer' ? 'text-violet-600' : 'text-slate-400'}`} />
                  <p className={`font-semibold ${role === 'designer' ? 'text-violet-600' : 'text-slate-600'}`}>Designer</p>
                  <p className="text-xs text-slate-500 mt-1">Find work & compete</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'client'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid="role-client"
                >
                  <Briefcase className={`w-6 h-6 mx-auto mb-2 ${role === 'client' ? 'text-violet-600' : 'text-slate-400'}`} />
                  <p className={`font-semibold ${role === 'client' ? 'text-violet-600' : 'text-slate-600'}`}>Client</p>
                  <p className="text-xs text-slate-500 mt-1">Post projects & contests</p>
                </button>
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input input-icon-left"
                  placeholder="John Doe"
                  data-testid="register-name"
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-icon-left"
                  placeholder="you@example.com"
                  data-testid="register-email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-icon-both"
                  placeholder="Min. 6 characters"
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-4 text-lg flex items-center justify-center gap-2"
              data-testid="register-submit"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 font-semibold hover:text-violet-700">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-600 to-indigo-600 items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <h2 className="text-4xl font-bold mb-6">
            Start your design career today
          </h2>
          <p className="text-xl text-white/80 leading-relaxed mb-8">
            Whether you're a designer looking for opportunities or a client seeking talent, DEZX is where great design happens.
          </p>
          <div className="space-y-4">
            {[
              'Access to premium design projects',
              'Weekly design competitions',
              'Build your portfolio & reputation',
              'Connect with top clients'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
