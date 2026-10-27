import test from 'node:test';
import assert from 'node:assert/strict';
import { maskPhoneNumber, parseSmsRuleBased } from './smsParser.ts';
import { calculatePriorityScore } from './scoring.ts';

test('phone masking: masks standard Ugandan numbers', () => {
  assert.equal(maskPhoneNumber('+256771234567'), '+256 77 •••• 567');
  assert.equal(maskPhoneNumber('0771234567'), '+256 77 •••• 567');
  assert.equal(maskPhoneNumber('+256709876543'), '+256 70 •••• 543');
  assert.equal(maskPhoneNumber(''), 'Anonymous');
  assert.equal(maskPhoneNumber(undefined), 'Anonymous');
});

test('sms parsing: extracts school, duration, people, and district from unstructured SMS', () => {
  const sample = 'Borehole broken Mukono near St Kizito School 5 days 300 people';
  const parsed = parseSmsRuleBased(sample);

  assert.equal(parsed.district, 'Mukono');
  assert.equal(parsed.problemCategory, 'broken_pump');
  assert.equal(parsed.schoolDependent, true);
  assert.equal(parsed.healthFacilityDependent, false);
  assert.equal(parsed.reportedDurationDays, 5);
  assert.equal(parsed.estimatedPeopleAffected, 300);

  // Deterministic scoring calculation
  const score = calculatePriorityScore({
    reportedDurationDays: parsed.reportedDurationDays,
    estimatedPeopleAffected: parsed.estimatedPeopleAffected,
    schoolDependent: parsed.schoolDependent,
    healthFacilityDependent: parsed.healthFacilityDependent,
  });

  // 25 (5 days) + 25 (300 people) + 15 (school) = 65 pts -> Medium
  assert.equal(score.score, 65);
  assert.equal(score.band, 'Medium');
});

test('sms parsing: handles clinic dependency and prolonged outage', () => {
  const sample = 'Wakiso health center tap is dry for 8 days serving 600 people';
  const parsed = parseSmsRuleBased(sample);

  assert.equal(parsed.district, 'Wakiso');
  assert.equal(parsed.problemCategory, 'no_water_supply');
  assert.equal(parsed.schoolDependent, false);
  assert.equal(parsed.healthFacilityDependent, true);
  assert.equal(parsed.reportedDurationDays, 8);
  assert.equal(parsed.estimatedPeopleAffected, 600);

  const score = calculatePriorityScore({
    reportedDurationDays: parsed.reportedDurationDays,
    estimatedPeopleAffected: parsed.estimatedPeopleAffected,
    schoolDependent: parsed.schoolDependent,
    healthFacilityDependent: parsed.healthFacilityDependent,
  });

  // 30 (8 days) + 40 (600 people) + 15 (clinic) = 85 pts -> High
  assert.equal(score.score, 85);
  assert.equal(score.band, 'High');
});
