import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { authAPI } from '../lib/api';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      setSent(true);
      // For demo purposes, show the reset token (in production, this would be sent via email)
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
      }
      toast.success('Password reset instructions sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6" data-testid="forgot-password-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-block mb-8">
          <span className="text-3xl font-black gradient-text">DEZX</span>
        </Link>

        {!sent ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Forgot password?
            </h1>
            <p className="text-slate-600 mb-8">
              Enter your email and we'll send you reset instructions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-12"
                    placeholder="you@example.com"
                    data-testid="forgot-email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full py-4 text-lg flex items-center justify-center gap-2"
                data-testid="forgot-submit"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Check your email
            </h1>
            <p className="text-slate-600 mb-6">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            
            {/* Demo: Show reset link */}
            {resetToken && (
              <div className="p-4 bg-violet-50 rounded-xl mb-6">
                <p className="text-sm text-violet-700 mb-2">Demo Mode - Reset Link:</p>
                <Link 
                  to={`/reset-password?token=${resetToken}`}
                  className="text-violet-600 font-medium hover:underline break-all"
                >
                  Click here to reset password
                </Link>
              </div>
            )}
          </div>
        )}

        <Link 
          to="/login" 
          className="flex items-center justify-center gap-2 mt-8 text-slate-600 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
