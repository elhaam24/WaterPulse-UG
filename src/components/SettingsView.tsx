import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Database,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Droplet,
  School,
  ExternalLink,
} from 'lucide-react';
import { useReports } from '../context/ReportsContext';

export const SettingsView: React.FC = () => {
  const { resetDemoData, reports } = useReports();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    geminiConnected: boolean;
    storageMode: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/system-status')
      .then((res) => res.json())
      .then((data) => setSystemStatus(data))
      .catch((err) => console.warn('Status fetch error:', err));
  }, []);

  const handleReset = () => {
    resetDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
        <h2 className="text-base font-bold text-[#173B57]">Settings & Platform Architecture</h2>
        <p className="text-xs text-[#647B91]">
          System status, demonstration controls, and SDG mission documentation.
        </p>
      </div>

      {/* Demonstration Reset Card */}
      <div className="p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#173B57]">Demonstration Dataset Control</h3>
            <p className="text-xs text-[#647B91] mt-0.5">
              Reset all active reports back to the initial 6 sample demonstration records (including St. Jude School Pump, Kalerwe Tap, and Soroti Spring).
            </p>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-[#2878C8] hover:bg-[#1f63a6] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Records</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-2.5 rounded-lg bg-[#DDF8F0] border border-[#A4EAD8] text-xs text-[#0DAB9B] font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Demonstration dataset restored successfully. Current reports: {reports.length}</span>
          </div>
        )}
      </div>

      {/* Integration Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini AI Status */}
        <div className="p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F8F7FF] flex items-center justify-center text-[#8378E8]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#173B57]">Gemini 3.8 Flash AI Engine</h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                systemStatus?.geminiConnected
                  ? 'bg-[#DDF8F0] text-[#0DAB9B]'
                  : 'bg-[#FEF8EC] text-[#B87A14]'
              }`}
            >
              {systemStatus?.geminiConnected ? 'Connected (Server-Side)' : 'Rule-Based Fallback Mode'}
            </span>
          </div>

          <p className="text-xs text-[#344B62] leading-relaxed">
            All calls are managed securely on the server via <code className="text-[#2878C8]">@google/genai</code>. If an API key is not present in AI Studio Secrets, the application runs on a deterministic rule-based triage fallback without breaking any workflows.
          </p>

          <div className="text-[11px] text-[#647B91] space-y-1 bg-[#F7FAFE] p-2.5 rounded-lg border border-[#D9E7F2]">
            <div><strong>Model Alias:</strong> gemini-3.8-flash</div>
            <div><strong>Capabilities:</strong> Entity extraction, missing data detection, Luganda translations</div>
          </div>
        </div>

        {/* Persistence / Database Status */}
        <div className="p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F0F7FC] flex items-center justify-center text-[#2878C8]">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#173B57]">Storage & Persistence</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4F0FA] text-[#2878C8]">
              Local Demo Storage
            </span>
          </div>

          <p className="text-xs text-[#344B62] leading-relaxed">
            Currently running in <strong>Local Demonstration Mode</strong> with local browser storage. Reports and workflow states persist across browser reloads on this machine.
          </p>

          <div className="text-[11px] text-[#647B91] space-y-1 bg-[#F7FAFE] p-2.5 rounded-lg border border-[#D9E7F2]">
            <div><strong>Active State:</strong> Stored locally in browser session</div>
            <div><strong>Firebase Firestore:</strong> Ready to provision whenever requested</div>
          </div>
        </div>
      </div>

      {/* UN Sustainable Development Goals Mission Card */}
      <div className="p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-[#173B57]">United Nations Sustainable Development Goals</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#2878C8]">
              <Droplet className="w-4 h-4 text-[#0DAB9B]" />
              <span>SDG 6: Clean Water and Sanitation</span>
            </div>
            <p className="text-[#344B62] leading-relaxed">
              Target 6.1: Achieve universal and equitable access to safe and affordable drinking water. WaterPulse UG eliminates information silos so broken rural water pumps are made visible and repaired quickly.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2] space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#2878C8]">
              <School className="w-4 h-4 text-[#0DAB9B]" />
              <span>SDG 4: Quality Education</span>
            </div>
            <p className="text-[#344B62] leading-relaxed">
              When school water points fail, children (especially young girls) lose study hours walking long distances for water. WaterPulse UG awards extra priority weight (+15 points) whenever a school depends on the water point.
            </p>
          </div>
        </div>
      </div>

      {/* Hackathon Prototype Disclosure */}
      <div className="p-4 rounded-xl bg-[#E4F0FA] border border-[#D9E7F2] text-xs text-[#344B62] space-y-1">
        <h4 className="font-bold text-[#173B57]">Hackathon Prototype Boundaries</h4>
        <p className="text-[#647B91] leading-relaxed">
          WaterPulse UG is a civic technology demonstration prototype built for the SDG 6 Hackathon. It does not claim official endorsement by the Ugandan Ministry of Water and Environment or local district local governments. All sample records carry an explicit <code className="font-mono text-[#2878C8]">isDemo: true</code> field.
        </p>
      </div>
    </div>
  );
};
