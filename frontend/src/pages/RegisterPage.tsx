import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe2, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      error('Please complete all required fields');
      return;
    }
    if (password.length < 6) {
      error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role });
      success('Account registered successfully! Welcome to Darukaa.Earth.');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d0b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 shadow-xl shadow-emerald-950/60 mb-4">
          <Globe2 className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
        <p className="mt-2 text-sm text-gray-400">
          Join Darukaa.Earth to monitor carbon and biodiversity reserves
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-[#0f1714] py-8 px-6 shadow-2xl border border-[#1f352b] rounded-3xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Goodall"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Email Address */}
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
                  placeholder="jane@conservation.org"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Password */}
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Platform Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="USER">User (View & Analyze)</option>
                <option value="ADMIN">Administrator (Create & Manage Sites)</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
