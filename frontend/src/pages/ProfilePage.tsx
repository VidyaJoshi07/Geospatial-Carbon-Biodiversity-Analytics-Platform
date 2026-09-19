import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, LogOut, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUserProfileApi } from '../api/users';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../utils/formatters';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { success, error } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      error('Please enter both name and email');
      return;
    }
    setLoading(true);
    try {
      const updated = await updateUserProfileApi({ name, email });
      // Update local storage
      localStorage.setItem('darukaa_user', JSON.stringify(updated));
      success('Profile updated successfully');
      setEditModalOpen(false);
      // Refresh page or context
      window.location.reload();
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Researcher Profile</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Authenticated credentials, role permissions, and session details.
        </p>
      </div>

      <div className="bg-[#0f1714] border border-[#1f352b] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-2xl flex items-center justify-center border border-emerald-500/30">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{user?.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={isAdmin ? 'emerald' : 'cyan'} size="sm">
                  {user?.role}
                </Badge>
                <span className="text-xs text-gray-400">• Authenticated</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setName(user?.name || '');
              setEmail(user?.email || '');
              setEditModalOpen(true);
            }}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#192b23]">
          <div className="p-4 rounded-2xl bg-[#080d0b] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Email Address</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1">{user?.email}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d0b] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Permissions Level</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              {isAdmin ? 'Full Administrative Access' : 'Standard Read & Analytics'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d0b] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Member Since</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              {formatDate(user?.created_at)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d0b] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <User className="w-4 h-4 text-teal-400" />
              <span>User ID</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1">#{user?.id}</div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#192b23] flex justify-end">
          <Button
            variant="danger"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Researcher Profile"
          maxWidth="md"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-[#1f352b]">
              <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
