# WaterPulse UG 🇺🇬
### Community Water Point Triage & Repair Platform

> **Civic water-point fault reporting, transparent deterministic priority triage, geospatial duplicate detection, and bilingual community bulletin broadcasting supporting UN Sustainable Development Goals: SDG 6 (Clean Water & Sanitation) and SDG 4 (Quality Education).**

---

## 📌 Executive Summary

Across sub-Saharan Africa, an estimated 20–30% of rural and peri-urban water points fall out of service within just a few years of commissioning. When a borehole pump breaks or a public tap stand dries up, schools lose drinking water, children miss class, clinics face acute sanitation crises, and communities wait weeks or months for response.

**WaterPulse UG** bridges the critical gap between community fault reporting and municipal/NGO repair dispatch. By combining **accessible civic reporting** (web, SMS/USSD simulation), **transparent deterministic priority scoring**, **geospatial duplicate detection**, and **Google Gemini 3.8 Flash AI** for bilingual technical triage and local Luganda community bulletins, WaterPulse UG turns fragmented fault reports into rapid, accountable public action.

---

## 🎯 UN Sustainable Development Goals (SDGs)

| Goal | Target Alignment | Platform Feature |
| :--- | :--- | :--- |
| **SDG 6: Clean Water and Sanitation** | **Target 6.1:** Universal & equitable access to safe drinking water | Real-time water-point uptime tracking, fault logging, prompt technician dispatch, and resolution audits. |
| **SDG 4: Quality Education** | **Target 4.a:** Safe, inclusive learning environments with safe drinking water | +15 priority point weighting when schools depend on broken water points to prevent student absenteeism and waterborne illness. |

---

## ✨ Key Features

### 1. 📝 Civic Fault Reporting & Multichannel Intake
- **Community-Friendly Web Form**: Streamlined 4-step intake (Location & Water Point, Problem Classification, Severity & Vulnerability, Review & Submit).
- **Critical Facility Tagging**: One-click indicators for school or health center dependencies, directly impacting triage priority.
- **Privacy & Safety First**: Automatic reporter contact masking (`+256 77 •••• 123`) to safeguard community members.
- **Multichannel Simulation**: Ready for SMS and USSD (`*284*40#`) submission patterns common across Ugandan telecom networks (MTN, Airtel).

### 2. ⚖️ Transparent Deterministic Priority Scoring (0–100 pts)
Unlike opaque "black-box" ranking algorithms, WaterPulse UG uses an open, predictable, rule-based formula designed with local water authorities:

$$\text{Priority Score} = \text{Duration Points} + \text{Population Points} + \text{Facility Points}$$

```
+--------------------------------------------------------------------------+
|                        PRIORITY SCORING BREAKDOWN                        |
+----------------------------------+---------------------------------------+
| Category                         | Scoring Rules                         |
+----------------------------------+---------------------------------------+
| 1. Duration Out of Service       | • 0 days: 0 pts                       |
|    (Max 30 points)               | • 1 day: 8 pts                        |
|                                  | • 2 days: 13 pts                      |
|                                  | • 3–4 days: 20 pts                    |
|                                  | • 5–6 days: 25 pts                    |
|                                  | • 7+ days: 30 pts                     |
+----------------------------------+---------------------------------------+
| 2. Estimated Population Impact   | • < 50 people: 5 pts                  |
|    (Max 40 points)               | • 50–199 people: 15 pts               |
|                                  | • 200–499 people: 25 pts              |
|                                  | • 500+ people: 40 pts                 |
+----------------------------------+---------------------------------------+
| 3. Critical Facilities           | • School Dependent: +15 pts (SDG 4)   |
|    (Max 30 points combined)      | • Health Center: +15 pts              |
|                                  | • Both Present: 30 pts max            |
+----------------------------------+---------------------------------------+
```

#### Priority Bands
- 🔴 **High Priority (70–100 pts)**: Immediate field triage required (< 24–48 hours).
- 🟡 **Medium Priority (40–69 pts)**: Scheduled dispatch within 3–5 working days.
- 🔵 **Low Priority (0–39 pts)**: Routine maintenance cycle.

#### Provisional Score Guardrails
If critical fields (reported duration or user headcount) are omitted, the system marks the rating as **Provisional**, clearly listing missing evidence until verified by the District Water Reviewer.

