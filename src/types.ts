export type ReportStatus = 'Unverified' | 'Verified' | 'Assigned' | 'Resolved';

export type PriorityBand = 'Low' | 'Medium' | 'High';

export type IssueCategory =
  | 'broken_pump'
  | 'no_water_supply'
  | 'damaged_infrastructure'
  | 'suspected_contamination'
  | 'other_water_access';

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details?: string;
}

export interface PriorityBreakdown {
  score: number;
  band: PriorityBand;
  isProvisional: boolean;
  missingFields: string[];
  durationPoints: number;
  peoplePoints: number;
  schoolPoints: number;
  healthFacilityPoints: number;
  facilityPoints: number;
}

export interface GeminiAnalysis {
  summary: string;
  suggestedCategory: IssueCategory;
  extractedFacts: {
    location?: string;
    reportedDurationDays?: number;
    estimatedPeopleAffected?: number;
    schoolDependent?: boolean;
    healthFacilityDependent?: boolean;
    infrastructureType?: string;
  };
  missingInformation: string[];
  justificationFactors: string[];
  possibleDuplicateIds: string[];
  lugandaTranslationDraft: string;
  englishBulletinDraft: string;
  analyzedAt: string;
  isFallback: boolean;
}

export interface WaterReport {
  reportId: string;
  waterPointName: string;
  locationName: string;
  district: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  issueType: IssueCategory;
  description: string;
  reportedDurationDays?: number | null;
  estimatedPeopleAffected?: number | null;
  schoolDependent: boolean;
  healthFacilityDependent: boolean;
  schoolName?: string;
  healthFacilityName?: string;
  priorityScore: number;
  priorityBand: PriorityBand;
  isProvisionalScore: boolean;
  missingInformation: string[];
  priorityBreakdown: PriorityBreakdown;
  possibleDuplicateIds: string[];
  linkedDuplicateIds: string[];
  status: ReportStatus;
  submittedAt: string;
  updatedAt: string;
  verifiedAt?: string;
  assignedTo?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolutionDescription?: string;
  reviewerNotes?: string;
  activityHistory: ActivityLog[];
  geminiAnalysis?: GeminiAnalysis;
  dataSource: 'community_submission' | 'reviewer_entry' | 'demo_seed';
  isDemo: boolean;
  reporterContactMasked?: string;
}

export interface DuplicateMatchResult {
  candidateId: string;
  candidateReport: WaterReport;
  confidenceScore: number; // 0 - 100
  reasons: string[];
}
