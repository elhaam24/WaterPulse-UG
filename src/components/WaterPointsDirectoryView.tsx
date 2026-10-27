import React, { useState } from 'react';
import { Search, Download, Filter, School, Building2, ChevronRight, Eye } from 'lucide-react';
import { useReports } from '../context/ReportsContext';
import { getPriorityBandColor } from '../utils/scoring';
import { NavTab } from './Sidebar';

interface WaterPointsDirectoryViewProps {
  onSelectReportForReview?: (reportId: string) => void;
  setActiveTab: (tab: NavTab) => void;
}

export const WaterPointsDirectoryView: React.FC<WaterPointsDirectoryViewProps> = ({
  onSelectReportForReview,
  setActiveTab,
}) => {
  const { reports } = useReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  const districts = Array.from(new Set(reports.map((r) => r.district)));

  const filtered = reports.filter((r) => {
    if (districtFilter !== 'all' && r.district !== districtFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.reportId.toLowerCase().includes(q) ||
        r.waterPointName.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        r.issueType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = [
      'ReportID',
      'WaterPointName',
      'Location',
      'District',
      'Status',
      'PriorityScore',
      'PriorityBand',
      'IssueType',
      'DaysOut',
      'PeopleAffected',
      'SchoolDependent',
      'SubmittedAt',
    ];
    const rows = filtered.map((r) => [
      r.reportId,
      `"${r.waterPointName.replace(/"/g, '""')}"`,
      `"${r.locationName.replace(/"/g, '""')}"`,
      r.district,
      r.status,
      r.priorityScore,
      r.priorityBand,
      r.issueType,
      r.reportedDurationDays ?? 0,
      r.estimatedPeopleAffected ?? 0,
      r.schoolDependent ? 'YES' : 'NO',
      r.submittedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `waterpulse_ug_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#173B57]">Water Points Registry</h2>
          <p className="text-xs text-[#647B91]">
            Tabular directory of community water points, status history, and vulnerable beneficiary metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D9E7F2] text-xs font-semibold text-[#344B62] hover:bg-[#F0F7FC] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#2878C8]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#647B91] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by facility name, community, report reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-white focus:outline-none focus:ring-1 focus:ring-[#2878C8]"
          />
        </div>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-white focus:outline-none text-[#344B62]"
        >
          <option value="all">All Districts ({districts.length})</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d} District
            </option>
          ))}
        </select>
      </div>

      {/* High-density Data Table */}
      <div className="bg-white rounded-xl border border-[#D9E7F2] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7FAFE] border-b border-[#D9E7F2] text-[#647B91] font-semibold">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Water Point & Location</th>
                <th className="py-3 px-4">Issue Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Priority</th>
                <th className="py-3 px-4 text-right">Users</th>
                <th className="py-3 px-4">Critical Facilities</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E7F2]">
              {filtered.map((report) => {
                const bandColor = getPriorityBandColor(report.priorityBand);
                return (
                  <tr key={report.reportId} className="hover:bg-[#F0F7FC] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#2878C8] whitespace-nowrap">
                      {report.reportId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#173B57]">{report.waterPointName}</div>
                      <div className="text-[11px] text-[#647B91]">{report.locationName} · {report.district}</div>
                    </td>
                    <td className="py-3 px-4 capitalize whitespace-nowrap text-[#344B62]">
                      {report.issueType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          report.status === 'Resolved'
                            ? 'bg-[#DDF8F0] text-[#0DAB9B]'
                            : report.status === 'Assigned'
                            ? 'bg-[#F2F0FF] text-[#8378E8]'
                            : report.status === 'Verified'
                            ? 'bg-[#F0F7FC] text-[#2878C8]'
                            : 'bg-[#FEF8EC] text-[#B87A14]'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded ${bandColor.bg} ${bandColor.text} border ${bandColor.border}`}>
                        {report.priorityScore} pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#344B62] whitespace-nowrap">
                      ~{report.estimatedPeopleAffected ?? 'Unknown'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                      {report.schoolDependent && (
                        <span className="inline-flex items-center gap-1 text-[#0DAB9B] font-semibold mr-2">
                          <School className="w-3.5 h-3.5" />
                          <span>School</span>
                        </span>
                      )}
                      {report.healthFacilityDependent && (
                        <span className="inline-flex items-center gap-1 text-[#2878C8] font-semibold">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Health</span>
                        </span>
                      )}
                      {!report.schoolDependent && !report.healthFacilityDependent && (
                        <span className="text-[#647B91]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (onSelectReportForReview) {
                            onSelectReportForReview(report.reportId);
                          }
                          setActiveTab('reviewer_queue');
                        }}
                        className="p-1.5 rounded hover:bg-[#E4F0FA] text-[#2878C8] transition-colors inline-flex items-center justify-center"
                        title="Inspect in Reviewer Queue"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
