import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import AfricasTalking from 'africastalking';
import { calculatePriorityScore } from './src/utils/scoring.ts';
import { PriorityBand, PriorityBreakdown } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing both JSON and application/x-www-form-urlencoded payloads
// (Africa's Talking sends inbound SMS notifications as x-www-form-urlencoded by default)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. Initialize GoogleGenAI SDK on Server
// ==========================================
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[Gemini AI] GoogleGenAI client initialized successfully.');
  } catch (err) {
    console.error('[Gemini AI] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.log('[Gemini AI] GEMINI_API_KEY not configured; running in deterministic fallback mode.');
}

// ==========================================
// 2. Initialize Africa's Talking Live SDK
// ==========================================
const atApiKey = process.env.AT_API_KEY;
const atUsername = process.env.AT_USERNAME || 'sandbox';
let atClient: any = null;
let atSms: any = null;

if (atApiKey && atApiKey.trim() !== '' && atApiKey !== 'MY_AT_API_KEY') {
  try {
    atClient = AfricasTalking({
      apiKey: atApiKey.trim(),
      username: atUsername.trim(),
    });
    atSms = atClient.SMS;
    console.log(`[Africa's Talking] SDK initialized successfully (Username: "${atUsername}").`);
  } catch (err) {
    console.error("[Africa's Talking] Failed to initialize SDK client:", err);
  }
} else {
  console.log(`[Africa's Talking] AT_API_KEY not provided. Running in sandbox / simulated SMS mode.`);
}

// ==========================================
// 3. Types and In-Memory Storage for SMS
// ==========================================
import {
  ParsedSmsReport,
  InboundSmsRecord,
  maskPhoneNumber,
  parseSmsRuleBased,
} from './src/utils/smsParser.ts';

// In-memory registry of received SMS tickets
const incomingSmsReports: InboundSmsRecord[] = [];


// Helper to race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMsg)), ms)
    ),
  ]);
}

// ==========================================
// 6. Gemini 3.8 Flash SMS Parser
// ==========================================
async function parseSmsWithGemini(smsText: string): Promise<{ parsed: ParsedSmsReport; source: 'gemini_3.8_flash' | 'rule_based_fallback' }> {
  if (!aiClient) {
    return {
      parsed: parseSmsRuleBased(smsText),
      source: 'rule_based_fallback',
    };
  }

  try {
    const prompt = `You are an expert NLP parser for WaterPulse UG, a civic water-point fault reporting platform in Uganda (supporting UN SDG 6 and SDG 4).
Extract structured water fault data from this citizen's unstructured SMS report:
"${smsText}"

Analyze the SMS text and extract the exact JSON object following this schema:
- waterPointName: specific water point name if mentioned (e.g. "St Kizito School Borehole", "Kigungu Village Tap", or descriptive name with location)
- district: Ugandan district mentioned (e.g. "Mukono", "Wakiso", "Kampala", "Jinja", "Luweero", etc. Default to "Mukono" if unknown)
- problemCategory: exactly one of: "broken_pump", "no_water_supply", "suspected_contamination", "pipe_leakage", "other"
- reportedDurationDays: number of days out of service (integer, 0 if not stated or unknown)
- estimatedPeopleAffected: estimated count of people affected (integer, 0 if not stated or unknown)
- schoolDependent: boolean (true if a school, students, pupils, or education center is affected)
- healthFacilityDependent: boolean (true if a clinic, hospital, dispensary, or health center is affected)
- description: original or cleaned concise description of the water problem`;

    const geminiCall = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            waterPointName: { type: Type.STRING },
            district: { type: Type.STRING },
            problemCategory: {
              type: Type.STRING,
              enum: ['broken_pump', 'no_water_supply', 'suspected_contamination', 'pipe_leakage', 'other'],
            },
            reportedDurationDays: { type: Type.INTEGER },
            estimatedPeopleAffected: { type: Type.INTEGER },
            schoolDependent: { type: Type.BOOLEAN },
            healthFacilityDependent: { type: Type.BOOLEAN },
            description: { type: Type.STRING },
          },
          required: [
            'waterPointName',
            'district',
            'problemCategory',
            'reportedDurationDays',
            'estimatedPeopleAffected',
            'schoolDependent',
            'healthFacilityDependent',
            'description',
          ],
        },
      },
    });

    const response = await withTimeout(geminiCall, 4000, 'Gemini SMS parsing timed out');
    const parsedJson = JSON.parse(response.text || '{}');

    const validCategories = ['broken_pump', 'no_water_supply', 'suspected_contamination', 'pipe_leakage', 'other'];

    return {
      parsed: {
        waterPointName: parsedJson.waterPointName || 'Community Water Point',
        district: parsedJson.district || 'Mukono',
        problemCategory: validCategories.includes(parsedJson.problemCategory)
          ? parsedJson.problemCategory
          : 'other',
        reportedDurationDays: typeof parsedJson.reportedDurationDays === 'number' ? Math.max(0, parsedJson.reportedDurationDays) : 0,
        estimatedPeopleAffected: typeof parsedJson.estimatedPeopleAffected === 'number' ? Math.max(0, parsedJson.estimatedPeopleAffected) : 0,
        schoolDependent: Boolean(parsedJson.schoolDependent),
        healthFacilityDependent: Boolean(parsedJson.healthFacilityDependent),
        description: parsedJson.description || smsText,
      },
      source: 'gemini_3.8_flash',
    };
  } catch (err: any) {
    console.warn('[Gemini AI] SMS parsing failed or timed out, using rule-based fallback:', err?.message || err);
    return {
      parsed: parseSmsRuleBased(smsText),
      source: 'rule_based_fallback',
    };
  }
}

