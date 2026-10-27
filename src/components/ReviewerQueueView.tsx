import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  Clock,
  Wrench,
  AlertTriangle,
  School,
  Building2,
  Sparkles,
  Link2,
  Send,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Radio,
  FileCheck,
} from 'lucide-react';
import { useReports } from '../context/ReportsContext';
import { ReportStatus, PriorityBand, WaterReport } from '../types';
import { getPriorityBandColor } from '../utils/scoring';
import { NavTab } from './Sidebar';

interface ReviewerQueueViewProps {
  selectedReportId?: string | null;
  setSelectedReportId: (id: string | null) => void;
  setActiveTab: (tab: NavTab) => void;
}

export const ReviewerQueueView: React.FC<ReviewerQueueViewProps> = ({
  selectedReportId,
  setSelectedReportId,
  setActiveTab,
}) => {
  const {
    reports,
    currentRole,
    reviewerName,
    reviewerTitle,
    updateReportStatus,
    assignReport,
    resolveReport,
    linkDuplicate,
    updateReviewerNotes,
  } = useReports();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reviewer action modal states
  const [assigneeInput, setAssigneeInput] = useState('Mukono District Borehole Fast-Response Unit');
  const [resolutionInput, setResolutionInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && r.priorityBand !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.reportId.toLowerCase().includes(q) ||
        r.waterPointName.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Selected report
  const activeReport = reports.find((r) => r.reportId === selectedReportId) || filteredReports[0] || reports[0];

  const handleVerify = () => {
    if (!activeReport) return;
    updateReportStatus(
      activeReport.reportId,
      'Verified',
      'Ground contact confirmed fault details; location confirmed in district registry'
    );
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport || !assigneeInput.trim()) return;
    assignReport(activeReport.reportId, assigneeInput.trim(), 'Dispatched technical crew');
    setIsAssigning(false);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport || !resolutionInput.trim()) return;
    resolveReport(activeReport.reportId, resolutionInput.trim());
    setIsResolving(false);
  };

  const handleSaveNotes = () => {
    if (!activeReport) return;
    updateReviewerNotes(activeReport.reportId, notesInput);
    setIsEditingNotes(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#173B57]">Water-Service Reviewer Queue</h2>
            <p className="text-xs text-[#647B91]">
              Authorised assessment: verify reports, examine AI summaries, link duplicates, and assign maintenance crews.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#647B91]">Viewing as:</span>
            <span className="text-xs font-bold text-[#173B57] bg-[#E4F0FA] px-2.5 py-1 rounded border border-[#D9E7F2]">
              {reviewerName} ({reviewerTitle})
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D9E7F2]">
          <input
            type="text"
            placeholder="Search report ID, water point, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none w-full sm:w-64"
          />

          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {['all', 'Unverified', 'Verified', 'Assigned', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#2878C8] text-white shadow-xs'
                    : 'bg-[#F7FAFE] text-[#344B62] hover:bg-[#E4F0FA]'
                }`}
              >
                {st === 'all' ? 'All Statuses' : st}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1 text-xs">
            <span className="text-[#647B91] mr-1 hidden md:inline">Priority:</span>
            {['all', 'High', 'Medium', 'Low'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  priorityFilter === p
                    ? 'bg-[#173B57] text-white'
                    : 'bg-[#F7FAFE] text-[#647B91] hover:text-[#173B57]'
                }`}
              >
                {p === 'all' ? 'Any' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Master / Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#D9E7F2] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9E7F2] text-xs font-semibold text-[#647B91]">
            <span>Reports ({filteredReports.length})</span>
            <span>Priority Score</span>
          </div>

          <div className="divide-y divide-[#D9E7F2] max-h-[750px] overflow-y-auto">
            {filteredReports.map((report) => {
              const isSelected = activeReport?.reportId === report.reportId;
              const bandColor = getPriorityBandColor(report.priorityBand);
              return (
                <div
                  key={report.reportId}
                  onClick={() => setSelectedReportId(report.reportId)}
                  className={`p-3 rounded-lg transition-colors cursor-pointer my-1 text-left ${
                    isSelected
                      ? 'bg-[#E4F0FA] border border-[#2878C8]/40 shadow-xs'
                      : 'hover:bg-[#F7FAFE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#647B91] mb-0.5">
                        <span className="font-mono font-bold text-[#173B57]">{report.reportId}</span>
                        <span>·</span>
                        <span>{report.district}</span>
                        {report.isDemo && (
                          <span className="text-[9px] font-mono font-bold text-[#2878C8] bg-white px-1 rounded border border-[#D9E7F2]">
                            DEMO
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-[#173B57] truncate">
                        {report.waterPointName}
                      </h4>
                      <p className="text-[11px] text-[#647B91] line-clamp-1 mt-0.5">
                        {report.description}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-[#647B91]">
                        <span className="font-semibold text-[#344B62]">{report.status}</span>
                        <span>·</span>
                        <span>{report.reportedDurationDays ? `${report.reportedDurationDays}d outage` : 'recent'}</span>
                        {report.schoolDependent && (
                          <>
                            <span>·</span>
                            <span className="text-[#0DAB9B] font-semibold flex items-center gap-0.5">
                              <School className="w-3 h-3" />
                              <span>School</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold font-mono ${bandColor.bg} ${bandColor.text} border ${bandColor.border}`}
                      >
                        {report.priorityScore}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredReports.length === 0 && (
              <div className="p-8 text-center text-xs text-[#647B91]">
                No reports match the active filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Pane (7 cols) */}
        {activeReport ? (
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#D9E7F2] p-6 shadow-2xs space-y-6">
            {/* Status & Action Stepper */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E7F2]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#2878C8]">{activeReport.reportId}</span>
                  <span className="text-[#647B91]">·</span>
                  <span className="text-xs text-[#647B91]">Logged {new Date(activeReport.submittedAt).toLocaleDateString()}</span>
                  <span className="text-xs font-mono font-bold text-[#2878C8] bg-[#F0F7FC] px-1.5 py-0.5 rounded border border-[#D9E7F2]">
                    isDemo: true
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#173B57] mt-1">
                  {activeReport.waterPointName}
                </h3>
                <p className="text-xs text-[#647B91]">{activeReport.locationName} ({activeReport.district})</p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 text-right">
                <span className="text-xs text-[#647B91] block mb-1">Workflow Status</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    activeReport.status === 'Resolved'
                      ? 'bg-[#DDF8F0] text-[#0DAB9B]'
                      : activeReport.status === 'Assigned'
                      ? 'bg-[#F2F0FF] text-[#8378E8]'
                      : activeReport.status === 'Verified'
                      ? 'bg-[#F0F7FC] text-[#2878C8]'
                      : 'bg-[#FEF8EC] text-[#B87A14]'
                  }`}
                >
                  {activeReport.status}
                </span>
              </div>
            </div>

            {/* Authorised Reviewer Actions Ribbon */}
            <div className="p-4 rounded-xl bg-[#F0F7FC] border border-[#D9E7F2] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#173B57]">
                <span>Authorised Reviewer Actions</span>
                <span className="text-[#647B91] font-mono text-[11px]">Role: {reviewerName}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeReport.status === 'Unverified' && (
                  <button
                    onClick={handleVerify}
                    className="px-3.5 py-2 rounded-lg bg-[#2878C8] hover:bg-[#1f63a6] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Confirm Verification</span>
                  </button>
                )}

                {activeReport.status !== 'Resolved' && (
                  <button
                    onClick={() => setIsAssigning(!isAssigning)}
                    className="px-3.5 py-2 rounded-lg bg-[#8378E8] hover:bg-[#7266d6] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{activeReport.assignedTo ? 'Re-assign Maintenance Unit' : 'Assign Maintenance Crew'}</span>
                  </button>
                )}

                {activeReport.status !== 'Resolved' && (
                  <button
                    onClick={() => setIsResolving(!isResolving)}
                    className="px-3.5 py-2 rounded-lg bg-[#0DAB9B] hover:bg-[#0B9688] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Record Physical Resolution</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('bulletins')}
                  className="px-3 py-2 rounded-lg bg-white hover:bg-[#F7FAFE] border border-[#D9E7F2] text-[#344B62] text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-[#0DAB9B]" />
                  <span>Draft Community Bulletin</span>
                </button>
              </div>

              {/* Assignment Sub-Form */}
              {isAssigning && (
                <form onSubmit={handleAssignSubmit} className="pt-3 border-t border-[#D9E7F2] space-y-2">
                  <label className="block text-xs font-semibold text-[#173B57]">
                    Assignee Team or Contractor Name:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assigneeInput}
                      onChange={(e) => setAssigneeInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded border border-[#D9E7F2] bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-[#8378E8] text-white text-xs font-bold"
                    >
                      Confirm Assignment
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAssigning(false)}
                      className="px-2 py-1.5 text-xs text-[#647B91]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Resolution Sub-Form */}
              {isResolving && (
                <form onSubmit={handleResolveSubmit} className="pt-3 border-t border-[#D9E7F2] space-y-2">
                  <label className="block text-xs font-semibold text-[#173B57]">
                    Describe Physical Repair Work Performed (Piston replacement, pipe flushed, water test):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Replaced worn U2 piston cup, greased handle fulcrum pin, restored yield to 16L/min on Oct 23."
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-[#D9E7F2] bg-white focus:outline-none"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded bg-[#0DAB9B] text-white text-xs font-bold"
                    >
                      Complete & Mark Resolved
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsResolving(false)}
                      className="px-2 py-1.5 text-xs text-[#647B91]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Aurora Violet Gemini Structured Insights Card */}
            {activeReport.geminiAnalysis && (
              <div className="p-4 rounded-xl bg-[#F8F7FF] border border-[#8378E8]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8378E8]">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini Technical Triage & Entity Extraction</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8378E8]">
                    {activeReport.geminiAnalysis.isFallback ? 'Rule-Based Fallback' : 'Model: gemini-3.8-flash'}
                  </span>
                </div>

                <div className="text-xs text-[#344B62] space-y-2">
                  <p className="font-medium leading-relaxed">
                    <strong>Summary:</strong> {activeReport.geminiAnalysis.summary}
                  </p>

                  {activeReport.geminiAnalysis.missingInformation?.length > 0 && (
                    <div className="p-2.5 rounded bg-white/70 border border-[#8378E8]/20">
                      <span className="font-semibold text-[#173B57] block mb-1">
                        Missing Technical Data Identified:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-[#647B91] space-y-0.5">
                        {activeReport.geminiAnalysis.missingInformation.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeReport.geminiAnalysis.justificationFactors?.length > 0 && (
                    <div className="text-[11px] text-[#647B91]">
                      <strong className="text-[#173B57]">Priority Justification Factors:</strong>{' '}
                      {activeReport.geminiAnalysis.justificationFactors.join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transparent Deterministic Score Breakdown */}
            <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9E7F2]">
                <h4 className="text-xs font-bold text-[#173B57]">Deterministic Priority Score Breakdown</h4>
                <div className="text-right">
                  <span className="text-sm font-extrabold font-mono text-[#2878C8]">
                    {activeReport.priorityScore} / 100
                  </span>
                  <span className="text-xs font-bold text-[#647B91] ml-1">
                    ({activeReport.priorityBand} Band)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[#F7FAFE] border border-[#D9E7F2]">
                  <span className="text-[11px] text-[#647B91] block">A. Outage Duration</span>
                  <span className="font-mono font-bold text-[#173B57]">
                    +{activeReport.priorityBreakdown?.durationPoints ?? 0} pts
                  </span>
                  <span className="text-[10px] text-[#647B91] block mt-0.5">
                    {activeReport.reportedDurationDays ?? 0} reported days
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#F7FAFE] border border-[#D9E7F2]">
                  <span className="text-[11px] text-[#647B91] block">B. Population Scale</span>
                  <span className="font-mono font-bold text-[#173B57]">
                    +{activeReport.priorityBreakdown?.peoplePoints ?? 0} pts
                  </span>
                  <span className="text-[10px] text-[#647B91] block mt-0.5">
                    ~{activeReport.estimatedPeopleAffected ?? 0} individuals
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#F7FAFE] border border-[#D9E7F2]">
                  <span className="text-[11px] text-[#647B91] block">C. Critical Facilities</span>
                  <span className="font-mono font-bold text-[#173B57]">
                    +{activeReport.priorityBreakdown?.facilityPoints ?? 0} pts
                  </span>
                  <span className="text-[10px] text-[#647B91] block mt-0.5">
                    {activeReport.schoolDependent ? 'School (+15)' : ''}
                    {activeReport.schoolDependent && activeReport.healthFacilityDependent ? ', ' : ''}
                    {activeReport.healthFacilityDependent ? 'Clinic (+15)' : ''}
                    {!activeReport.schoolDependent && !activeReport.healthFacilityDependent ? 'None' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Duplicate Detection & Linking */}
            {activeReport.possibleDuplicateIds?.length > 0 && (
              <div className="p-4 rounded-xl bg-[#FEF8EC] border border-[#F9E6C3] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#B87A14]">
                  <Link2 className="w-4 h-4" />
                  <span>Potential Duplicate Reports Detected</span>
                </div>
                <p className="text-xs text-[#344B62]">
                  Algorithmic matching flagged reports in the same community or with similar water-point naming:
                </p>

                <div className="space-y-2 pt-1">
                  {activeReport.possibleDuplicateIds.map((dupId) => {
                    const candidate = reports.find((r) => r.reportId === dupId);
                    if (!candidate) return null;
                    const isAlreadyLinked = activeReport.linkedDuplicateIds.includes(dupId);

                    return (
                      <div
                        key={dupId}
                        className="p-2.5 rounded-lg bg-white border border-[#F9E6C3] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-[#173B57]">
                            <span className="font-mono text-[#2878C8]">{candidate.reportId}</span>
                            <span>·</span>
                            <span>{candidate.waterPointName}</span>
                          </div>
                          <p className="text-[11px] text-[#647B91] line-clamp-1 mt-0.5">
                            {candidate.description}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isAlreadyLinked ? (
                            <span className="text-xs font-bold text-[#0DAB9B] bg-[#DDF8F0] px-2 py-1 rounded">
                              Linked Duplicate
                            </span>
                          ) : (
                            <button
                              onClick={() => linkDuplicate(activeReport.reportId, dupId)}
                              className="px-2.5 py-1 rounded bg-[#B87A14] hover:bg-[#99650f] text-white font-semibold text-xs transition-colors"
                            >
                              Link as Duplicate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity History Audit Trail */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-[#173B57]">Report Activity & Audit Trail</h4>
              <div className="border border-[#D9E7F2] rounded-lg divide-y divide-[#D9E7F2] text-xs">
                {activeReport.activityHistory.map((act) => (
                  <div key={act.id} className="p-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#173B57]">{act.action}</span>
                        <span className="text-[#647B91] text-[11px]">by {act.actor}</span>
                      </div>
                      {act.details && (
                        <p className="text-[#647B91] text-[11px] mt-0.5">{act.details}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#647B91] shrink-0">
                      {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#D9E7F2] p-12 text-center text-[#647B91] text-xs">
            Select a report from the queue to inspect details and perform review actions.
          </div>
        )}
      </div>
    </div>
  );
};