---

### 3. 🔍 Geospatial & Lexical Duplicate Report Detection
When a major borehole breaks down, dozens of community members often file independent reports. WaterPulse UG prevents technician fatigue and duplicate dispatch using a hybrid matching algorithm:
- **Haversine Distance**: Calculates exact distance between GPS coordinates (< 500m = +35 confidence; < 2km = +20 confidence).
- **Water-Point Name & Community Match**: Tokenized string comparison for identical or substring matches (+40 name match; +25 community match).
- **Category Alignment**: Matches issue types (`broken_pump`, `no_water_supply`, `suspected_contamination`, etc.).
- **Jaccard Lexical Similarity**: Text token overlap on descriptions (> 35% token overlap).
- **Temporal Proximity**: Detects co-occurring submissions within 7–14 days.
- **Reviewer Merge Action**: District reviewers can link duplicate reports to the primary ticket with a single click.

---

### 4. 🤖 AI-Powered Technical Triage & Luganda Community Bulletins
Powered by **Google Gemini 3.8 Flash** via `@google/genai` (with zero-failure rule-based offline fallbacks):
- **Technical Summary Extraction**: Factual breakdown isolating reported facts vs. unknown engineering factors (e.g., missing pipe dimensions, water table changes).
- **Public Trust Guardrail**: Prompts enforce that AI never invents promises, never declares water safe without laboratory testing, and never fabricates repair dates.
- **Bilingual Community Bulletins**: Generates clear, polite public notices in **English** and natural **Luganda** (*"Okumanyisa eri abatuuze b'e..."*), ready for local community radios, megaphones, or church/mosque noticeboards.

---

### 5. 🛠️ District Water Reviewer Workflow
- **Reviewer Queue**: Filterable by Status (`Unverified`, `Verified`, `Assigned`, `Resolved`), Priority Band, District, and Fault Type.
- **Verification Checklist**: Reviewer can confirm on-the-ground facts, upgrade provisional scores, and link duplicate tickets.
- **Technician Assignment**: Dispatch to local entities (e.g., *District Water Engineering Team*, *Uganda Handpump Mechanics Association - Mukono Branch*, *Community Water User Committee*).
- **Resolution Logging**: Records repair outcome, replaced spare parts (e.g., U-seal, riser pipes, cylinders), date resolved, and audit log.
- **Audit Trail**: Immutable timeline tracking every action, timestamp, and reviewer.

---

### 6. 🗺️ Interactive GIS Map & Directory
- **Leaflet Interactive Map**: Uganda-centered viewport focusing on districts such as Mukono, Wakiso, Kampala, Jinja, Luweero, Mpigi, and Kayunga.
- **Color-Coded Status Markers**: Visual indicators for priority band and operational status.
- **Water Points Directory**: Central registry of boreholes, protected springs, and piped tap stands with uptime histories.

---

### 7. 📊 Analytics & Reporting
- Real-time calculation of:
  - Total active water-point outages
  - Vulnerable population currently without safe water
  - Educational institutions affected (SDG 4)
  - Average resolution turnaround time (days)
  - Fault category distribution charts and priority band ratios

---

## 🏗️ Architecture & Technology Stack

