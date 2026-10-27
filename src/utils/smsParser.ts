import { PriorityBand, PriorityBreakdown } from '../types.ts';

export interface ParsedSmsReport {
  waterPointName: string;
  district: string;
  problemCategory: 'broken_pump' | 'no_water_supply' | 'suspected_contamination' | 'pipe_leakage' | 'other';
  reportedDurationDays: number;
  estimatedPeopleAffected: number;
  schoolDependent: boolean;
  healthFacilityDependent: boolean;
  description: string;
}

export interface InboundSmsRecord {
  ticketId: string;
  rawFrom: string;
  maskedFrom: string;
  rawText: string;
  linkId?: string | null;
  parsed: ParsedSmsReport;
  priorityScore: number;
  priorityBand: PriorityBand;
  priorityBreakdown: PriorityBreakdown;
  outboundSmsMessage: string;
  outboundDeliveryStatus: 'sent' | 'simulated' | 'failed';
  receivedAt: string;
  source: 'gemini_3.8_flash' | 'rule_based_fallback';
}

/**
 * Mask reporter's phone number for privacy (e.g. "+256 77 •••• 123")
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return 'Anonymous';
  const cleaned = phone.trim();

  // Ugandan telephone formats: +256 7X XXX XXX or 07X XXX XXX
  const ugMatch = cleaned.match(/^(\+?256|0)(7\d)(\d{3,4})(\d{3})$/);
  if (ugMatch) {
    const code = ugMatch[1].startsWith('+') ? '+256' : ugMatch[1] === '0' ? '+256' : `+${ugMatch[1]}`;
    return `${code} ${ugMatch[2]} •••• ${ugMatch[4]}`;
  }

  // Generic international masking
  if (cleaned.length >= 8) {
    return `${cleaned.slice(0, 5)} •••• ${cleaned.slice(-3)}`;
  }
  return cleaned;
}

/**
 * Deterministic rule-based SMS parser fallback
 */
export function parseSmsRuleBased(text: string): ParsedSmsReport {
  const lower = text.toLowerCase();

  // 1. Issue Category Detection
  let problemCategory: ParsedSmsReport['problemCategory'] = 'other';
  if (lower.includes('broken') || lower.includes('pump') || lower.includes('handle') || lower.includes('cylinder') || lower.includes('chain')) {
    problemCategory = 'broken_pump';
  } else if (lower.includes('no water') || lower.includes('dry') || lower.includes('dried') || lower.includes('stopped')) {
    problemCategory = 'no_water_supply';
  } else if (lower.includes('dirty') || lower.includes('brown') || lower.includes('smell') || lower.includes('contaminat') || lower.includes('rust')) {
    problemCategory = 'suspected_contamination';
  } else if (lower.includes('leak') || lower.includes('burst') || lower.includes('pipe')) {
    problemCategory = 'pipe_leakage';
  }

  // 2. Critical Facilities (School / Health Facility)
  const schoolDependent = /school|sch|pupil|student|primary|secondary|academy|college/i.test(text);
  const healthFacilityDependent = /hospital|clinic|health\s*center|dispensary|patient|hc\s*iv|hc\s*iii|hc\s*ii/i.test(text);

  // 3. Duration Out of Service (Days / Weeks / Months)
  let reportedDurationDays = 0;
  const daysMatch = text.match(/(\d+)\s*(?:days?|nnaku|ennaku)/i);
  const weeksMatch = text.match(/(\d+)\s*(?:weeks?|sabbiiti|wikis?)/i);
  const monthsMatch = text.match(/(\d+)\s*(?:months?|myezi)/i);

  if (daysMatch) {
    reportedDurationDays = parseInt(daysMatch[1], 10);
  } else if (weeksMatch) {
    reportedDurationDays = parseInt(weeksMatch[1], 10) * 7;
  } else if (monthsMatch) {
    reportedDurationDays = parseInt(monthsMatch[1], 10) * 30;
  }

  // 4. Estimated People Affected
  let estimatedPeopleAffected = 0;
  const peopleMatch =
    text.match(/(\d+)\s*(?:people|abantu|persons|users|families|households|villagers)/i) ||
    text.match(/(?:affecting|affected|serving|users|population)\s*(?:about|approx|over)?\s*(\d+)/i);
  if (peopleMatch) {
    estimatedPeopleAffected = parseInt(peopleMatch[1], 10);
  }

  // 5. Ugandan District Detection
  const ugDistricts = [
    'Mukono', 'Wakiso', 'Kampala', 'Jinja', 'Luweero', 'Luwero', 'Mpigi', 'Kayunga',
    'Buikwe', 'Iganga', 'Kamuli', 'Mityana', 'Masaka', 'Soroti', 'Gulu', 'Lira',
    'Mbale', 'Arua', 'Kabarole', 'Kasese', 'Tororo', 'Mbarara', 'Hoima'
  ];
  let district = 'Mukono';
  for (const d of ugDistricts) {
    if (new RegExp(`\\b${d}\\b`, 'i').test(text)) {
      district = d;
      break;
    }
  }

  // 6. Water Point Name Extraction
  let waterPointName = `${district} Water Point`;
  const nameMatch = text.match(/(?:at|for|near|on)\s+([A-Z][a-zA-Z0-9\s'’-]+?)(?:\s+(?:borehole|well|pump|tap|school|village|market|in|district|\d|\.|\,)|$)/i);
  if (nameMatch && nameMatch[1].trim().length > 2) {
    waterPointName = `${nameMatch[1].trim()} Water Point`;
  } else if (/borehole/i.test(text)) {
    waterPointName = `${district} Borehole`;
  } else if (/tap|piped/i.test(text)) {
    waterPointName = `${district} Public Tap`;
  }

  return {
    waterPointName,
    district,
    problemCategory,
    reportedDurationDays,
    estimatedPeopleAffected,
    schoolDependent,
    healthFacilityDependent,
    description: text.trim(),
  };
}
