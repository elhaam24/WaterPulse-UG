import React, { useState } from 'react';
import { Radio, Copy, Check, Sparkles, Languages, RefreshCw, Send, ChevronRight } from 'lucide-react';
import { useReports } from '../context/ReportsContext';
import { WaterReport } from '../types';

export const CommunityBulletinsView: React.FC = () => {
  const { reports } = useReports();
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.reportId || '');
  const [targetLanguage, setTargetLanguage] = useState<'english' | 'luganda'>('english');
  const [copied, setCopied] = useState(false);
  const [customActionNotes, setCustomActionNotes] = useState('');
  const [customNextStep, setCustomNextStep] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedReport = reports.find((r) => r.reportId === selectedReportId) || reports[0];

  const [bulletinEnglish, setBulletinEnglish] = useState(
    selectedReport?.geminiAnalysis?.englishBulletinDraft ||
      `Community Water Update (${selectedReport?.locationName}): The water fault at ${selectedReport?.waterPointName} is currently ${selectedReport?.status}. Technical review is active.`
  );

  const [bulletinLuganda, setBulletinLuganda] = useState(
    selectedReport?.geminiAnalysis?.lugandaTranslationDraft ||
      `Okumanyisa eri abatuuze b'e ${selectedReport?.locationName}: Ensonga y'amazzi ku ${selectedReport?.waterPointName} eri mu ${selectedReport?.status}. Abakugu bakyagikebejja.`
  );

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    const rep = reports.find((r) => r.reportId === id);
    if (rep) {
      if (rep.geminiAnalysis?.englishBulletinDraft) {
        setBulletinEnglish(rep.geminiAnalysis.englishBulletinDraft);
      } else {
        setBulletinEnglish(
          `WaterPulse UG Community Update for ${rep.locationName}: Water point ${rep.waterPointName} is currently ${rep.status}. Technical review underway.`
        );
      }
      if (rep.geminiAnalysis?.lugandaTranslationDraft) {
        setBulletinLuganda(rep.geminiAnalysis.lugandaTranslationDraft);
      } else {
        setBulletinLuganda(
          `Amawulire g'amazzi e ${rep.locationName}: Ensulo ${rep.waterPointName} eri mu mbeera ya ${rep.status}. Okwekenneenya kuli mu maaso.`
        );
      }
    }
  };

  const handleGenerateCustom = async () => {
    if (!selectedReport) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: selectedReport,
          actionSummary: customActionNotes.trim() || undefined,
          nextSteps: customNextStep.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.bulletin) {
          setBulletinEnglish(data.bulletin.english);
          setBulletinLuganda(data.bulletin.luganda);
        }
      }
    } catch (err) {
      console.error('Failed to generate bulletin:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentText = targetLanguage === 'english' ? bulletinEnglish : bulletinLuganda;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
        <h2 className="text-base font-bold text-[#173B57]">Community Bulletins & Radio Notices</h2>
        <p className="text-xs text-[#647B91]">
          Generate factual, transparent community updates in English and Luganda for public notice boards, local LC1 channels, and FM community radio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration & Input (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#D9E7F2] p-5 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#173B57] mb-1">
              Select Incident Report:
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => handleSelectReport(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:outline-none"
            >
              {reports.map((r) => (
                <option key={r.reportId} value={r.reportId}>
                  {r.reportId} — {r.waterPointName} ({r.district}) [{r.status}]
                </option>
              ))}
            </select>
          </div>

          {selectedReport && (
            <div className="p-3 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2] text-xs space-y-1">
              <span className="font-bold text-[#173B57] block">Selected Incident Context:</span>
              <p className="text-[#344B62]">
                <strong>Facility:</strong> {selectedReport.waterPointName}
              </p>
              <p className="text-[#344B62]">
                <strong>Current Status:</strong> {selectedReport.status}
              </p>
              {selectedReport.assignedTo && (
                <p className="text-[#344B62]">
                  <strong>Assigned To:</strong> {selectedReport.assignedTo}
                </p>
              )}
              {selectedReport.resolutionDescription && (
                <p className="text-[#0DAB9B] font-medium">
                  <strong>Resolution:</strong> {selectedReport.resolutionDescription}
                </p>
              )}
            </div>
          )}

          {/* Action / Next Steps customization */}
          <div className="space-y-3 pt-2 border-t border-[#D9E7F2]">
            <h4 className="text-xs font-bold text-[#173B57]">Customize Notice Contents</h4>

            <div>
              <label className="block text-xs font-semibold text-[#173B57] mb-1">
                Actions Actually Taken (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Borehole unit inspected valve; parts ordered"
                value={customActionNotes}
                onChange={(e) => setCustomActionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B57] mb-1">
                Confirmed Next Step (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Field crew installation scheduled for Thursday"
                value={customNextStep}
                onChange={(e) => setCustomNextStep(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerateCustom}
              disabled={isGenerating}
              className="w-full py-2 bg-[#8378E8] hover:bg-[#7266d6] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating Bilingual Update...' : 'Generate with Gemini 3.8 Flash'}</span>
            </button>
          </div>
        </div>

        {/* Right: Bilingual Bulletin Display & Copy (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#D9E7F2] p-5 shadow-2xs space-y-4">
          {/* Language Selector Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#D9E7F2]">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#2878C8]" />
              <span className="text-xs font-bold text-[#173B57]">Broadcast Language:</span>
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-[#E4F0FA] border border-[#D9E7F2]">
              <button
                onClick={() => setTargetLanguage('english')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  targetLanguage === 'english'
                    ? 'bg-white text-[#173B57] shadow-xs'
                    : 'text-[#647B91] hover:text-[#173B57]'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setTargetLanguage('luganda')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  targetLanguage === 'luganda'
                    ? 'bg-white text-[#173B57] shadow-xs'
                    : 'text-[#647B91] hover:text-[#173B57]'
                }`}
              >
                Luganda (Oluganda)
              </button>
            </div>
          </div>

          {/* Bulletin Preview Box */}
          <div className="p-4 rounded-xl bg-[#F7FAFE] border border-[#D9E7F2] space-y-3 relative">
            <div className="flex items-center justify-between text-xs text-[#647B91]">
              <span className="font-semibold text-[#173B57]">
                {targetLanguage === 'english' ? 'Official English Bulletin Draft' : 'Okumanyisa mu Luganda'}
              </span>
              <span className="font-mono text-[10px]">Ready for SMS / WhatsApp / Radio</span>
            </div>

            <textarea
              rows={5}
              value={targetLanguage === 'english' ? bulletinEnglish : bulletinLuganda}
              onChange={(e) => {
                if (targetLanguage === 'english') {
                  setBulletinEnglish(e.target.value);
                } else {
                  setBulletinLuganda(e.target.value);
                }
              }}
              className="w-full p-3 rounded-lg bg-white border border-[#D9E7F2] text-xs text-[#173B57] font-medium leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#2878C8]"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#647B91]">
                {currentText.length} characters · ~{Math.ceil(currentText.length / 160)} SMS segment(s)
              </span>

              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg bg-[#0DAB9B] hover:bg-[#0B9688] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Update</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="p-3.5 rounded-lg bg-[#E4F0FA] border border-[#D9E7F2] text-xs space-y-1">
            <span className="font-bold text-[#173B57] block">Civic Information Standard:</span>
            <p className="text-[#344B62]">
              WaterPulse UG enforces civic honesty. Updates must never fabricate repair completion dates, water purity guarantees, or claim repairs occurred without physical confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
