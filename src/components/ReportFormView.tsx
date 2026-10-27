import React, { useState } from 'react';
import {
  Droplet,
  Send,
  Sparkles,
  School,
  Building2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  MapPin,
  Camera,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { IssueCategory, WaterReport } from '../types';
import { useReports } from '../context/ReportsContext';
import { calculatePriorityScore } from '../utils/scoring';
import { NavTab } from './Sidebar';

interface ReportFormViewProps {
  setActiveTab: (tab: NavTab) => void;
  onSelectReportForReview?: (reportId: string) => void;
}

export const ReportFormView: React.FC<ReportFormViewProps> = ({
  setActiveTab,
  onSelectReportForReview,
}) => {
  const { addReport, reports } = useReports();

  // Form states
  const [waterPointName, setWaterPointName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [district, setDistrict] = useState('Mukono');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [issueType, setIssueType] = useState<IssueCategory>('broken_pump');
  const [description, setDescription] = useState('');
  const [reportedDurationDays, setReportedDurationDays] = useState<number | ''>(5);
  const [estimatedPeopleAffected, setEstimatedPeopleAffected] = useState<number | ''>(350);
  const [schoolDependent, setSchoolDependent] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [healthFacilityDependent, setHealthFacilityDependent] = useState(false);
  const [healthFacilityName, setHealthFacilityName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  // UI / Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedReport, setSubmittedReport] = useState<WaterReport | null>(null);

  // Quick fill handler for hackathon demo
  const handleQuickFillDemo = () => {
    setWaterPointName('St. Jude Primary School Handpump');
    setLocationName('Kyampisi Sub-county, Mukono');
    setDistrict('Mukono');
    setLat('0.4284');
    setLng('32.7831');
    setIssueType('broken_pump');
    setDescription(
      'The India Mark II handpump handle detached and the riser pipe is slipping. 380 pupils and neighboring community cannot fetch drinking water for 5 days.'
    );
    setReportedDurationDays(5);
    setEstimatedPeopleAffected(380);
    setSchoolDependent(true);
    setSchoolName('St. Jude Primary School');
    setHealthFacilityDependent(false);
    setHealthFacilityName('');
    setReporterContact('+256 772 108 419');
    setErrors({});
  };

  const handleResetForm = () => {
    setWaterPointName('');
    setLocationName('');
    setDistrict('Mukono');
    setLat('');
    setLng('');
    setIssueType('broken_pump');
    setDescription('');
    setReportedDurationDays('');
    setEstimatedPeopleAffected('');
    setSchoolDependent(false);
    setSchoolName('');
    setHealthFacilityDependent(false);
    setHealthFacilityName('');
    setReporterContact('');
    setErrors({});
    setSubmittedReport(null);
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!waterPointName.trim()) {
      newErrors.waterPointName = 'Water-point or borehole name is required.';
    }

    if (!locationName.trim()) {
      newErrors.locationName = 'Community, parish, or village name is required.';
    }

    if (!description.trim() || description.trim().length < 10) {
      newErrors.description = 'Please provide a clear description of the problem (minimum 10 characters).';
    }

    if (lat.trim()) {
      const latNum = parseFloat(lat);
      if (isNaN(latNum) || latNum < -2.0 || latNum > 5.0) {
        newErrors.lat = 'Latitude must be a valid number within Uganda (-2.0 to 5.0).';
      }
    }

    if (lng.trim()) {
      const lngNum = parseFloat(lng);
      if (isNaN(lngNum) || lngNum < 28.5 || lngNum > 36.0) {
        newErrors.lng = 'Longitude must be a valid number within Uganda (28.5 to 36.0).';
      }
    }

    if (schoolDependent && !schoolName.trim()) {
      newErrors.schoolName = 'Please specify the name of the dependent school.';
    }

    if (healthFacilityDependent && !healthFacilityName.trim()) {
      newErrors.healthFacilityName = 'Please specify the name of the health center or clinic.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Live provisional score calculation for preview
  const liveBreakdown = calculatePriorityScore({
    reportedDurationDays: reportedDurationDays === '' ? null : Number(reportedDurationDays),
    estimatedPeopleAffected: estimatedPeopleAffected === '' ? null : Number(estimatedPeopleAffected),
    schoolDependent,
    healthFacilityDependent,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const report = await addReport({
        waterPointName: waterPointName.trim(),
        locationName: locationName.trim(),
        district,
        coordinates: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined,
        issueType,
        description: description.trim(),
        reportedDurationDays: reportedDurationDays === '' ? null : Number(reportedDurationDays),
        estimatedPeopleAffected: estimatedPeopleAffected === '' ? null : Number(estimatedPeopleAffected),
        schoolDependent,
        schoolName: schoolDependent ? schoolName.trim() : undefined,
        healthFacilityDependent,
        healthFacilityName: healthFacilityDependent ? healthFacilityName.trim() : undefined,
        reporterContact: reporterContact.trim() || undefined,
      });

      setSubmittedReport(report);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Quick-Fill Demo Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#173B57]">Log a Water Point Breakdown</h2>
          <p className="text-xs text-[#647B91] mt-0.5">
            Submit a water point fault. Every submission receives a deterministic vulnerability score and automated technical triage.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleQuickFillDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DDF8F0] hover:bg-[#c3f2e4] text-[#0DAB9B] text-xs font-semibold border border-[#0DAB9B]/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0DAB9B]" />
            <span>Quick-fill School Demo</span>
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="p-1.5 text-[#647B91] hover:text-[#173B57] hover:bg-[#F0F7FC] rounded-lg transition-colors"
            title="Reset form fields"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Submission Success Confirmation Modal / Card */}
      {submittedReport && (
        <div className="p-6 rounded-xl bg-white border-2 border-[#0DAB9B] shadow-md space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DDF8F0] flex items-center justify-center text-[#0DAB9B]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-semibold text-[#0DAB9B] uppercase">
                  Submission Received & Queued
                </span>
                <h3 className="text-base font-bold text-[#173B57]">
                  Report Reference: <span className="font-mono text-[#2878C8]">{submittedReport.reportId}</span>
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FEF8EC] text-[#B87A14] border border-[#F9E6C3]">
              Status: {submittedReport.status}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[#647B91] block">Water Point</span>
              <span className="font-semibold text-[#173B57]">{submittedReport.waterPointName}</span>
            </div>
            <div>
              <span className="text-[#647B91] block">Location</span>
              <span className="font-semibold text-[#173B57]">{submittedReport.locationName}</span>
            </div>
            <div>
              <span className="text-[#647B91] block">Priority Assessment</span>
              <span className="font-bold text-[#173B57] font-mono">
                {submittedReport.priorityScore} / 100 ({submittedReport.priorityBand} Priority)
              </span>
            </div>
          </div>

          {/* Gemini AI Triage Insight Preview */}
          {submittedReport.geminiAnalysis && (
            <div className="p-4 rounded-lg bg-[#F8F7FF] border border-[#8378E8]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8378E8]">
                <Sparkles className="w-4 h-4" />
                <span>
                  Gemini Structured Technical Analysis {submittedReport.geminiAnalysis.isFallback ? '(Rule-Based Fallback)' : ''}
                </span>
              </div>
              <p className="text-xs text-[#344B62] leading-relaxed">
                {submittedReport.geminiAnalysis.summary}
              </p>
              {submittedReport.geminiAnalysis.justificationFactors?.length > 0 && (
                <div className="text-[11px] text-[#647B91]">
                  <strong>Priority Justifications:</strong> {submittedReport.geminiAnalysis.justificationFactors.join(' · ')}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (onSelectReportForReview) {
                  onSelectReportForReview(submittedReport.reportId);
                }
                setActiveTab('reviewer_queue');
              }}
              className="px-4 py-2 bg-[#2878C8] hover:bg-[#1f63a6] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2"
            >
              <span>Inspect in Reviewer Queue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetForm}
              className="px-4 py-2 bg-white hover:bg-[#F0F7FC] text-[#344B62] border border-[#D9E7F2] font-medium text-xs rounded-lg transition-colors"
            >
              Log Another Problem
            </button>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-6">
        {/* Section 1: Identification */}
        <div className="space-y-4">
          <div className="border-b border-[#D9E7F2] pb-2">
            <h3 className="text-sm font-bold text-[#173B57]">1. Water Point Location & Identification</h3>
            <p className="text-xs text-[#647B91]">Tell us which borehole, well, or tap stand is broken.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="waterPointName" className="block text-xs font-semibold text-[#173B57] mb-1">
                Water Point Name <span className="text-[#E76F75]">*</span>
              </label>
              <input
                id="waterPointName"
                type="text"
                placeholder="e.g. St. Jude Primary School Handpump"
                value={waterPointName}
                onChange={(e) => setWaterPointName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#F7FAFE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2878C8] ${
                  errors.waterPointName ? 'border-[#E76F75]' : 'border-[#D9E7F2]'
                }`}
              />
              {errors.waterPointName && (
                <p className="text-[11px] text-[#E76F75] mt-1">{errors.waterPointName}</p>
              )}
            </div>

            <div>
              <label htmlFor="locationName" className="block text-xs font-semibold text-[#173B57] mb-1">
                Community, Parish, or Village <span className="text-[#E76F75]">*</span>
              </label>
              <input
                id="locationName"
                type="text"
                placeholder="e.g. Kyampisi Sub-county, Ward 2"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#F7FAFE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2878C8] ${
                  errors.locationName ? 'border-[#E76F75]' : 'border-[#D9E7F2]'
                }`}
              />
              {errors.locationName && (
                <p className="text-[11px] text-[#E76F75] mt-1">{errors.locationName}</p>
              )}
            </div>

            <div>
              <label htmlFor="district" className="block text-xs font-semibold text-[#173B57] mb-1">
                Administrative District
              </label>
              <select
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2878C8]"
              >
                <option value="Mukono">Mukono District</option>
                <option value="Kampala">Kampala District / Division</option>
                <option value="Wakiso">Wakiso District</option>
                <option value="Jinja">Jinja District</option>
                <option value="Iganga">Iganga District</option>
                <option value="Soroti">Soroti District</option>
                <option value="Kasese">Kasese District</option>
                <option value="Gulu">Gulu District</option>
                <option value="Arua">Arua District</option>
                <option value="Mbarara">Mbarara District</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B57] mb-1">
                Optional Coordinates (Lat / Lng)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Lat (e.g. 0.4284)"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className={`w-full px-2.5 py-2 text-xs rounded-lg border bg-[#F7FAFE] focus:bg-white focus:outline-none ${
                    errors.lat ? 'border-[#E76F75]' : 'border-[#D9E7F2]'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Lng (e.g. 32.7831)"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className={`w-full px-2.5 py-2 text-xs rounded-lg border bg-[#F7FAFE] focus:bg-white focus:outline-none ${
                    errors.lng ? 'border-[#E76F75]' : 'border-[#D9E7F2]'
                  }`}
                />
              </div>
              {(errors.lat || errors.lng) && (
                <p className="text-[11px] text-[#E76F75] mt-1">{errors.lat || errors.lng}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Fault Details */}
        <div className="space-y-4">
          <div className="border-b border-[#D9E7F2] pb-2">
            <h3 className="text-sm font-bold text-[#173B57]">2. Problem Diagnosis & Description</h3>
            <p className="text-xs text-[#647B91]">Describe what is wrong with the water facility.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="issueType" className="block text-xs font-semibold text-[#173B57] mb-1">
                Issue Category <span className="text-[#E76F75]">*</span>
              </label>
              <select
                id="issueType"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueCategory)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2878C8]"
              >
                <option value="broken_pump">Broken Pump / Handle Detached / Mechanical Failure</option>
                <option value="no_water_supply">No Water Supply / Dried Borehole / Zero Pressure</option>
                <option value="damaged_infrastructure">Damaged Infrastructure / Tank Leak / Solar Electrical Fault</option>
                <option value="suspected_contamination">Suspected Contamination / Turbid Water / Foul Odor</option>
                <option value="other_water_access">Other Water Access Barrier</option>
              </select>
            </div>

            <div>
              <label htmlFor="reportedDurationDays" className="block text-xs font-semibold text-[#173B57] mb-1">
                Days Out of Service (Reported Duration)
              </label>
              <input
                id="reportedDurationDays"
                type="number"
                min="0"
                max="365"
                placeholder="e.g. 5"
                value={reportedDurationDays}
                onChange={(e) => setReportedDurationDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-[#647B91]">
                Scoring: 0d=0pts, 1d=8pts, 2d=13pts, 3-4d=20pts, 5-6d=25pts, 7+d=30pts
              </span>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-xs font-semibold text-[#173B57] mb-1">
                Detailed Problem Description <span className="text-[#E76F75]">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe what occurred, any strange sounds, leaking pipes, or emergency water alternatives being used..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#F7FAFE] focus:bg-white focus:outline-none ${
                  errors.description ? 'border-[#E76F75]' : 'border-[#D9E7F2]'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-[#E76F75] mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Community & Critical Facility Impact */}
        <div className="space-y-4">
          <div className="border-b border-[#D9E7F2] pb-2">
            <h3 className="text-sm font-bold text-[#173B57]">3. Community Impact & Critical Facilities</h3>
            <p className="text-xs text-[#647B91]">Vulnerability weightings for schools and health clinics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimatedPeopleAffected" className="block text-xs font-semibold text-[#173B57] mb-1">
                Estimated People Affected
              </label>
              <input
                id="estimatedPeopleAffected"
                type="number"
                min="1"
                placeholder="e.g. 380"
                value={estimatedPeopleAffected}
                onChange={(e) => setEstimatedPeopleAffected(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-[#647B91]">
                Scoring: &lt;50=5pts, 50-199=15pts, 200-499=25pts, 500+=40pts
              </span>
            </div>

            <div>
              <label htmlFor="reporterContact" className="block text-xs font-semibold text-[#173B57] mb-1">
                Reporter Phone Number (Masked for Privacy)
              </label>
              <input
                id="reporterContact"
                type="text"
                placeholder="+256 7XX XXX XXX"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-[#647B91]">
                Stored securely; masked to public viewers per civic data privacy policy
              </span>
            </div>

            {/* School Dependency Toggle */}
            <div className="p-3.5 rounded-lg border border-[#D9E7F2] bg-[#F7FAFE]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-[#0DAB9B]" />
                  <label htmlFor="schoolDependent" className="text-xs font-bold text-[#173B57] cursor-pointer">
                    School Depends on this Water Point (+15 pts)
                  </label>
                </div>
                <input
                  id="schoolDependent"
                  type="checkbox"
                  checked={schoolDependent}
                  onChange={(e) => setSchoolDependent(e.target.checked)}
                  className="w-4 h-4 accent-[#0DAB9B] cursor-pointer"
                />
              </div>
              {schoolDependent && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter school name (e.g. St. Jude Primary School)"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs rounded border bg-white focus:outline-none ${
                      errors.schoolName ? 'border-[#E76F75]' : 'border-[#D9E7F2]'
                    }`}
                  />
                  {errors.schoolName && (
                    <p className="text-[10px] text-[#E76F75] mt-1">{errors.schoolName}</p>
                  )}
                </div>
              )}
            </div>

            {/* Health Facility Dependency Toggle */}
            <div className="p-3.5 rounded-lg border border-[#D9E7F2] bg-[#F7FAFE]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2878C8]" />
                  <label htmlFor="healthFacilityDependent" className="text-xs font-bold text-[#173B57] cursor-pointer">
                    Health Facility Depends on this Point (+15 pts)
                  </label>
                </div>
                <input
                  id="healthFacilityDependent"
                  type="checkbox"
                  checked={healthFacilityDependent}
                  onChange={(e) => setHealthFacilityDependent(e.target.checked)}
                  className="w-4 h-4 accent-[#2878C8] cursor-pointer"
                />
              </div>
              {healthFacilityDependent && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter health facility name (e.g. Bwera Sub-Clinic)"
                    value={healthFacilityName}
                    onChange={(e) => setHealthFacilityName(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs rounded border bg-white focus:outline-none ${
                      errors.healthFacilityName ? 'border-[#E76F75]' : 'border-[#D9E7F2]'
                    }`}
                  />
                  {errors.healthFacilityName && (
                    <p className="text-[10px] text-[#E76F75] mt-1">{errors.healthFacilityName}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Deterministic Priority Score Preview Banner */}
        <div className="p-4 rounded-xl bg-[#F0F7FC] border border-[#D9E7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#173B57]">Provisional Triage Score Preview:</span>
              <span className="text-sm font-extrabold font-mono text-[#2878C8]">
                {liveBreakdown.score} / 100 ({liveBreakdown.band} Priority)
              </span>
            </div>
            <p className="text-[11px] text-[#647B91]">
              Duration: {liveBreakdown.durationPoints}pts · Users: {liveBreakdown.peoplePoints}pts · Critical Facilities: {liveBreakdown.facilityPoints}pts
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-[#0DAB9B] hover:bg-[#0B9688] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Gemini Triage...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Water Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
