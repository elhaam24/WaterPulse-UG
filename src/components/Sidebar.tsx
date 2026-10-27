import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  MapPin,
  Map,
  BarChart3,
  Radio,
  Sliders,
  Droplet,
  ExternalLink,
} from 'lucide-react';
import { useReports } from '../context/ReportsContext';

export type NavTab =
  | 'overview'
  | 'report'
  | 'reviewer_queue'
  | 'water_points'
  | 'map'
  | 'analytics'
  | 'bulletins'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { reports } = useReports();
  const unverifiedCount = reports.filter((r) => r.status === 'Unverified').length;
  const highPriorityCount = reports.filter((r) => r.priorityBand === 'High' && r.status !== 'Resolved').length;

  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'report' as NavTab, label: 'Report a Problem', icon: PlusCircle },
    {
      id: 'reviewer_queue' as NavTab,
      label: 'Reviewer Queue',
      icon: ClipboardList,
      badge: unverifiedCount > 0 ? `${unverifiedCount}` : undefined,
      urgent: highPriorityCount > 0,
    },
    { id: 'water_points' as NavTab, label: 'Water Points', icon: MapPin },
    { id: 'map' as NavTab, label: 'Interactive Map', icon: Map },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'bulletins' as NavTab, label: 'Community Bulletins', icon: Radio },
    { id: 'settings' as NavTab, label: 'Settings & About', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#E4F0FA] border-r border-[#D9E7F2] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Zone */}
        <div className="h-16 px-5 border-b border-[#D9E7F2] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2878C8] to-[#0DAB9B] flex items-center justify-center text-white shadow-xs">
            <Droplet className="w-5 h-5 fill-white/90" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-[#173B57] tracking-tight">WaterPulse</span>
              <span className="text-xs font-bold text-[#0DAB9B] bg-[#DDF8F0] px-1.5 py-0.5 rounded">UG</span>
            </div>
            <p className="text-[11px] text-[#647B91] leading-tight font-medium">SDG 6 Civic Water Triage</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#2878C8] text-white shadow-xs'
                    : 'text-[#344B62] hover:bg-[#D4E6F6] hover:text-[#173B57]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#2878C8]'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.urgent
                        ? 'bg-[#FDF2F2] text-[#E76F75] border border-[#F8D2D4]'
                        : 'bg-[#DDF8F0] text-[#0DAB9B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* SDG Impact Mission Card in Sidebar */}
        <div className="p-3 border-t border-[#D9E7F2] bg-[#F7FAFE]/80">
          <div className="p-3 rounded-lg bg-white border border-[#D9E7F2] text-xs">
            <div className="flex items-center justify-between font-semibold text-[#173B57] mb-1">
              <span>UN SDG 6 Target</span>
              <span className="text-[#0DAB9B] font-mono">6.1.1</span>
            </div>
            <p className="text-[11px] text-[#647B91] leading-relaxed mb-2">
              Every report matters. Every repair starts with visibility for underserved communities.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#647B91] font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-[#0DAB9B]" />
              <span>Uganda Civic Tech Pilot</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