```
                     ┌──────────────────────────────────────────┐
                     │            User Interface (UI)           │
                     │  React 19 + Tailwind CSS v4 + Motion     │
                     │  Lucide Icons + Leaflet (OpenStreetMap)  │
                     └─────────────────────┬────────────────────┘
                                           │
                                           ▼
                     ┌──────────────────────────────────────────┐
                     │          Reports State Context           │
                     │  Local Persistence (Offline Resilient)   │
                     │  Deterministic Scoring & Deduplication   │
                     └─────────────────────┬────────────────────┘
                                           │
                                           ▼
                     ┌──────────────────────────────────────────┐
                     │             Backend (Node.js)            │
                     │  Express 4 + TypeScript (tsx / esbuild)  │
                     │  API Proxy: /api/gemini/*                │
                     │  System Health: /api/system-status       │
                     └─────────────────────┬────────────────────┘
                                           │
                                           ▼
                     ┌──────────────────────────────────────────┐
                     │        Google Gemini 3.8 Flash SDK       │
                     │  @google/genai Client                    │
                     │  Structured JSON Schemas & Fallbacks     │
                     └──────────────────────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion, Leaflet.
- **Backend**: Node.js, Express, `dotenv`, `@google/genai` TypeScript SDK.
- **Dev & Build Tools**: Vite 8, `tsx`, `esbuild`.
- **Test Runner**: Node.js built-in test runner (`node:test`, `node:assert/strict`).

---

## 📂 Project Structure

```
├── .env.example                  # Environment variable template (GEMINI_API_KEY, APP_URL)
├── index.html                    # HTML entry point with Plus Jakarta Sans & JetBrains Mono
├── metadata.json                 # AI Studio applet metadata & permissions
├── package.json                  # Scripts and dependencies
├── server.ts                     # Express server & Gemini API proxy with fallbacks
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite configuration with Tailwind CSS v4 plugin
└── src/
    ├── App.tsx                   # Main layout container with sidebar navigation
    ├── main.tsx                  # React DOM mount entry
    ├── index.css                 # Tailwind CSS v4 root stylesheet
    ├── types.ts                  # Comprehensive TypeScript interfaces & types
    ├── components/
    │   ├── AnalyticsView.tsx           # Operational KPIs, charts, and SDG metrics
    │   ├── CommunityBulletinsView.tsx  # Bilingual broadcast and bulletin generator
    │   ├── InteractiveMapView.tsx      # Leaflet map with geo-located faults
    │   ├── OverviewView.tsx            # Executive triage dashboard and quick actions
    │   ├── ReportFormView.tsx          # 4-step community fault reporting form
    │   ├── ReviewerQueueView.tsx       # District water officer queue, review & dispatch
    │   ├── SettingsView.tsx            # System diagnostic, roles, and demo controls
    │   ├── Sidebar.tsx                 # Navigation drawer with badge counters
    │   ├── TopBar.tsx                  # Header with role toggle and search
    │   └── WaterPointsDirectoryView.tsx # Central registry of water point assets
    ├── context/
    │   └── ReportsContext.tsx    # State management, local storage sync, and APIs
    ├── data/
    │   └── seedData.ts           # Realistic seed reports from Mukono, Wakiso, Jinja, etc.
    └── utils/
        ├── duplicates.ts         # Haversine distance, tokenization & Jaccard matching
        ├── scoring.ts            # Deterministic priority scoring algorithm
        └── scoring.test.ts       # Automated unit tests for scoring thresholds
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- (Optional) **Gemini API Key**: For AI technical summaries and Luganda bulletin generation (a built-in deterministic rule-based fallback automatically activates if no key is supplied).

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Configure your environment keys in `.env`:
```env
# Google Gemini API Key (optional, defaults to deterministic fallback if not set)
GEMINI_API_KEY="your-gemini-api-key-here"

# Africa's Talking Live / Sandbox Credentials
AT_API_KEY="your-africas-talking-api-key"
AT_USERNAME="sandbox" # or your live username
AT_SENDER_ID=""       # optional registered shortcode or alphanumeric ID

PORT=3000
```

### 3. Development Server
Start the development server (runs Express with Vite middleware on port 3000):
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Running Automated Tests
Run the deterministic scoring, boundary verification, and SMS parsing unit tests:
```bash
npm test
```
All test suites verify:
- Outage duration threshold boundaries (0, 1, 2, 3–4, 5–6, 7+ days)
- Population impact boundaries (<50, 50–199, 200–499, 500+)
- School and health center point additions (SDG 4 verification)
- Priority band classifications (`Low`, `Medium`, `High`)
- Phone number privacy masking (`+256 77 •••• 123`)
- Unstructured SMS parsing (duration, population, category, school, health center)

---

## 📱 Africa's Talking Live SMS Webhook Pipeline

WaterPulse UG supports real-time inbound SMS reporting via the **Africa's Talking SMS API**.

