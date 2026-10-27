import React from 'react';
import { Menu, Plus, UserCheck, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useReports } from '../context/ReportsContext';

interface TopBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  setMobileOpen: (open: boolean) => void;
}

const tabTitles: Record<NavTab, string> = {
  overview: 'Overview Dashboard',
  report: 'Report a Problem',
  reviewer_queue: 'Authorised Reviewer Queue',
  water_points: 'Water Points Directory',
  map: 'Interactive Uganda Water Map',
  analytics: 'Triage & Resolution Analytics',
  bulletins: 'Community Bulletins (English & Luganda)',
  settings: 'System Configuration & About',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  setMobileOpen,
}) => {
  const { currentRole, setCurrentRole, reviewerName, resetDemoData } = useReports();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#F7FAFE]/95 backdrop-blur-md border-b border-[#D9E7F2] px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-[#344B62] hover:bg-[#E4F0FA] md:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#647B91] uppercase tracking-wider hidden sm:inline">
            WaterPulse UG
          </span>
          <span className="text-[#647B91] hidden sm:inline">/</span>
          <h1 className="text-base sm:text-lg font-bold text-[#173B57] truncate">
            {tabTitles[activeTab]}
          </h1>
        </div>
      </div>

      {/* Zone 2: Demonstration Mode Badge */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0FA] border border-[#D9E7F2] text-xs text-[#173B57]">
          <span className="w-2 h-2 rounded-full bg-[#0DAB9B] animate-pulse" />
          <span className="font-medium">Demonstration Mode</span>
          <span className="text-[#647B91]">·</span>
          <span className="text-[#647B91]">Simulated Civic Records</span>
        </div>

        <button
          onClick={resetDemoData}
          title="Restore sample demonstration dataset"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#2878C8] hover:text-[#173B57] hover:bg-[#E4F0FA] rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Sample Data</span>
        </button>
      </div>

      {/* Zone 3: Mode Switcher & Primary Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Role toggle button */}
        <button
          onClick={() => setCurrentRole(currentRole === 'reviewer' ? 'public' : 'reviewer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            currentRole === 'reviewer'
              ? 'bg-[#E4F0FA] border-[#2878C8]/30 text-[#173B57]'
              : 'bg-white border-[#D9E7F2] text-[#647B91] hover:text-[#173B57]'
          }`}
          title="Toggle user role between Authorised Reviewer and Public Reporter"
        >
          <UserCheck className="w-3.5 h-3.5 text-[#2878C8]" />
          <span className="hidden sm:inline">
            {currentRole === 'reviewer' ? reviewerName : 'Public Citizen Mode'}
          </span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/70 border border-[#D9E7F2]">
            {currentRole === 'reviewer' ? 'Reviewer' : 'Public'}
          </span>
        </button>

        {/* Primary CTA */}
        {activeTab !== 'report' && (
          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[#0DAB9B] hover:bg-[#0B9688] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
            aria-label="Report a Problem"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Report a Problem</span>
            <span className="sm:hidden">Report</span>
          </button>
        )}
      </div>
    </header>
  );
};
