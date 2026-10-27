import { DuplicateMatchResult, WaterReport } from '../types';

/**
 * Calculates Haversine distance in kilometers between two lat/lng pairs
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tokenize string into meaningful words for lexical similarity
 */
function tokenize(str: string): Set<string> {
  const clean = str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(clean);
}

/**
 * Compute Jaccard similarity between two token sets (0 to 1)
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Detect possible duplicate reports using deterministic rules
 */
export function findPotentialDuplicates(
  targetReport: Partial<WaterReport>,
  allReports: WaterReport[],
  threshold = 30
): DuplicateMatchResult[] {
  const results: DuplicateMatchResult[] = [];

  const targetTokens = tokenize(
    `${targetReport.waterPointName || ''} ${targetReport.locationName || ''} ${targetReport.description || ''}`
  );
  const targetLocation = (targetReport.locationName || '').toLowerCase().trim();
  const targetName = (targetReport.waterPointName || '').toLowerCase().trim();

  for (const report of allReports) {
    // Never compare a report with itself
    if (targetReport.reportId && report.reportId === targetReport.reportId) {
      continue;
    }

    let confidence = 0;
    const reasons: string[] = [];

    // 1. Water-point name similarity
    const reportName = report.waterPointName.toLowerCase().trim();
    if (targetName && reportName) {
      if (targetName === reportName) {
        confidence += 40;
        reasons.push('Identical water-point name');
      } else if (targetName.includes(reportName) || reportName.includes(targetName)) {
        confidence += 30;
        reasons.push('Similar water-point naming');
      }
    }

    // 2. Location / Community match
    const reportLocation = report.locationName.toLowerCase().trim();
    if (targetLocation && reportLocation) {
      if (targetLocation === reportLocation) {
        confidence += 25;
        reasons.push(`Exact community match (${report.locationName})`);
      } else if (targetLocation.includes(reportLocation) || reportLocation.includes(targetLocation)) {
        confidence += 15;
        reasons.push(`Nearby community match (${report.locationName})`);
      }
    }

    // 3. Issue Category alignment
    if (targetReport.issueType && targetReport.issueType === report.issueType) {
      confidence += 15;
      reasons.push(`Same issue category (${report.issueType.replace('_', ' ')})`);
    }

    // 4. Geographic distance (if coordinates available on both)
    if (
      targetReport.coordinates?.lat &&
      targetReport.coordinates?.lng &&
      report.coordinates?.lat &&
      report.coordinates?.lng
    ) {
      const distKm = calculateHaversineDistance(
        targetReport.coordinates.lat,
        targetReport.coordinates.lng,
        report.coordinates.lat,
        report.coordinates.lng
      );
      if (distKm <= 0.5) {
        confidence += 35;
        reasons.push(`Within 500m radius (${(distKm * 1000).toFixed(0)}m away)`);
      } else if (distKm <= 2.0) {
        confidence += 20;
        reasons.push(`Within 2km radius (${distKm.toFixed(1)}km away)`);
      }
    }

    // 5. Lexical text overlap (description tokens)
    const reportTokens = tokenize(
      `${report.waterPointName} ${report.locationName} ${report.description}`
    );
    const textSimilarity = jaccardSimilarity(targetTokens, reportTokens);
    if (textSimilarity > 0.35) {
      confidence += 15;
      reasons.push(`High lexical description overlap (${(textSimilarity * 100).toFixed(0)}%)`);
    }

    // 6. Time proximity (within 14 days)
    if (targetReport.submittedAt && report.submittedAt) {
      const t1 = new Date(targetReport.submittedAt).getTime();
      const t2 = new Date(report.submittedAt).getTime();
      const diffDays = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) {
        confidence += 10;
        reasons.push(`Reported within ${diffDays.toFixed(0)} days of each other`);
      }
    }

    const finalConfidence = Math.min(99, confidence);

    if (finalConfidence >= threshold) {
      results.push({
        candidateId: report.reportId,
        candidateReport: report,
        confidenceScore: finalConfidence,
        reasons,
      });
    }
  }

  // Sort descending by confidence score
  return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
}
