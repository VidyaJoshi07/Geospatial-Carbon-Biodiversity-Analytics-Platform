import React, { useEffect, useState } from 'react';
import { Menu, Search, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getHealthApi, HealthStatus } from '../../api/health';

export interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const data = await getHealthApi();
        if (mounted) setHealth(data);
      } catch {
        if (mounted) setHealth({ status: 'degraded', database: 'disconnected', service: 'Darukaa.Earth API' });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080d0b]/85 backdrop-blur-md border-b border-[#192b23] px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Live System Health Badge */}
        <div
          className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0a1410] border border-[#1b3427] text-[11px] font-medium text-gray-300"
          title={`Status: ${health?.status || 'Connecting'} | Database: ${health?.database || 'Unknown'} | Service: ${health?.service || 'Darukaa.Earth'}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-emerald-400 font-semibold">
            {health?.status === 'ok' ? 'PostGIS Active' : 'Connecting...'}
          </span>
        </div>

        {/* Global Quick Search Shortcut */}
        <div
          onClick={() => navigate('/projects')}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0f1a15] border border-[#1f352b] text-xs text-gray-400 hover:border-emerald-500/30 cursor-pointer transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <span>Search projects or sites...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-black/40 border border-white/10 text-gray-400">
            Ctrl+K
          </kbd>
        </div>

        {/* Role Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#12221b] border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          {isAdmin && <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{user?.role}</span>
        </div>
      </div>
    </header>
  );
};
