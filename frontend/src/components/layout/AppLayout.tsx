import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path: string): string => {
    if (path === '/dashboard') return 'Platform Dashboard';
    if (path.startsWith('/projects/')) return 'Project Details';
    if (path === '/projects') return 'Project Registry';
    if (path === '/map') return 'Geospatial Intelligence Map';
    if (path.startsWith('/sites/') && path.endsWith('/analytics')) return 'Site Analytics';
    if (path.startsWith('/sites/')) return 'Site Details';
    if (path === '/sites') return 'Monitoring Sites';
    if (path === '/analytics') return 'Global Ecosystem Analytics';
    if (path === '/profile') return 'User Profile';
    return 'Darukaa.Earth';
  };

  return (
    <div className="min-h-screen bg-[#080d0b] text-gray-100 flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
