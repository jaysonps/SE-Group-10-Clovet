import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [identifier, setIdentifier] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);

  const from = (location.state as any)?.from?.pathname || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      login(data);

      const role: UserRole = data.role;
      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'seller') {
        navigate('/seller');
      } else if (role === 'verifier') {
        navigate('/verifier');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md sleek-card border-none p-12 space-y-12"
      >
        <div className="text-center space-y-4">
          <Link to="/" className="text-4xl font-display font-black italic tracking-tighter text-black uppercase leading-none">CLOVET</Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-black tracking-tighter uppercase leading-tight">Welcome Back</h1>
            <p className="sleek-label opacity-40">Identity Authentication required</p>
          </div>
        </div>

        {resetSent ? (
          <div className="space-y-8 py-4">
            <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Mail className="text-black" size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-black">Check Your Inbox</p>
                <p className="text-xs font-bold text-gray-400 leading-relaxed">
                  We've sent a password reset link to{' '}
                  <span className="text-black font-black">{identifier || 'your email'}</span>.
                </p>
              </div>
            </div>
            <button onClick={() => setResetSent(false)} className="sleek-button-secondary w-full py-5 text-sm">
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="sleek-label text-black">Username or Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="clovet_user"
                    className="sleek-input pl-12"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="sleek-label text-black">Password</label>
                  <button
                    type="button"
                    onClick={() => setResetSent(true)}
                    className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    className="sleek-input pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="sleek-button-primary w-full py-5 text-sm disabled:opacity-50">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            {error && (
              <p className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </p>
            )}
          </form>
        )}

        <div className="text-center pt-4">
          <p className="text-xs font-bold text-gray-400">
            New to the community?{' '}
            <Link to="/register" className="text-black font-black uppercase hover:underline ml-2">Join Now</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
