import React, { useState } from 'react';
import { ReportsProvider } from './context/ReportsContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { ReportFormView } from './components/ReportFormView';
import { ReviewerQueueView } from './components/ReviewerQueueView';
import { WaterPointsDirectoryView } from './components/WaterPointsDirectoryView';
import { InteractiveMapView } from './components/InteractiveMapView';
import { AnalyticsView } from './components/AnalyticsView';
import { CommunityBulletinsView } from './components/CommunityBulletinsView';
import { SettingsView } from './components/SettingsView';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedReportId, setSelectedReportId] = useState<string | null>('WPUG-2026-0101');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectReportForReview = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveTab('reviewer_queue');
  };

  return (
    <div className="min-h-screen bg-[#F0F7FC] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <TopBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              setActiveTab={setActiveTab}
              onSelectReportForReview={handleSelectReportForReview}
            />
          )}

          {activeTab === 'report' && (
            <ReportFormView
              setActiveTab={setActiveTab}
              onSelectReportForReview={handleSelectReportForReview}
            />
          )}

          {activeTab === 'reviewer_queue' && (
            <ReviewerQueueView
              selectedReportId={selectedReportId}
              setSelectedReportId={setSelectedReportId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'water_points' && (
            <WaterPointsDirectoryView
              onSelectReportForReview={handleSelectReportForReview}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'map' && (
            <InteractiveMapView
              onSelectReportForReview={handleSelectReportForReview}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'bulletins' && <CommunityBulletinsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* Global Quiet Footer */}
        <footer className="mt-auto border-t border-[#D9E7F2] py-4 px-6 text-center text-xs text-[#647B91] bg-[#F7FAFE]">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
            <div>
              <span className="font-bold text-[#173B57]">WaterPulse UG</span>
              <span className="mx-2">·</span>
              <span>Every report matters. Every repair starts with visibility.</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-[#0DAB9B]">UN SDG 6 & SDG 4 Civic Tech</span>
              <span>·</span>
              <span>Prototype Mode</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReportsProvider>
      <MainApp />
    </ReportsProvider>
  );
}