// ==========================================
// 7. Africa's Talking Inbound SMS Webhook
// ==========================================
/**
 * Africa's Talking SMS Inbound Webhook
 * POST /api/sms/incoming
 *
 * Payload format sent by Africa's Talking:
 * {
 *   from: "+256771234567",
 *   to: "20880",
 *   text: "Borehole broken Mukono near St Kizito School 5 days 300 people",
 *   date: "2026-10-27 15:30:00",
 *   id: "ATXid_123456789",
 *   linkId: "sample-link-id"
 * }
 */
app.post('/api/sms/incoming', async (req: Request, res: Response) => {
  const payload = req.body || {};
  console.log('[SMS Webhook] Received inbound payload:', JSON.stringify(payload, null, 2));

  // Extract fields from Africa's Talking standard payload
  const from = (payload.from || payload.phoneNumber || req.query.from || '').toString().trim();
  const rawText = (payload.text || payload.message || req.query.text || '').toString().trim();
  const linkId = payload.linkId || req.query.linkId || null;
  const atMessageId = payload.id || null;

  if (!rawText) {
    console.warn('[SMS Webhook] Missing SMS text in request payload.');
    // Note: Africa's Talking requires a 200 OK HTTP response
    return res.status(200).json({
      status: 'ignored',
      message: 'Empty or missing "text" parameter in SMS payload.',
    });
  }

  try {
    // 1. Parse unstructured text using Gemini 3.8 Flash (or fallback)
    const { parsed, source } = await parseSmsWithGemini(rawText);

    // 2. Pass parsed data through deterministic scoring algorithm
    const priorityBreakdown = calculatePriorityScore({
      reportedDurationDays: parsed.reportedDurationDays,
      estimatedPeopleAffected: parsed.estimatedPeopleAffected,
      schoolDependent: parsed.schoolDependent,
      healthFacilityDependent: parsed.healthFacilityDependent,
    });

    // 3. Mask phone number for citizen privacy
    const maskedPhone = maskPhoneNumber(from);

    // 4. Generate short readable ticket ID
    const shortId = `WP-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Construct required outbound response SMS
    // "WaterPulse UG: Report logged for [Water Point Name]! Priority: [Band] ([Score] pts). Ticket ID: #[Generated Short ID]. We have alerted the District Water Office."
    const outboundMessage = `WaterPulse UG: Report logged for ${parsed.waterPointName}! Priority: ${priorityBreakdown.band} (${priorityBreakdown.score} pts). Ticket ID: #${shortId}. We have alerted the District Water Office.`;

    // 6. Send live automated confirmation via Africa's Talking SMS SDK
    let outboundDeliveryStatus: 'sent' | 'simulated' | 'failed' = 'simulated';
    let atSmsResponse: any = null;

    if (atSms && from) {
      try {
        const sendOptions: any = {
          to: [from],
          message: outboundMessage,
        };

        // If a registered shortcode or alphanumeric Sender ID is configured
        if (process.env.AT_SENDER_ID && process.env.AT_SENDER_ID.trim() !== '') {
          sendOptions.from = process.env.AT_SENDER_ID.trim();
        }

        atSmsResponse = await atSms.send(sendOptions);
        outboundDeliveryStatus = 'sent';
        console.log(`[Africa's Talking] Outbound SMS dispatched to ${from}:`, atSmsResponse);
      } catch (smsErr: any) {
        outboundDeliveryStatus = 'failed';
        console.error(`[Africa's Talking] Failed to dispatch outbound SMS to ${from}:`, smsErr?.message || smsErr);
      }
    } else {
      console.log(`[Africa's Talking Sandbox / Simulation] Outbound SMS queued for ${from}: "${outboundMessage}"`);
    }

    // 7. Store incoming record in memory for reviewer inspection
    const record: InboundSmsRecord = {
      ticketId: shortId,
      rawFrom: from,
      maskedFrom: maskedPhone,
      rawText,
      linkId,
      parsed,
      priorityScore: priorityBreakdown.score,
      priorityBand: priorityBreakdown.band,
      priorityBreakdown,
      outboundSmsMessage: outboundMessage,
      outboundDeliveryStatus,
      receivedAt: new Date().toISOString(),
      source,
    };
    incomingSmsReports.unshift(record);
    if (incomingSmsReports.length > 100) incomingSmsReports.pop();

    console.log(`[SMS Webhook] Successfully processed report #${shortId} (${priorityBreakdown.band} - ${priorityBreakdown.score} pts) from ${maskedPhone}`);

    // Africa's Talking strictly expects a 200 OK status
    return res.status(200).json({
      status: 'success',
      ticketId: shortId,
      parsedReport: parsed,
      priorityScore: priorityBreakdown.score,
      priorityBand: priorityBreakdown.band,
      isProvisional: priorityBreakdown.isProvisional,
      reporterContactMasked: maskedPhone,
      outboundSms: {
        to: from,
        message: outboundMessage,
        status: outboundDeliveryStatus,
        atResponse: atSmsResponse,
      },
      source,
    });
  } catch (err: any) {
    console.error('[SMS Webhook] Internal processing error:', err);
    // Return HTTP 200 with error body so Africa's Talking webhook won't loop infinitely
    return res.status(200).json({
      status: 'error',
      message: 'Failed to process SMS payload.',
      error: err?.message || String(err),
    });
  }
});

