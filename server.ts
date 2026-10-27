import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize GoogleGenAI SDK on server-side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Fallback rule-based analysis generator (clearly flagged as fallback)
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

  const lugandaBulletin = `Okumanyisa eri abatuuze b'e ${loc}: Okusannyalala kw'amazzi ku ${name} kutegeezeddwa. Ensonga eno eri mu kwekenneenyezebwa abakulu. Abatuuze basabibwa okukozesa ensulo endala ez\'ekakiddwa n'okufumba amazzi aganywebwa.`;

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
    storageMode: 'demo_local_storage',
    time: new Date().toISOString(),
  });
});

// Helper to race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMsg)), ms)
    ),
  ]);
}

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
