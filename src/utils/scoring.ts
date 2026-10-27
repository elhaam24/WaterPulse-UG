import { PriorityBand, PriorityBreakdown } from '../types';

export interface ScoringInput {
  reportedDurationDays?: number | null;
  estimatedPeopleAffected?: number | null;
  schoolDependent?: boolean;
  healthFacilityDependent?: boolean;
}

/**
 * Deterministic Priority Scoring Algorithm
 * Strictly complies with the WaterPulse UG SDG 6 Civic Triage Policy (0-100 pts)
 */
export function calculatePriorityScore(input: ScoringInput): PriorityBreakdown {
  const missingFields: string[] = [];
  let isProvisional = false;

  // 1. REPORTED DURATION (0 - 30 points)
  let durationPoints = 0;
  if (input.reportedDurationDays === null || input.reportedDurationDays === undefined || isNaN(input.reportedDurationDays)) {
    durationPoints = 0;
    missingFields.push('Reported duration out of service');
    isProvisional = true;
  } else {
    const days = Math.max(0, input.reportedDurationDays);
    if (days === 0) {
      durationPoints = 0;
    } else if (days === 1) {
      durationPoints = 8;
    } else if (days === 2) {
      durationPoints = 13;
    } else if (days >= 3 && days <= 4) {
      durationPoints = 20;
    } else if (days >= 5 && days <= 6) {
      durationPoints = 25;
    } else {
      // 7 or more days
      durationPoints = 30;
    }
  }

  // 2. ESTIMATED PEOPLE AFFECTED (0 - 40 points)
  let peoplePoints = 0;
  if (input.estimatedPeopleAffected === null || input.estimatedPeopleAffected === undefined || isNaN(input.estimatedPeopleAffected)) {
    peoplePoints = 0;
    missingFields.push('Estimated number of people affected');
    isProvisional = true;
  } else {
    const people = Math.max(0, input.estimatedPeopleAffected);
    if (people < 50) {
      peoplePoints = 5;
    } else if (people <= 199) {
      peoplePoints = 15;
    } else if (people <= 499) {
      peoplePoints = 25;
    } else {
      // 500 or more people
      peoplePoints = 40;
    }
  }

  // 3. CRITICAL FACILITIES (0 - 30 points combined max)
  const schoolPoints = input.schoolDependent ? 15 : 0;
  const healthFacilityPoints = input.healthFacilityDependent ? 15 : 0;
  const facilityPoints = Math.min(30, schoolPoints + healthFacilityPoints);

  // TOTAL SCORE (0 - 100 points)
  const score = Math.min(100, durationPoints + peoplePoints + facilityPoints);

  // PRIORITY BANDS
  let band: PriorityBand = 'Low';
  if (score >= 70) {
    band = 'High';
  } else if (score >= 40) {
    band = 'Medium';
  } else {
    band = 'Low';
  }

  return {
    score,
    band,
    isProvisional,
    missingFields,
    durationPoints,
    peoplePoints,
    schoolPoints,
    healthFacilityPoints,
    facilityPoints,
  };
}

export function getPriorityBandColor(band: PriorityBand): {
  text: string;
  bg: string;
  border: string;
  dot: string;
} {
  switch (band) {
    case 'High':
      return {
        text: 'text-[#E76F75]',
        bg: 'bg-[#FDF2F2]',
        border: 'border-[#F8D2D4]',
        dot: '#E76F75',
      };
    case 'Medium':
      return {
        text: 'text-[#B87A14]',
        bg: 'bg-[#FEF8EC]',
        border: 'border-[#F9E6C3]',
        dot: '#F0B44D',
      };
    case 'Low':
    default:
      return {
        text: 'text-[#2878C8]',
        bg: 'bg-[#F0F7FC]',
        border: 'border-[#D9E7F2]',
        dot: '#2878C8',
      };
  }
}
