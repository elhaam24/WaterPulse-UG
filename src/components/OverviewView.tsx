import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Droplets,
  School,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  Shield,
  FileCheck2,
} from 'lucide-react';
import { useReports } from '../context/ReportsContext';
import { NavTab } from './Sidebar';
import { getPriorityBandColor } from '../utils/scoring';

interface OverviewViewProps {
  setActiveTab: (tab: NavTab) => void;
  onSelectReportForReview?: (reportId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  setActiveTab,
  onSelectReportForReview,
}) => {
  const { reports, currentRole, resetDemoData } = useReports();

  const totalReports = reports.length;
  const unverifiedReports = reports.filter((r) => r.status === 'Unverified').length;
  const verifiedReports = reports.filter((r) => r.status === 'Verified').length;
  const assignedReports = reports.filter((r) => r.status === 'Assigned').length;
  const resolvedReports = reports.filter((r) => r.status === 'Resolved').length;
  const highPriorityReports = reports.filter(
    (r) => r.priorityBand === 'High' && r.status !== 'Resolved'
  ).length;

  // Sorted by priority descending (excluding resolved)
  const priorityQueue = [...reports]
    .filter((r) => r.status !== 'Resolved')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 4);

  // Collect recent activities
  const recentActivities = reports
    .flatMap((r) =>
      r.activityHistory.map((act) => ({
        ...act,
        reportId: r.reportId,
        waterPointName: r.waterPointName,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* SDG 6 Mission & Demonstration Banner */}
      <div className="p-5 md:p-6 rounded-xl bg-gradient-to-r from-[#173B57] via-[#2878C8] to-[#0DAB9B] text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded text-white backdrop-blur-xs">
              UN SDG 6 & SDG 4 Civic Innovation
            </span>
            <span className="text-xs text-white/80 font-mono">· Kampala & Rural Districts</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white mb-2">
            Every report matters. Every repair starts with visibility.
          </h2>
          <p className="text-sm text-white/90 leading-relaxed mb-4">
            Transforming scattered community notifications about faulty handpumps, broken taps, and contaminated wells into transparent, priority-scored work orders for district maintenance engineers.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => setActiveTab('report')}
              className="px-4 py-2 bg-[#DDF8F0] hover:bg-white text-[#173B57] font-semibold text-xs md:text-sm rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Submit Community Report</span>
              <ArrowRight className="w-4 h-4 text-[#0DAB9B]" />
            </button>
            <button
              onClick={() => setActiveTab('reviewer_queue')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-medium text-xs md:text-sm rounded-lg backdrop-blur-xs transition-colors flex items-center gap-2"
            >
              <span>Open Reviewer Queue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient subtle decorative droplet watermark */}
        <div className="absolute right-4 -bottom-6 text-white/10 pointer-events-none select-none">
          <Droplets className="w-48 h-48" />
        </div>
      </div>

      {/* Prototype Honesty Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#E4F0FA] border border-[#D9E7F2] text-xs text-[#344B62]">
        <Info className="w-4 h-4 text-[#2878C8] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-[#173B57]">Hackathon Prototype Demonstration Mode</p>
          <p className="text-[#647B91] mt-0.5">
            This application uses clearly designated fictional demonstration records (marked with explicit <span className="font-mono text-[#2878C8]">isDemo: true</span> tags) to illustrate the end-to-end report triage, Gemini analysis, deterministic scoring, and Luganda bulletin generation workflows.
          </p>
        </div>
      </div>

      {/* Key Operational Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs font-medium text-[#647B91] block">Total Reports</span>
          <span className="text-2xl font-bold text-[#173B57] font-mono tabular-nums mt-1 block">
            {totalReports}
          </span>
          <span className="text-[11px] text-[#647B91] mt-1 block">All logged events</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs font-medium text-[#647B91] block">Unverified</span>
          <span className="text-2xl font-bold text-[#B87A14] font-mono tabular-nums mt-1 block">
            {unverifiedReports}
          </span>
          <span className="text-[11px] text-[#B87A14] mt-1 block">Awaiting review</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs font-medium text-[#647B91] block">High Priority</span>
          <span className="text-2xl font-bold text-[#E76F75] font-mono tabular-nums mt-1 block">
            {highPriorityReports}
          </span>
          <span className="text-[11px] text-[#E76F75] mt-1 block">Score ≥ 70 / 100</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs font-medium text-[#647B91] block">Verified</span>
          <span className="text-2xl font-bold text-[#2878C8] font-mono tabular-nums mt-1 block">
            {verifiedReports}
          </span>
          <span className="text-[11px] text-[#2878C8] mt-1 block">Validated records</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs font-medium text-[#647B91] block">Assigned</span>
          <span className="text-2xl font-bold text-[#8378E8] font-mono tabular-nums mt-1 block">
            {assignedReports}
          </span>
          <span className="text-[11px] text-[#8378E8] mt-1 block">Repair crew assigned</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs font-medium text-[#647B91] block">Resolved</span>
          <span className="text-2xl font-bold text-[#0DAB9B] font-mono tabular-nums mt-1 block">
            {resolvedReports}
          </span>
          <span className="text-[11px] text-[#0DAB9B] mt-1 block">Restored to service</span>
        </div>
      </div>

      {/* Main Workspace Split: Priority Triage Queue + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Triage Queue (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#D9E7F2] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#D9E7F2]">
            <div>
              <h3 className="font-bold text-base text-[#173B57]">Active Priority Triage Queue</h3>
              <p className="text-xs text-[#647B91]">
                Unresolved water points ranked by deterministic vulnerability score
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reviewer_queue')}
              className="text-xs font-semibold text-[#2878C8] hover:text-[#173B57] flex items-center gap-1"
            >
              <span>View All Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#D9E7F2] mt-2">
            {priorityQueue.map((report) => {
              const bandColor = getPriorityBandColor(report.priorityBand);
              return (
                <div
                  key={report.reportId}
                  className="py-3.5 flex items-start justify-between gap-4 hover:bg-[#F7FAFE] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    if (onSelectReportForReview) {
                      onSelectReportForReview(report.reportId);
                    }
                    setActiveTab('reviewer_queue');
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-[#647B91]">
                        {report.reportId}
                      </span>
                      <span className="text-[#647B91] text-xs">·</span>
                      <span className="text-xs font-medium text-[#344B62]">
                        {report.locationName}
                      </span>
                      {report.schoolDependent && (
                        <>
                          <span className="text-[#647B91] text-xs">·</span>
                          <span className="text-xs text-[#0DAB9B] font-medium flex items-center gap-1">
                            <School className="w-3 h-3" />
                            <span>School Dependent</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-[#173B57] truncate">
                      {report.waterPointName}
                    </h4>
                    <p className="text-xs text-[#647B91] line-clamp-1 mt-0.5">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-[#647B91] mt-2">
                      <span>Status: <strong className="text-[#344B62]">{report.status}</strong></span>
                      <span>·</span>
                      <span>Reported: {report.reportedDurationDays ? `${report.reportedDurationDays}d ago` : 'recent'}</span>
                      <span>·</span>
                      <span>~{report.estimatedPeopleAffected ?? '?'} people</span>
                    </div>
                  </div>

                  {/* Priority Score Stamp */}
                  <div className="text-right shrink-0">
                    <div
                      className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg border ${bandColor.bg} ${bandColor.border}`}
                    >
                      <span className={`text-base font-extrabold font-mono ${bandColor.text}`}>
                        {report.priorityScore}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${bandColor.text}`}>
                        {report.priorityBand}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Log & SDG 4 Spotlight (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* SDG 4 School Handpump Demo Launcher */}
          <div className="p-4 rounded-xl bg-[#DDF8F0] border border-[#A4EAD8] text-xs">
            <div className="flex items-center gap-2 font-bold text-[#173B57] text-sm mb-1">
              <School className="w-4 h-4 text-[#0DAB9B]" />
              <span>Hackathon 3-Minute Presentation Journey</span>
            </div>
            <p className="text-[#344B62] leading-relaxed mb-3">
              Demonstrate how a report for <strong>St. Jude Primary School Handpump</strong> triggers automated school dependency scoring (+15 pts), Gemini engineering summaries, duplicate checking, and bilingual Luganda bulletins.
            </p>
            <button
              onClick={() => {
                if (onSelectReportForReview) {
                  onSelectReportForReview('WPUG-2026-0101');
                }
                setActiveTab('reviewer_queue');
              }}
              className="w-full py-2 bg-[#0DAB9B] hover:bg-[#0B9688] text-white font-semibold rounded-lg text-center transition-colors shadow-2xs"
            >
              Inspect St. Jude School Report in Reviewer Queue
            </button>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl border border-[#D9E7F2] p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E7F2]">
              <h3 className="font-bold text-sm text-[#173B57]">Recent Activity Timeline</h3>
              <span className="text-xs text-[#647B91] font-mono">Live Session</span>
            </div>

            <div className="divide-y divide-[#D9E7F2] mt-1 text-xs">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-2.5">
                  <div className="flex items-center justify-between text-[#647B91] mb-0.5">
                    <span className="font-medium text-[#173B57]">{act.action}</span>
                    <span className="font-mono text-[11px]">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#344B62] font-semibold truncate">{act.waterPointName}</p>
                  <p className="text-[#647B91] text-[11px] mt-0.5">
                    By {act.actor} {act.details ? `— ${act.details}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
