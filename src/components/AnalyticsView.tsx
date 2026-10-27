import React from 'react';
import { BarChart3, Clock, AlertTriangle, CheckCircle, Droplet, Info, ShieldCheck } from 'lucide-react';
import { useReports } from '../context/ReportsContext';

export const AnalyticsView: React.FC = () => {
  const { reports } = useReports();

  const total = reports.length;
  const unverified = reports.filter((r) => r.status === 'Unverified').length;
  const verified = reports.filter((r) => r.status === 'Verified').length;
  const assigned = reports.filter((r) => r.status === 'Assigned').length;
  const resolved = reports.filter((r) => r.status === 'Resolved').length;

  const highPriority = reports.filter((r) => r.priorityBand === 'High').length;
  const mediumPriority = reports.filter((r) => r.priorityBand === 'Medium').length;
  const lowPriority = reports.filter((r) => r.priorityBand === 'Low').length;

  const schoolImpactCount = reports.filter((r) => r.schoolDependent).length;
  const healthFacilityCount = reports.filter((r) => r.healthFacilityDependent).length;

  const totalLinkedDuplicates = reports.reduce((acc, r) => acc + (r.linkedDuplicateIds?.length || 0), 0) / 2;

  // Calculate turnaround times for resolved reports
  const resolvedWithTimes = reports.filter((r) => r.status === 'Resolved' && r.resolvedAt && r.submittedAt);
  const durationsHours = resolvedWithTimes.map((r) => {
    const sub = new Date(r.submittedAt).getTime();
    const res = new Date(r.resolvedAt!).getTime();
    return Math.max(0, (res - sub) / (1000 * 60 * 60));
  }).sort((a, b) => a - b);

  let medianResolutionDays = 'N/A';
  if (durationsHours.length > 0) {
    const mid = Math.floor(durationsHours.length / 2);
    const medianHours =
      durationsHours.length % 2 !== 0
        ? durationsHours[mid]
        : (durationsHours[mid - 1] + durationsHours[mid]) / 2;
    medianResolutionDays = (medianHours / 24).toFixed(1) + ' days';
  }

  // Issue category distribution
  const categories: Record<string, number> = {};
  reports.forEach((r) => {
    categories[r.issueType] = (categories[r.issueType] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header and Disclaimer */}
      <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#173B57]">Water-Service Operational Analytics</h2>
            <p className="text-xs text-[#647B91]">
              Dynamic triage analytics computed live from stored prototype report records.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#2878C8] bg-[#F0F7FC] px-2.5 py-1 rounded border border-[#D9E7F2] shrink-0">
            SIMULATED DEMO DATASET
          </span>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs text-[#647B91] font-medium block">Total Community Reports</span>
          <span className="text-2xl font-bold font-mono text-[#173B57] mt-1 block tabular-nums">
            {total}
          </span>
          <span className="text-[11px] text-[#647B91] mt-1 block">100% demo-flagged records</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs text-[#647B91] font-medium block">School Dependencies (SDG 4)</span>
          <span className="text-2xl font-bold font-mono text-[#0DAB9B] mt-1 block tabular-nums">
            {schoolImpactCount}
          </span>
          <span className="text-[11px] text-[#0DAB9B] mt-1 block">Priority boosted +15 pts</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs text-[#647B91] font-medium block">Linked Duplicate Reports</span>
          <span className="text-2xl font-bold font-mono text-[#B87A14] mt-1 block tabular-nums">
            {Math.floor(totalLinkedDuplicates)}
          </span>
          <span className="text-[11px] text-[#B87A14] mt-1 block">Clustered by reviewer</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
          <span className="text-xs text-[#647B91] font-medium block">Median Resolution Time</span>
          <span className="text-2xl font-bold font-mono text-[#2878C8] mt-1 block tabular-nums">
            {medianResolutionDays}
          </span>
          <span className="text-[11px] text-[#2878C8] mt-1 block">From verified repair logs</span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#173B57]">Workflow Status Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Unverified Reports', count: unverified, color: 'bg-[#F0B44D]' },
              { label: 'Ground Verified', count: verified, color: 'bg-[#2878C8]' },
              { label: 'Assigned to Crew', count: assigned, color: 'bg-[#8378E8]' },
              { label: 'Physically Resolved', count: resolved, color: 'bg-[#0DAB9B]' },
            ].map((item) => {
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0';
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#344B62] font-semibold">{item.label}</span>
                    <span className="font-mono text-[#647B91]">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E4F0FA] overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Bands Distribution */}
        <div className="p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#173B57]">Priority Scoring Band Breakdown</h3>
          <div className="space-y-3">
            {[
              {
                label: 'High Priority (70–100 pts)',
                desc: 'Severe outage > 5d, high population, or school/clinic affected',
                count: highPriority,
                color: 'bg-[#E76F75]',
                textColor: 'text-[#E76F75]',
              },
              {
                label: 'Medium Priority (40–69 pts)',
                desc: 'Moderate outage duration or community population',
                count: mediumPriority,
                color: 'bg-[#F0B44D]',
                textColor: 'text-[#B87A14]',
              },
              {
                label: 'Low Priority (0–39 pts)',
                desc: 'Minor defect or newly initiated fault',
                count: lowPriority,
                color: 'bg-[#2878C8]',
                textColor: 'text-[#2878C8]',
              },
            ].map((item) => {
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0';
              return (
                <div key={item.label} className="p-3 rounded-lg bg-[#F7FAFE] border border-[#D9E7F2] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className={`font-bold ${item.textColor}`}>{item.label}</span>
                      <p className="text-[10px] text-[#647B91]">{item.desc}</p>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#173B57]">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#E4F0FA] overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reported Issue Types Breakdown */}
      <div className="p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-[#173B57]">Common Fault Types Logged</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(categories).map(([cat, count]) => (
            <div key={cat} className="p-3 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2] text-xs">
              <span className="text-[#647B91] block uppercase tracking-wider text-[10px] font-semibold">
                {cat.replace('_', ' ')}
              </span>
              <span className="text-xl font-bold font-mono text-[#173B57] mt-1 block">
                {count}
              </span>
              <span className="text-[11px] text-[#647B91] block mt-0.5">
                {((count / total) * 100).toFixed(0)}% of complaints
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
