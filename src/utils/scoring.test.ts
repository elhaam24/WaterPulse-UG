import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePriorityScore } from './scoring.ts';

test('scoring: duration threshold boundaries', () => {
  // 0 days -> 0 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 10 }).durationPoints, 0);
  // 1 day -> 8 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 1, estimatedPeopleAffected: 10 }).durationPoints, 8);
  // 2 days -> 13 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 2, estimatedPeopleAffected: 10 }).durationPoints, 13);
  // 3-4 days -> 20 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 3, estimatedPeopleAffected: 10 }).durationPoints, 20);
  assert.equal(calculatePriorityScore({ reportedDurationDays: 4, estimatedPeopleAffected: 10 }).durationPoints, 20);
  // 5-6 days -> 25 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 5, estimatedPeopleAffected: 10 }).durationPoints, 25);
  assert.equal(calculatePriorityScore({ reportedDurationDays: 6, estimatedPeopleAffected: 10 }).durationPoints, 25);
  // 7+ days -> 30 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 7, estimatedPeopleAffected: 10 }).durationPoints, 30);
  assert.equal(calculatePriorityScore({ reportedDurationDays: 14, estimatedPeopleAffected: 10 }).durationPoints, 30);
});

test('scoring: estimated people affected boundaries', () => {
  // <50 -> 5 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 20 }).peoplePoints, 5);
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 49 }).peoplePoints, 5);
  // 50-199 -> 15 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 50 }).peoplePoints, 15);
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 199 }).peoplePoints, 15);
  // 200-499 -> 25 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 200 }).peoplePoints, 25);
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 499 }).peoplePoints, 25);
  // >=500 -> 40 pts
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 500 }).peoplePoints, 40);
  assert.equal(calculatePriorityScore({ reportedDurationDays: 0, estimatedPeopleAffected: 2000 }).peoplePoints, 40);
});

test('scoring: critical facilities points', () => {
  // Neither -> 0 pts
  assert.equal(calculatePriorityScore({ schoolDependent: false, healthFacilityDependent: false }).facilityPoints, 0);
  // School only -> 15 pts
  assert.equal(calculatePriorityScore({ schoolDependent: true, healthFacilityDependent: false }).facilityPoints, 15);
  // Health only -> 15 pts
  assert.equal(calculatePriorityScore({ schoolDependent: false, healthFacilityDependent: true }).facilityPoints, 15);
  // Both -> 30 pts max
  assert.equal(calculatePriorityScore({ schoolDependent: true, healthFacilityDependent: true }).facilityPoints, 30);
});

test('scoring: priority band thresholds', () => {
  // Low: 0-39
  const low = calculatePriorityScore({ reportedDurationDays: 1, estimatedPeopleAffected: 30 }); // 8 + 5 = 13
  assert.equal(low.band, 'Low');
  assert.equal(low.score, 13);

  // Medium: 40-69
  // 25 (5 days) + 15 (100 people) = 40 (threshold edge)
  const medEdge = calculatePriorityScore({ reportedDurationDays: 5, estimatedPeopleAffected: 100 });
  assert.equal(medEdge.score, 40);
  assert.equal(medEdge.band, 'Medium');

  // School demo: 5 days (25) + 300 people (25) + school (15) = 65 pts -> Medium
  const schoolDemo = calculatePriorityScore({ reportedDurationDays: 5, estimatedPeopleAffected: 300, schoolDependent: true });
  assert.equal(schoolDemo.score, 65);
  assert.equal(schoolDemo.band, 'Medium');

  // High: 70-100
  // 25 (5 days) + 40 (600 people) + 15 (school) = 80 pts -> High
  const highCase = calculatePriorityScore({ reportedDurationDays: 5, estimatedPeopleAffected: 600, schoolDependent: true });
  assert.equal(highCase.score, 80);
  assert.equal(highCase.band, 'High');

  // Maximum ceiling test (30 + 40 + 30 = 100)
  const maxCase = calculatePriorityScore({ reportedDurationDays: 10, estimatedPeopleAffected: 1000, schoolDependent: true, healthFacilityDependent: true });
  assert.equal(maxCase.score, 100);
  assert.equal(maxCase.band, 'High');
});

test('scoring: incomplete data marks assessment as provisional', () => {
  const missingPeople = calculatePriorityScore({ reportedDurationDays: 3, estimatedPeopleAffected: null });
  assert.equal(missingPeople.isProvisional, true);
  assert.ok(missingPeople.missingFields.includes('Estimated number of people affected'));

  const missingDuration = calculatePriorityScore({ reportedDurationDays: undefined, estimatedPeopleAffected: 250 });
  assert.equal(missingDuration.isProvisional, true);
  assert.ok(missingDuration.missingFields.includes('Reported duration out of service'));
});