// ==========================================
// 8. SMS Inspection & Local Testing Endpoints
// ==========================================
// Retrieve recent SMS reports processed via webhook
app.get('/api/sms/incoming', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: incomingSmsReports.length,
    reports: incomingSmsReports,
  });
});

// Dedicated local test simulation endpoint (supports GET & POST for rapid testing)
app.post('/api/sms/test-simulate', async (req: Request, res: Response) => {
  const from = req.body.from || '+256772123456';
  const text = req.body.text || 'Borehole broken Mukono near St Kizito School 5 days 300 people';
  
  // Forward to incoming webhook handler
  req.body = { from, text, id: `test_${Date.now()}` };
  const incomingHandler = app._router.stack.find((layer: any) => layer.route?.path === '/api/sms/incoming')?.route?.stack[0]?.handle;
  if (incomingHandler) {
    return incomingHandler(req, res);
  }
  return res.status(500).json({ error: 'Handler not found' });
});

// ==========================================
// 9. Existing Gemini Analysis & Bulletin Routes
// ==========================================
function generateRuleBasedAnalysis(body: any) {
  const isSchool = Boolean(body.schoolDependent);
  const isHealth = Boolean(body.healthFacilityDependent);
  const days = Number(body.reportedDurationDays) || 0;
  const people = Number(body.estimatedPeopleAffected) || 0;

  const justificationFactors: string[] = [];
  if (isSchool) justificationFactors.push('Educational institution affected (SDG 4 impact; children without safe drinking water)');
  if (isHealth) justificationFactors.push('Health facility dependency; patient hygiene and medical sanitation at immediate risk');
  if (days >= 5) justificationFactors.push(`Prolonged outage reported (${days} days) exceeding acceptable community contingency period`);
  if (people >= 300) justificationFactors.push(`Significant population impact (${people} estimated individuals affected)`);
  if (justificationFactors.length === 0) justificationFactors.push('Standard water-point fault requiring routine technical triage');

  const missingInformation: string[] = [];
  if (!body.coordinates?.lat || !body.coordinates?.lng) missingInformation.push('Exact GPS coordinates not supplied; field team requires landmark guidance');
  if (!body.reportedDurationDays && body.reportedDurationDays !== 0) missingInformation.push('Reported duration out of service not stated');
  if (!body.estimatedPeopleAffected && body.estimatedPeopleAffected !== 0) missingInformation.push('Estimated user headcount missing');
  missingInformation.push('Component model or pipe diameter details not specified');

  const loc = body.locationName || 'the reported area';
  const name = body.waterPointName || 'the local water point';

  const summary = `Reported ${body.issueType ? body.issueType.replace('_', ' ') : 'issue'} at ${name} (${loc}), affecting approximately ${people || 'unspecified'} people${isSchool ? ', including students' : ''}${isHealth ? ' and clinic patients' : ''}.`;

  const englishBulletin = `WaterPulse UG Community Notice: A water access disruption has been logged for ${name} in ${loc}. Current status is Unverified. Local authorities and technical reviewers have been notified. Water users are advised to use alternative verified sources and practice boiling where necessary.`;

  const lugandaBulletin = `Okumanyisa eri abatuuze b'e ${loc}: Okusannyalala kw'amazzi ku ${name} kutegeezeddwa. Ensonga eno eri mu kwekenneenyezebwa abakulu. Abatuuze basabibwa okukozesa ensulo endala ez'ekakiddwa n'okufumba amazzi aganywebwa.`;

  return {
    summary,
    suggestedCategory: body.issueType || 'broken_pump',
    extractedFacts: {
      location: body.locationName,
      reportedDurationDays: body.reportedDurationDays,
      estimatedPeopleAffected: body.estimatedPeopleAffected,
      schoolDependent: isSchool,
      healthFacilityDependent: isHealth,
      infrastructureType: body.waterPointName?.toLowerCase().includes('tap') ? 'Piped Tap Stand' : 'Borehole / Handpump',
    },
    missingInformation,
    justificationFactors,
    possibleDuplicateIds: [],
    englishBulletinDraft: englishBulletin,
    lugandaTranslationDraft: lugandaBulletin,
    analyzedAt: new Date().toISOString(),
    isFallback: true,
  };
}

