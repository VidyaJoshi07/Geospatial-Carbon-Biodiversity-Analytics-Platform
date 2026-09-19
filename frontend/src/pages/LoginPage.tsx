import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe2, ShieldCheck, UserCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      success('Logged in successfully');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'ADMIN' | 'USER') => {
    if (role === 'ADMIN') {
      setEmail('admin@example.com');
      setPassword('Admin@123456');
    } else {
      setEmail('user@example.com');
      setPassword('User@123456');
    }
  };

  return (
    <div className="min-h-screen bg-[#080d0b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient ecological glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 shadow-xl shadow-emerald-950/60 mb-4">
          <Globe2 className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          DARUKAA<span className="text-emerald-400 font-normal">.EARTH</span>
        </h2>
        <p className="mt-2 text-sm text-gray-400 max-w-xs mx-auto">
          Geospatial Intelligence for Carbon & Biodiversity Projects
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-[#0f1714] py-8 px-6 shadow-2xl border border-[#1f352b] rounded-3xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* 1-Click Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-[#192b23]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-center mb-3">
              One-Click Demo Credentials
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('ADMIN')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-[#13221b] border border-emerald-500/30 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Demo Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('USER')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-[#131d22] border border-cyan-500/30 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Demo User</span>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
              Create User Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