```
Citizen Phone (+256...)
       │ (SMS: "Borehole broken Mukono near St Kizito School 5 days 300 people")
       ▼
Africa's Talking SMS Gateway
       │ POST /api/sms/incoming (via Ngrok tunnel in local dev)
       ▼
WaterPulse UG Express Backend
       ├── 1. Google Gemini 3.8 Flash NLP parser (unstructured text -> JSON)
       ├── 2. Deterministic priority scoring engine (0-100 pts & Priority Band)
       ├── 3. Reporter phone privacy masking (+256 77 •••• 567)
       ├── 4. Ticket generation (#WP-4821)
       └── 5. Immediate automated outbound SMS confirmation to citizen:
              "WaterPulse UG: Report logged for St Kizito School Borehole!
               Priority: Medium (65 pts). Ticket ID: #WP-4821.
               We have alerted the District Water Office."
```

### Local Testing with Ngrok & Africa's Talking Sandbox

1. **Start the local dev server**:
   ```bash
   npm run dev
   ```

2. **Expose port 3000 using Ngrok**:
   ```bash
   ngrok http 3000
   ```
   Copy the generated HTTPS URL, e.g. `https://xxxx-xx-xx.ngrok-free.app`.

3. **Configure Africa's Talking Sandbox SMS Callback URL**:
   - Go to [Africa's Talking Sandbox Dashboard](https://account.africastalking.com/).
   - Navigate to **SMS** > **SMS Callback URLs** > **Incoming Messages**.
   - Set the callback URL to:
     ```
     https://xxxx-xx-xx.ngrok-free.app/api/sms/incoming
     ```
   - Click **Submit**.

4. **Simulate Inbound SMS from the Sandbox Simulator**:
   - Launch the Africa's Talking Simulator: [https://simulator.africastalking.com:1517/](https://simulator.africastalking.com:1517/)
   - Enter your sandbox phone number (e.g., `+256771234567`).
   - Send an SMS to the sandbox shortcode (e.g., `20880`):
     ```
     Borehole broken Mukono near St Kizito School 5 days 300 people
     ```
   - Check the console logs in your terminal:
     You will observe the unstructured SMS parsed, scored at 65 pts (Medium), reporter number masked, and an automated SMS response dispatched to the simulator.

5. **Instant CLI Test via cURL**:
   You can also test the webhook directly without Ngrok:
   ```bash
   curl -X POST http://localhost:3000/api/sms/incoming \
     -H "Content-Type: application/json" \
     -d '{
       "from": "+256771234567",
       "to": "20880",
       "text": "Borehole broken Mukono near St Kizito School 5 days 300 people",
       "id": "ATXid_1234567"
     }'
   ```

6. **View Inbound SMS Log**:
   Inspect processed SMS tickets anytime at:
   ```bash
   curl http://localhost:3000/api/sms/incoming
   ```

### 5. Production Build
Compile both the frontend assets and server bundle:
```bash
npm run build
npm start
```

---

## 🧪 Deterministic Scoring Test Cases

To verify algorithmic integrity, run `npm test`. Below is an example test scenario:

```typescript
// Example: St. Kizito Primary School Borehole Fault
// 5 days out of service (25 pts) + 300 people (25 pts) + School dependent (15 pts) = 65 pts -> Medium Priority
const result = calculatePriorityScore({
  reportedDurationDays: 5,
  estimatedPeopleAffected: 300,
  schoolDependent: true,
  healthFacilityDependent: false,
});

console.log(result.score); // 65
console.log(result.band);  // "Medium"
console.log(result.isProvisional); // false
```

---

## 🔒 Data Privacy & Integrity

1. **No Unsolicited PII**: Reporter phone numbers are automatically masked in the user interface.
2. **Deterministic Triage**: All prioritization is verifiable by field engineers and water committee members without hidden biases.
3. **Safe AI Generation**: Strict JSON schemas with timeout guards (3.5s) ensure predictable, tamper-proof outputs.
4. **Local Data Persistence**: Changes persist in `localStorage` across page reloads, with a one-click **"Reset Demo Data"** button in Settings.

---

## 🤝 Community & Contribution

WaterPulse UG is built to support community water management committees (*LC1 chairpersons*, *Water User Committees*), District Water Offices (DWOs), and technical partner organizations like the Uganda Handpump Mechanics Association.

Contributions, bug reports, and suggestions are welcome. Please ensure all modifications pass `npm run lint` and `npm test`.

---

## 📄 License

This project is open-source and distributed under the **MIT License**.
