import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WaterReport, ReportStatus, IssueCategory, ActivityLog } from '../types';
import { INITIAL_DEMO_REPORTS } from '../data/seedData';
import { calculatePriorityScore } from '../utils/scoring';
import { findPotentialDuplicates } from '../utils/duplicates';

const STORAGE_KEY = 'waterpulse_ug_reports_v1';

interface ReportsContextType {
  reports: WaterReport[];
  currentRole: 'reviewer' | 'public';
  reviewerName: string;
  reviewerTitle: string;
  setCurrentRole: (role: 'reviewer' | 'public') => void;
  addReport: (newReport: {
    waterPointName: string;
    locationName: string;
    district: string;
    coordinates?: { lat: number; lng: number };
    issueType: IssueCategory;
    description: string;
    reportedDurationDays?: number | null;
    estimatedPeopleAffected?: number | null;
    schoolDependent: boolean;
    healthFacilityDependent: boolean;
    schoolName?: string;
    healthFacilityName?: string;
    reporterContact?: string;
  }) => Promise<WaterReport>;
  updateReportStatus: (reportId: string, newStatus: ReportStatus, details?: string) => void;
  assignReport: (reportId: string, assignedTo: string, notes?: string) => void;
  resolveReport: (reportId: string, resolutionDescription: string, notes?: string) => void;
  linkDuplicate: (primaryId: string, duplicateId: string) => void;
  updateReviewerNotes: (reportId: string, notes: string) => void;
  resetDemoData: () => void;
  isBackendConnected: boolean;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<WaterReport[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read from localStorage, using initial seed:', e);
    }
    return INITIAL_DEMO_REPORTS;
  });

  const [currentRole, setCurrentRole] = useState<'reviewer' | 'public'>('reviewer');
  const reviewerName = 'Sarah Namukasa';
  const reviewerTitle = 'District Water Reviewer (Mukono & Central)';
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to persist reports to localStorage:', e);
    }
  }, [reports]);

  // Check backend health
  useEffect(() => {
    fetch('/api/system-status')
      .then((res) => res.json())
      .then((data) => {
        setIsBackendConnected(data.status === 'healthy');
      })
      .catch(() => {
        setIsBackendConnected(false);
      });
  }, []);

  const addReport = async (input: {
    waterPointName: string;
    locationName: string;
    district: string;
    coordinates?: { lat: number; lng: number };
    issueType: IssueCategory;
    description: string;
    reportedDurationDays?: number | null;
    estimatedPeopleAffected?: number | null;
    schoolDependent: boolean;
    healthFacilityDependent: boolean;
    schoolName?: string;
    healthFacilityName?: string;
    reporterContact?: string;
  }): Promise<WaterReport> => {
    const timestamp = new Date().toISOString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reportId = `WPUG-2026-${randomSuffix}`;

    // 1. Calculate deterministic priority score
    const breakdown = calculatePriorityScore({
      reportedDurationDays: input.reportedDurationDays,
      estimatedPeopleAffected: input.estimatedPeopleAffected,
      schoolDependent: input.schoolDependent,
      healthFacilityDependent: input.healthFacilityDependent,
    });

    // 2. Compute deterministic duplicate candidates
    const duplicateMatches = findPotentialDuplicates(
      {
        reportId,
        waterPointName: input.waterPointName,
        locationName: input.locationName,
        issueType: input.issueType,
        description: input.description,
        coordinates: input.coordinates,
        submittedAt: timestamp,
      },
      reports
    );

    const initialReport: WaterReport = {
      reportId,
      waterPointName: input.waterPointName || 'Unnamed Water Point',
      locationName: input.locationName || 'Unknown Community',
      district: input.district || 'Unspecified District',
      coordinates: input.coordinates,
      issueType: input.issueType,
      description: input.description,
      reportedDurationDays: input.reportedDurationDays,
      estimatedPeopleAffected: input.estimatedPeopleAffected,
      schoolDependent: input.schoolDependent,
      healthFacilityDependent: input.healthFacilityDependent,
      schoolName: input.schoolName,
      healthFacilityName: input.healthFacilityName,
      priorityScore: breakdown.score,
      priorityBand: breakdown.band,
      isProvisionalScore: breakdown.isProvisional,
      missingInformation: breakdown.missingFields,
      priorityBreakdown: breakdown,
      possibleDuplicateIds: duplicateMatches.map((m) => m.candidateId),
      linkedDuplicateIds: [],
      status: 'Unverified',
      submittedAt: timestamp,
      updatedAt: timestamp,
      activityHistory: [
        {
          id: `act-${Date.now()}-1`,
          timestamp,
          actor: currentRole === 'reviewer' ? `${reviewerName} (Logged for Citizen)` : 'Community Member (Public Web)',
          action: 'Report Submitted',
          details: 'Initial submission logged and queued for technical triage',
        },
      ],
      dataSource: 'community_submission',
      isDemo: true, // Demo environment marker
      reporterContactMasked: input.reporterContact
        ? input.reporterContact.slice(0, 7) + '***' + input.reporterContact.slice(-3)
        : undefined,
    };

    // 3. Request Server-Side Gemini analysis with safety timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('/api/gemini/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          initialReport.geminiAnalysis = data.analysis;
        }
      }
    } catch (err) {
      console.warn('Gemini analysis timed out or unreachable, relying on client breakdown:', err);
    }

    setReports((prev) => [initialReport, ...prev]);
    return initialReport;
  };

  const updateReportStatus = (reportId: string, newStatus: ReportStatus, details?: string) => {
    const timestamp = new Date().toISOString();
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.reportId !== reportId) return rep;

        const newHistory: ActivityLog = {
          id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          actor: `${reviewerName} (${reviewerTitle})`,
          action: `Status Updated to ${newStatus}`,
          details: details || `Verified and transitioned status to ${newStatus}`,
        };

        const updated: WaterReport = {
          ...rep,
          status: newStatus,
          updatedAt: timestamp,
          activityHistory: [...rep.activityHistory, newHistory],
        };

        if (newStatus === 'Verified' && !updated.verifiedAt) {
          updated.verifiedAt = timestamp;
        }

        return updated;
      })
    );
  };

  const assignReport = (reportId: string, assignedTo: string, notes?: string) => {
    const timestamp = new Date().toISOString();
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.reportId !== reportId) return rep;

        const newHistory: ActivityLog = {
          id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          actor: `${reviewerName} (${reviewerTitle})`,
          action: 'Repair Crew Assigned',
          details: `Dispatched to: ${assignedTo}${notes ? ` | Note: ${notes}` : ''}`,
        };

        return {
          ...rep,
          status: 'Assigned',
          assignedTo,
          assignedAt: timestamp,
          reviewerNotes: notes ? (rep.reviewerNotes ? `${rep.reviewerNotes}\n${notes}` : notes) : rep.reviewerNotes,
          updatedAt: timestamp,
          activityHistory: [...rep.activityHistory, newHistory],
        };
      })
    );
  };

  const resolveReport = (reportId: string, resolutionDescription: string, notes?: string) => {
    const timestamp = new Date().toISOString();
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.reportId !== reportId) return rep;

        const newHistory: ActivityLog = {
          id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp,
          actor: `${reviewerName} (${reviewerTitle})`,
          action: 'Report Marked Resolved',
          details: `Resolution: ${resolutionDescription}`,
        };

        return {
          ...rep,
          status: 'Resolved',
          resolvedAt: timestamp,
          resolutionDescription,
          reviewerNotes: notes ? (rep.reviewerNotes ? `${rep.reviewerNotes}\n${notes}` : notes) : rep.reviewerNotes,
          updatedAt: timestamp,
          activityHistory: [...rep.activityHistory, newHistory],
        };
      })
    );
  };

  const linkDuplicate = (primaryId: string, duplicateId: string) => {
    const timestamp = new Date().toISOString();
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.reportId === primaryId) {
          const alreadyLinked = rep.linkedDuplicateIds.includes(duplicateId);
          return {
            ...rep,
            linkedDuplicateIds: alreadyLinked ? rep.linkedDuplicateIds : [...rep.linkedDuplicateIds, duplicateId],
            activityHistory: [
              ...rep.activityHistory,
              {
                id: `act-${Date.now()}-dup1`,
                timestamp,
                actor: `${reviewerName} (${reviewerTitle})`,
                action: 'Linked Duplicate Report',
                details: `Linked associated report ${duplicateId} as representing the same fault`,
              },
            ],
          };
        }
        if (rep.reportId === duplicateId) {
          const alreadyLinked = rep.linkedDuplicateIds.includes(primaryId);
          return {
            ...rep,
            linkedDuplicateIds: alreadyLinked ? rep.linkedDuplicateIds : [...rep.linkedDuplicateIds, primaryId],
            activityHistory: [
              ...rep.activityHistory,
              {
                id: `act-${Date.now()}-dup2`,
                timestamp,
                actor: `${reviewerName} (${reviewerTitle})`,
                action: 'Linked to Primary Report',
                details: `Linked to primary report ${primaryId}`,
              },
            ],
          };
        }
        return rep;
      })
    );
  };

  const updateReviewerNotes = (reportId: string, notes: string) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.reportId !== reportId) return rep;
        return {
          ...rep,
          reviewerNotes: notes,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const resetDemoData = () => {
    setReports(INITIAL_DEMO_REPORTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REPORTS));
    } catch (e) {
      console.warn('Failed to reset localStorage:', e);
    }
  };

  return (
    <ReportsContext.Provider
      value={{
        reports,
        currentRole,
        reviewerName,
        reviewerTitle,
        setCurrentRole,
        addReport,
        updateReportStatus,
        assignReport,
        resolveReport,
        linkDuplicate,
        updateReviewerNotes,
        resetDemoData,
        isBackendConnected,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};
