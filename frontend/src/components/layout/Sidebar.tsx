import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  BarChart3,
  Map as MapIcon,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  X,
  Globe2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', path: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Interactive Map', path: '/map', icon: <MapIcon className="w-5 h-5" /> },
    { label: 'Sites', path: '/sites', icon: <MapPin className="w-5 h-5" /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Profile', path: '/profile', icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0a110e] border-r border-[#192b23] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#192b23]">
          <NavLink to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Globe2 className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="font-bold text-base tracking-wider text-white flex items-center space-x-1">
                <span>DARUKAA</span>
                <span className="text-emerald-400 font-normal">.EARTH</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-medium tracking-wide uppercase">
                Geospatial Platform
              </div>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Platform Navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/50 font-semibold'
                    : 'text-gray-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-[#192b23] bg-[#070d0a]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0f1a15] border border-[#1f352b] mb-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30 shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                  {isAdmin && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                  <span className={isAdmin ? 'text-emerald-400 font-medium' : ''}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