// Health and Config status endpoint
app.get('/api/system-status', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    geminiConnected: Boolean(aiClient),
    africasTalking: {
      configured: Boolean(atClient),
      username: atUsername,
      hasApiKey: Boolean(atApiKey && atApiKey !== 'MY_AT_API_KEY'),
    },
    smsReceivedCount: incomingSmsReports.length,
    storageMode: 'demo_local_storage',
    time: new Date().toISOString(),
  });
});

// Gemini Report Analysis Route
app.post('/api/gemini/analyze-report', async (req: Request, res: Response) => {
  const reportData = req.body;

  if (!aiClient) {
    const fallback = generateRuleBasedAnalysis(reportData);
    return res.json({
      success: true,
      analysis: fallback,
      source: 'rule_based_fallback',
      notice: 'Gemini API key not configured on server; using deterministic rule-based triage fallback.',
    });
  }

  try {
    const prompt = `You are the WaterPulse UG Technical Triage AI for civic water point reporting in Uganda (supporting UN SDG 6 and SDG 4).
Analyze the following citizen water-point report objectively.

Input Report Data:
- Water-point Name: ${reportData.waterPointName || 'Unknown'}
- Location: ${reportData.locationName || 'Unknown'} (District: ${reportData.district || 'Unknown'})
- Issue Type: ${reportData.issueType || 'Unknown'}
- Problem Description: "${reportData.description || ''}"
- Reported Duration: ${reportData.reportedDurationDays ?? 'Not stated'} days
- Estimated People Affected: ${reportData.estimatedPeopleAffected ?? 'Not stated'}
- School Dependent: ${reportData.schoolDependent ? 'YES (' + (reportData.schoolName || 'School') + ')' : 'NO'}
- Health Facility Dependent: ${reportData.healthFacilityDependent ? 'YES (' + (reportData.healthFacilityName || 'Health Center') + ')' : 'NO'}

Strict Guidelines:
1. Distinguish between reporter-provided info, AI inferences, and unknown facts.
2. DO NOT mark report as verified, do not declare water safe, and do not promise repair completion dates.
3. Highlight missing technical details (e.g., GPS, pipe depth, valve type).
4. Provide a clear, dignified English community notice and an accurate Luganda translation.`;

    const geminiCall = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Concise 1-2 sentence factual summary of the reported water fault.',
            },
            suggestedCategory: {
              type: Type.STRING,
              description: 'One of: broken_pump, no_water_supply, damaged_infrastructure, suspected_contamination, other_water_access',
            },
            extractedFacts: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING },
                infrastructureType: { type: Type.STRING },
                schoolDependent: { type: Type.BOOLEAN },
                healthFacilityDependent: { type: Type.BOOLEAN },
              },
            },
            missingInformation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of crucial engineering or verification details not present in description.',
            },
            justificationFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key vulnerability factors reported justifying priority attention (e.g. school affected, long duration).',
            },
            englishBulletinDraft: {
              type: Type.STRING,
              description: 'Clear, polite 2-sentence public community bulletin in English.',
            },
            lugandaTranslationDraft: {
              type: Type.STRING,
              description: 'Idiomatic community bulletin translation in Luganda.',
            },
          },
          required: [
            'summary',
            'suggestedCategory',
            'missingInformation',
            'justificationFactors',
            'englishBulletinDraft',
            'lugandaTranslationDraft',
          ],
        },
      },
    });

    const response = await withTimeout(geminiCall, 3500, 'Gemini request timed out');

    const parsed = JSON.parse(response.text || '{}');
    const analysis = {
      summary: parsed.summary,
      suggestedCategory: parsed.suggestedCategory || reportData.issueType,
      extractedFacts: {
        location: parsed.extractedFacts?.location || reportData.locationName,
        reportedDurationDays: reportData.reportedDurationDays,
        estimatedPeopleAffected: reportData.estimatedPeopleAffected,
        schoolDependent: reportData.schoolDependent,
        healthFacilityDependent: reportData.healthFacilityDependent,
        infrastructureType: parsed.extractedFacts?.infrastructureType || 'Water point infrastructure',
      },
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      justificationFactors: Array.isArray(parsed.justificationFactors) ? parsed.justificationFactors : [],
      possibleDuplicateIds: [],
      englishBulletinDraft: parsed.englishBulletinDraft || '',
      lugandaTranslationDraft: parsed.lugandaTranslationDraft || '',
      analyzedAt: new Date().toISOString(),
      isFallback: false,
    };

    res.json({
      success: true,
      analysis,
      source: 'gemini_3.8_flash',
    });
  } catch (err: any) {
    console.error('Gemini API call failed, falling back:', err?.message || err);
    const fallback = generateRuleBasedAnalysis(reportData);
    res.json({
      success: true,
      analysis: fallback,
      source: 'rule_based_fallback',
      notice: 'Gemini request encountered an error or timeout; deterministic fallback supplied.',
    });
  }
});

// Gemini Community Bulletin Generator Route
app.post('/api/gemini/generate-bulletin', async (req: Request, res: Response) => {
  const { report, actionSummary, nextSteps, targetAudience } = req.body;

  if (!aiClient) {
    const loc = report?.locationName || 'the community';
    const name = report?.waterPointName || 'the water point';
    const status = report?.status || 'In Review';

    return res.json({
      success: true,
      source: 'rule_based_template',
      bulletin: {
        english: `Community Water Update (${loc}): The water point at ${name} is currently ${status}. ${actionSummary || 'Technical assessment is underway.'} Next step: ${nextSteps || 'Review team verification.'} Please coordinate with local water committee reps.`,
        luganda: `Amawulire ku mazzi (${loc}): Ensulo y'amazzi ku ${name} mu kiseera kino eri ku ${status}. ${actionSummary ? 'Emirimu egikoleddwa: ' + actionSummary : 'Okwekenneenya kuli mu maaso.'} Ekiddako: ${nextSteps || 'Okukakasa okuva mu bakugu.'} Mugume nga mukolagana n'akakiiko k'amazzi ak'ekitundu.`,
      },
    });
  }

  try {
    const prompt = `You are drafting a community update bulletin for WaterPulse UG.
Report details:
- Water point: ${report?.waterPointName} in ${report?.locationName}
- Current Status: ${report?.status}
- Prior Action / Verified Notes: ${actionSummary || report?.reviewerNotes || 'Initial assessment in progress'}
- Confirmed Next Step: ${nextSteps || 'Technical verification'}
- Target Audience: ${targetAudience || 'Local community water users'}

Generate:
1. An honest, clear English bulletin (3-4 sentences max). Must not make unconfirmed promises or invent repair deadlines.
2. A natural Luganda translation for community radio/board posting.`;

    const bulletinCall = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING },
            luganda: { type: Type.STRING },
          },
          required: ['english', 'luganda'],
        },
      },
    });

    const response = await withTimeout(bulletinCall, 3500, 'Gemini request timed out');
    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      source: 'gemini_3.8_flash',
      bulletin: {
        english: parsed.english,
        luganda: parsed.luganda,
      },
    });
  } catch (err: any) {
    console.error('Gemini bulletin generation error:', err);
    res.json({
      success: true,
      source: 'rule_based_template',
      bulletin: {
        english: `Water Update for ${report?.locationName || 'community'}: Water point ${report?.waterPointName || ''} status is now ${report?.status || 'Updated'}. ${actionSummary || 'Assessment proceeding.'}`,
        luganda: `Amawulire g'amazzi e ${report?.locationName || 'kitundu'}: Ensulo ${report?.waterPointName || ''} eri mu mbeera ya ${report?.status || 'Kwekenneenya'}.`,
      },
    });
  }
});

// Setup Vite middlewares in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WaterPulse UG server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
