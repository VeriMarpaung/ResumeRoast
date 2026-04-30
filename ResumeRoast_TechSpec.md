# ResumeRoast — Complete Technical Specification
> Implementation-ready spec for GitHub Copilot | Next.js + Tailwind + OpenRouter

---

## 1. Product Definition

### Problem Statement

Most resume feedback tools are either too expensive (Topresume, $150+), too generic ("add more action verbs"), or too slow (wait 48h for a human reviewer). Job seekers — especially fresh graduates in Southeast Asia — submit dozens of applications without ever knowing *why* they're getting rejected. The core problems:

- **ATS black holes**: Resumes get filtered before a human ever reads them
- **Generic bullet points**: "Responsible for managing..." phrases that say nothing
- **No measurable impact**: Missing numbers, results, outcomes
- **Weak summaries**: Either empty or a copy-paste of the job description
- **No honest feedback**: Tools give "encouragement" instead of truth

### Target Users

| Segment | Pain Point | What They Want |
|---|---|---|
| Fresh Graduates (21–25) | No work experience, don't know what to write | Honest gap analysis + rewrite help |
| Mid-level Professionals (25–35) | Stale resume, haven't updated in 3 years | Section-by-section critique |
| Career Switchers | Wrong framing for new industry | Tone + positioning feedback |
| Non-native English speakers | Grammar OK but impact is weak | Sentence-level rewrites |

### Unique Value Proposition

Unlike LinkedIn Resume Builder or Resume.io, ResumeRoast:
1. **Gives a score per section** — not just "overall 7/10"
2. **Is brutally honest** — calls out clichés by name
3. **Rewrites inline** — not a suggestion, an actual replacement you can use
4. **Explains WHY** — every critique has a reason, every rewrite has a rationale
5. **Targets ATS specifically** — not just human readability

---

## 2. Feature Breakdown

### Feature 1: Resume Upload

**Behavior:**
- User lands on homepage, sees a drag-and-drop upload zone
- Accepts only `.pdf` files, max 5MB
- Shows file name + size preview after selection
- "Analyze My Resume" CTA button activates after valid file selected
- Client-side validation before sending to server

**Input:** PDF file (binary)
**Output:** Confirmation that file is received, transitions to processing state

**Example Scenario:**
> User drags `john_doe_cv.pdf` onto the dropzone. File preview shows "john_doe_cv.pdf — 234KB". Button becomes active. User clicks "Roast My Resume 🔥".

**Edge Cases:**
- File > 5MB → show error: "File too large. Keep it under 5MB."
- Non-PDF → show error: "Only PDF files supported."
- Password-protected PDF → parsing will fail, caught at API level

---

### Feature 2: Resume Parsing

**Behavior:**
- Server receives PDF binary via FormData
- Uses `pdf-parse` to extract raw text
- Runs a pre-processing step to detect sections (Experience, Education, Skills, Summary)
- Sends structured text to AI for analysis
- Handles malformed PDFs gracefully

**Input:** PDF buffer (from FormData)
**Output:** Structured plain text with section labels detected

**Example Output (internal, not shown to user):**
```
[CONTACT]
John Doe | john@email.com | +62 812 xxx

[SUMMARY]
Motivated fresh graduate looking for opportunities in software development.

[EXPERIENCE]
PT. XYZ — Junior Developer (Jan 2023 – Dec 2023)
- Responsible for maintaining the company website
- Helped with backend tasks

[EDUCATION]
Universitas Indonesia — S1 Computer Science (2019–2023) GPA: 3.4

[SKILLS]
JavaScript, React, Node.js, MySQL
```

**Edge Cases:**
- Image-based PDF (scanned) → text extraction returns empty → return error: "Your PDF appears to be scanned. Please use a text-based PDF."
- Very long resume (>4000 tokens) → chunk and summarize before sending

---

### Feature 3: AI Resume Roast (Scored Feedback)

**Behavior:**
- After parsing, full resume text is sent to LLM
- AI returns a structured JSON with scores and feedback per section
- Frontend renders scores as animated progress bars / score cards
- Each section has: score (0–100), a 1-sentence "roast" headline, and 2–4 specific bullet feedback points
- Overall grade (A–F) shown prominently
- Streaming is used so feedback appears progressively

**Input:** Parsed resume text (string)
**Output:** Structured JSON with scores + feedback

**Example Output:**
```json
{
  "overall_score": 42,
  "overall_grade": "D",
  "headline_roast": "This resume reads like it was written by someone who really, really likes the word 'responsible'.",
  "sections": {
    "summary": {
      "score": 30,
      "label": "Summary",
      "roast": "Vague, generic, and adds zero value. Every fresh grad writes this.",
      "feedback": [
        "Remove 'motivated' and 'looking for opportunities' — they are noise",
        "You have no positioning statement — what makes you different?",
        "Add a specific skill or achievement here, not a personality description"
      ]
    },
    "experience": {
      "score": 35,
      "label": "Experience",
      "roast": "You described your job duties, not your impact. Recruiters don't care what you did — they care what you achieved.",
      "feedback": [
        "'Responsible for maintaining the company website' — responsible for what exactly? What did you build?",
        "Zero metrics anywhere. How many users? How much did performance improve?",
        "Passive language throughout. Change 'helped with' to specific actions with outcomes"
      ]
    },
    "skills": {
      "score": 60,
      "label": "Skills",
      "roast": "Decent stack, but listing MySQL next to React with no context is lazy.",
      "feedback": [
        "Group skills by category: Frontend / Backend / Tools",
        "Remove generic terms like 'Microsoft Office' unless the job requires it",
        "Consider adding proficiency levels or notable projects per skill"
      ]
    },
    "ats_score": {
      "score": 45,
      "label": "ATS Compatibility",
      "roast": "A typical ATS would reject this before a human sees it.",
      "feedback": [
        "No keywords matching common job descriptions for your target role",
        "Section headers may not be recognized by all ATS systems",
        "Contact info formatting may cause parsing errors"
      ]
    },
    "education": {
      "score": 75,
      "label": "Education",
      "roast": "Solid, but you're hiding your GPA in plain sight.",
      "feedback": [
        "Good: GPA is listed and respectable",
        "Add relevant coursework or thesis if experience is thin",
        "Consider adding academic achievements or competitions"
      ]
    }
  },
  "top_priorities": [
    "Rewrite all experience bullets with the CAR format (Context → Action → Result)",
    "Rewrite your summary with a positioning statement",
    "Add 5–8 industry keywords to pass ATS filters"
  ]
}
```

---

### Feature 4: Section-based Rewrite

**Behavior:**
- After roast results are shown, each section has a "Rewrite This →" button
- User clicks button → AI generates an improved version of that section
- New version streams in below the original
- User can see original vs rewritten side-by-side
- "Copy" button on rewritten version
- User can optionally provide context ("I want to target a backend role at a startup")

**Input:** Section name + original section text + optional user context
**Output:** Rewritten section text (streamed)

**Example Scenario:**
> User clicks "Rewrite Experience →" on the PT. XYZ bullet points.
> A text input appears: "Any target role or context? (optional)" — user types "backend developer at a fintech startup"
> AI streams the rewritten bullets:
```
• Built and maintained a customer-facing web portal serving 2,000+ monthly active users using React and Node.js
• Reduced page load time by 40% by implementing lazy loading and query optimization on MySQL database
• Collaborated with 3-person team to ship 2 major feature releases on schedule within 6-month contract
```

---

### Feature 5: Interactive UI (Streaming + Inline)

**Behavior:**
- All AI responses stream in real-time (not wait for full response)
- Score cards animate in one by one as JSON is parsed progressively
- "Typing" indicator during generation
- Smooth scroll to results section after upload
- Feedback cards are expandable (collapsed by default, expand on click)
- Mobile responsive

---

## 3. AI System Design

### Prompt Engineering Strategy

**Two distinct prompts are used:**
1. **Analysis Prompt** — for roasting and scoring
2. **Rewrite Prompt** — for generating improved sections

---

### Analysis Prompt (EXACT)

**System Prompt:**
```
You are ResumeRoast — an brutally honest but constructive AI career coach.
Your job is to analyze resumes and give specific, actionable, data-driven feedback.

RULES:
- NEVER give generic advice like "add more action verbs" without pointing to a specific line
- ALWAYS reference the actual text from the resume when giving feedback
- Be honest, direct, and sometimes funny — but never cruel or discouraging
- Focus on IMPACT: does this resume communicate results, or just duties?
- Focus on ATS: will this pass automated screening?
- All scores are out of 100. Be strict. A score of 70 means genuinely good.
- Output ONLY valid JSON. No markdown, no explanation outside JSON.
```

**User Prompt:**
```
Here is the resume text to analyze:

---
{RESUME_TEXT}
---

Analyze this resume and return a JSON object with this EXACT structure:
{
  "overall_score": <integer 0-100>,
  "overall_grade": <"A"|"B"|"C"|"D"|"F">,
  "headline_roast": <one sharp, specific sentence about the biggest problem>,
  "sections": {
    "summary": { "score": <int>, "label": "Summary", "roast": <1 sentence>, "feedback": [<2-4 specific strings>] },
    "experience": { "score": <int>, "label": "Experience", "roast": <1 sentence>, "feedback": [<2-4 specific strings>] },
    "skills": { "score": <int>, "label": "Skills", "roast": <1 sentence>, "feedback": [<2-4 specific strings>] },
    "education": { "score": <int>, "label": "Education", "roast": <1 sentence>, "feedback": [<2-4 specific strings>] },
    "ats_score": { "score": <int>, "label": "ATS Compatibility", "roast": <1 sentence>, "feedback": [<2-4 specific strings>] }
  },
  "top_priorities": [<3 strings: the most impactful changes to make first>]
}

Feedback must reference ACTUAL lines from the resume. Be specific. Be honest.
```

---

### Rewrite Prompt (EXACT)

**System Prompt:**
```
You are ResumeRoast's rewrite engine. Your job is to take a weak resume section
and rewrite it to be strong, specific, and impactful.

RULES:
- Use the CAR format for experience bullets: Context → Action → Result
- Include metrics/numbers where they can reasonably be inferred or added
- Match the user's target role if provided
- Do NOT invent specific company names or fake achievements
- Keep the same general facts but make them compelling
- Output ONLY the rewritten section text — no explanations, no labels
```

**User Prompt:**
```
Rewrite the following resume section: {SECTION_NAME}

Original text:
---
{SECTION_TEXT}
---

{OPTIONAL: Target role/context: {USER_CONTEXT}}

Return only the rewritten text, ready to paste into a resume.
```

---

### Output Format Strategy

- Analysis → **JSON** (parsed client-side to render score cards)
- Rewrite → **Plain text** (streamed directly into UI)
- Use `JSON.parse()` with try/catch — LLMs occasionally add extra text, strip with regex if needed: `text.match(/\{[\s\S]*\}/)?.[0]`

### Model Selection

| Mode | Recommended Model | Reason |
|---|---|---|
| Analysis (JSON) | `google/gemini-2.0-flash-exp:free` | Fast, follows JSON instructions well, free |
| Rewrite (streaming) | `meta-llama/llama-3.3-70b-instruct:free` | Better prose quality, free |
| Paid upgrade | `anthropic/claude-3.5-sonnet` | Best results if budget allows |

---

## 4. User Flow

### Step-by-Step

```
Step 1: Landing Page
├── Hero: "Get Your Resume Roasted 🔥"
├── Sub: "Brutally honest AI feedback in 30 seconds"
├── Upload zone (drag-drop or click)
└── State: IDLE

Step 2: File Selected
├── File name + size shown
├── "Roast My Resume 🔥" button activates
└── State: FILE_READY

Step 3: Upload + Processing
├── Button clicked → FormData POST to /api/upload
├── Loading animation: "Reading your resume..."
├── PDF parsed server-side
├── POST to /api/analyze
├── Loading animation: "Roasting in progress... 🔥"
└── State: LOADING

Step 4: Results Stream In
├── Overall score card animates in (large, prominent)
├── Overall grade (A–F) displayed
├── Headline roast quote shown
├── Section score cards appear one by one
│   ├── Score bar fills with animation
│   ├── Roast headline visible by default
│   └── Feedback bullets collapsed (click to expand)
├── "Top 3 Priorities" panel at bottom
└── State: RESULTS

Step 5: Rewrite Mode
├── Each section card has "Rewrite This →" button
├── Clicking shows optional context input
├── "Generate Rewrite" triggers POST to /api/rewrite
├── Rewritten text streams in below original
├── Side-by-side comparison (original left, new right)
├── "Copy to clipboard" button
└── State: REWRITING

Step 6: Final
├── User copies rewritten sections
├── "Analyze Another Resume" button
└── State: IDLE (reset)
```

### UI States Summary

| State | What User Sees |
|---|---|
| `IDLE` | Upload zone, hero copy |
| `FILE_READY` | File preview, active CTA button |
| `LOADING` | Animated spinner, loading message |
| `STREAMING` | Partial results appearing progressively |
| `RESULTS` | Full score dashboard |
| `REWRITING` | Streaming rewrite below section |
| `ERROR` | Toast/banner with specific error message |

---

## 5. System Architecture

### Data Flow Diagram

```
Browser
  │
  ├─► [1] User uploads PDF
  │         │
  │         ▼
  ├─► POST /api/upload
  │         │ (FormData with file)
  │         ▼
  │   [2] pdf-parse extracts text
  │         │ (plain text string)
  │         ▼
  ├─► POST /api/analyze (text in body)
  │         │
  │         ▼
  │   [3] Build prompt → OpenRouter API
  │         │ (streaming response)
  │         ▼
  │   [4] Stream JSON chunks back to browser
  │         │
  │         ▼
  └─► [5] Client parses streaming JSON → render UI

For Rewrite:
  ├─► POST /api/rewrite (section + text + context)
  │         │
  │         ▼
  │   OpenRouter API (streaming plain text)
  │         │
  │         ▼
  └─► Stream text into rewrite panel
```

### Frontend (Next.js App Router)

- `/app/page.tsx` — Landing + upload UI
- `/app/results/page.tsx` — (optional separate page) or single-page state machine
- `/components/` — Score cards, upload zone, rewrite panel
- Uses `fetch()` with `ReadableStream` for streaming

### Backend (Next.js API Routes)

- `/app/api/upload/route.ts` — Handles PDF → text
- `/app/api/analyze/route.ts` — Sends text to OpenRouter, streams JSON back
- `/app/api/rewrite/route.ts` — Sends section to OpenRouter, streams text back

### File Handling

- No permanent file storage (stateless)
- PDF bytes received → parsed → discarded
- Only extracted text is used downstream
- No user authentication required for MVP

---

## 6. Tech Stack Justification

| Technology | Why |
|---|---|
| **Next.js (App Router)** | API routes + frontend in one repo. Edge streaming support. Easy Vercel deploy. No separate backend needed. |
| **Tailwind CSS** | Rapid UI iteration. Utility classes prevent CSS conflicts. Works great for card-based UIs. |
| **OpenRouter** | Single API key for multiple models. Free tier models available. Easy to swap models without code changes. Indonesia-friendly (no regional block for API access). |
| **pdf-parse** | Lightweight, no external API needed, runs server-side in Next.js API route. Well-maintained npm package. |
| **Vercel** | Zero-config deployment for Next.js. Free hobby tier. Custom domain support. Streaming responses supported. |

---

## 7. Database Design

**For MVP: No database needed.**

Justification:
- Resume analysis is a stateless operation (input → output)
- No user accounts required
- Results are ephemeral (session only)
- This keeps the stack simple for a hackathon/demo context

**If you want to add persistence later (Phase 2):**

```sql
-- Users (optional, for auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resume uploads
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  filename TEXT,
  raw_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis results
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  overall_score INTEGER,
  overall_grade TEXT,
  result_json JSONB,  -- full AI response stored as JSON
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rewrites
CREATE TABLE rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  section_name TEXT,
  original_text TEXT,
  rewritten_text TEXT,
  user_context TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Recommended DB if needed:** Supabase (free tier, PostgreSQL, easy Vercel integration)

---

## 8. API Design

### POST /api/upload

**Purpose:** Receive PDF, parse to text, return extracted content

**Request:**
```
Content-Type: multipart/form-data
Body: FormData { file: <PDF binary> }
```

**Response (200):**
```json
{
  "success": true,
  "text": "John Doe\njohn@email.com\n\nSUMMARY\nMotivated fresh graduate...",
  "wordCount": 342,
  "detectedSections": ["summary", "experience", "education", "skills"]
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "EMPTY_PDF",
  "message": "No text could be extracted. Your PDF may be image-based or corrupted."
}
```

---

### POST /api/analyze

**Purpose:** Send resume text to AI, stream back structured JSON feedback

**Request:**
```json
{
  "resumeText": "John Doe\njohn@email.com\n\nSUMMARY\n..."
}
```

**Response:** `text/event-stream` (SSE) — streams JSON chunks

**Final assembled response:**
```json
{
  "overall_score": 42,
  "overall_grade": "D",
  "headline_roast": "...",
  "sections": { ... },
  "top_priorities": [ ... ]
}
```

---

### POST /api/rewrite

**Purpose:** Rewrite a specific resume section

**Request:**
```json
{
  "sectionName": "experience",
  "sectionText": "- Responsible for maintaining the company website\n- Helped with backend tasks",
  "userContext": "targeting backend developer role at fintech startup"
}
```

**Response:** `text/plain` stream — plain text streams directly

---

## 9. Folder Structure

```
resumeroast/
├── app/
│   ├── page.tsx                    # Main landing + upload page
│   ├── layout.tsx                  # Root layout, fonts, metadata
│   ├── globals.css                 # Tailwind base styles
│   └── api/
│       ├── upload/
│       │   └── route.ts            # PDF upload + parsing endpoint
│       ├── analyze/
│       │   └── route.ts            # AI analysis + streaming
│       └── rewrite/
│           └── route.ts            # AI rewrite + streaming
│
├── components/
│   ├── UploadZone.tsx              # Drag-drop PDF upload component
│   ├── LoadingState.tsx            # Animated loading with messages
│   ├── ScoreCard.tsx               # Individual section score card
│   ├── OverallScore.tsx            # Big score display + grade
│   ├── RewritePanel.tsx            # Side-by-side rewrite UI
│   ├── FeedbackBullet.tsx          # Single feedback item
│   └── PriorityList.tsx            # Top 3 priorities component
│
├── lib/
│   ├── parsePdf.ts                 # pdf-parse wrapper with error handling
│   ├── openrouter.ts               # OpenRouter API client + helpers
│   └── streamHelpers.ts            # ReadableStream utilities
│
├── services/
│   ├── analyzeResume.ts            # Analysis prompt builder + caller
│   └── rewriteSection.ts          # Rewrite prompt builder + caller
│
├── utils/
│   ├── extractJson.ts              # Safely extract JSON from LLM response
│   ├── chunkText.ts                # Split long resumes for token limits
│   └── validateFile.ts             # Client-side file validation
│
├── types/
│   ├── analysis.ts                 # TypeScript types for AI response
│   └── upload.ts                   # File upload types
│
├── public/
│   ├── logo.svg                    # ResumeRoast logo
│   └── favicon.ico
│
├── .env.local                      # OPENROUTER_API_KEY=...
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 10. Key Implementation Details

### PDF Parsing

```typescript
// lib/parsePdf.ts
import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();
    
    if (!text || text.length < 50) {
      throw new Error('EMPTY_PDF');
    }
    
    return text;
  } catch (err: any) {
    if (err.message === 'EMPTY_PDF') throw err;
    throw new Error('PARSE_FAILED');
  }
}
```

### Token Chunking for Long Resumes

```typescript
// utils/chunkText.ts
// Rough estimate: 1 token ≈ 4 characters
// Keep resume under 3000 tokens = ~12000 characters

export function prepareResumeText(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  
  // Take first maxChars, try to cut at a newline boundary
  const truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n');
  return lastNewline > maxChars * 0.8 
    ? truncated.slice(0, lastNewline) + '\n[Resume truncated for analysis]'
    : truncated + '\n[Resume truncated for analysis]';
}
```

### OpenRouter API Client

```typescript
// lib/openrouter.ts
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

interface OpenRouterOptions {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  stream?: boolean;
  temperature?: number;
}

export async function callOpenRouter(options: OpenRouterOptions): Promise<Response> {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://resumeroast.vercel.app',
      'X-Title': 'ResumeRoast',
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: options.stream ?? false,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${response.status} — ${error}`);
  }

  return response;
}
```

### Streaming API Route (Next.js)

```typescript
// app/api/analyze/route.ts
import { NextRequest } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';
import { prepareResumeText } from '@/utils/chunkText';
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisUserPrompt } from '@/services/analyzeResume';

export const runtime = 'nodejs'; // Required for pdf-parse

export async function POST(req: NextRequest) {
  const { resumeText } = await req.json();

  if (!resumeText) {
    return Response.json({ error: 'No resume text provided' }, { status: 400 });
  }

  const preparedText = prepareResumeText(resumeText);

  const openRouterResponse = await callOpenRouter({
    model: 'google/gemini-2.0-flash-exp:free',
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: buildAnalysisUserPrompt(preparedText) },
    ],
    stream: true,
    temperature: 0.6,
  });

  // Pipe the OpenRouter stream directly to the client
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const reader = openRouterResponse.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') {
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

### Upload API Route

```typescript
// app/api/upload/route.ts
import { NextRequest } from 'next/server';
import { extractTextFromPdf } from '@/lib/parsePdf';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return Response.json({ success: false, error: 'Only PDF files are supported' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ success: false, error: 'File too large. Max 5MB.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const text = await extractTextFromPdf(buffer);
    const wordCount = text.split(/\s+/).length;
    
    return Response.json({
      success: true,
      text,
      wordCount,
    });
  } catch (err: any) {
    const message = err.message === 'EMPTY_PDF'
      ? 'No text could be extracted. Use a text-based PDF, not a scanned image.'
      : 'Failed to read PDF. Please try a different file.';
    
    return Response.json({ success: false, error: message }, { status: 422 });
  }
}
```

### JSON Extraction Utility

```typescript
// utils/extractJson.ts
export function extractJsonFromLLMResponse(text: string): any {
  // LLMs sometimes wrap JSON in markdown code blocks
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object pattern
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Could not extract valid JSON from response');
  }
}
```

### Client-Side Streaming Consumer

```typescript
// In your React component
async function analyzeResume(resumeText: string) {
  setStatus('loading');
  
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    accumulated += decoder.decode(value, { stream: true });
    
    // Try to parse progressively (show results as soon as JSON is complete)
    try {
      const result = extractJsonFromLLMResponse(accumulated);
      setAnalysisResult(result);
      setStatus('results');
    } catch {
      // Not complete yet, keep accumulating
    }
  }
}
```

---

## 11. UI/UX Design Suggestions

### Layout Structure

```
┌─────────────────────────────────────────┐
│  🔥 ResumeRoast    [dark background]    │
│  "Get Your Resume Roasted"              │
│  ┌─────────────────────────────────┐    │
│  │   Drop your PDF here  🔥        │    │
│  │   or click to upload            │    │
│  └─────────────────────────────────┘    │
│  [Roast My Resume 🔥]                   │
└─────────────────────────────────────────┘

After analysis:

┌──────────────────────────────────────────┐
│  Overall Score: 42/100  Grade: D          │
│  ████░░░░░░░░░░░░░░░░░░░  (red fill)     │
│  "This resume reads like..."             │
└──────────────────────────────────────────┘
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Summary   │ │ Experience │ │   Skills   │
│   30/100   │ │   35/100   │ │   60/100   │
│ ██░░░░░░   │ │ ███░░░░░   │ │ ██████░░   │
│ [Roast]    │ │ [Roast]    │ │ [Roast]    │
│ [Rewrite→] │ │ [Rewrite→] │ │ [Rewrite→] │
└────────────┘ └────────────┘ └────────────┘
```

### Score Color System

```typescript
// Score to color mapping
function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-400 bg-green-900/20';
  if (score >= 55) return 'text-yellow-400 bg-yellow-900/20';
  if (score >= 35) return 'text-orange-400 bg-orange-900/20';
  return 'text-red-400 bg-red-900/20';
}

function getGradeColor(grade: string): string {
  const map = { A: 'text-green-400', B: 'text-lime-400', C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-500' };
  return map[grade] || 'text-gray-400';
}
```

### Recommended Color Palette (Dark Theme)

```css
/* Background: #0f0f0f or #111111 */
/* Card bg: #1a1a1a */
/* Accent: #f97316 (orange-500) — the "fire" color */
/* Text primary: #f5f5f5 */
/* Text secondary: #a3a3a3 */
/* Border: #2a2a2a */
/* Success: #22c55e */
/* Warning: #eab308 */
/* Danger: #ef4444 */
```

### Rewrite UX

```
┌─────────────────────────────────────────────────────────┐
│ EXPERIENCE SECTION                          [Rewrite →]  │
├───────────────────────┬─────────────────────────────────┤
│ ORIGINAL              │ REWRITTEN                        │
├───────────────────────┼─────────────────────────────────┤
│ - Responsible for     │ ▌ • Built and maintained a       │
│   maintaining the     │   customer-facing web portal    │
│   company website     │   serving 2,000+ monthly users  │
│ - Helped with         │                                  │
│   backend tasks       │ • Reduced page load time by 40% │
│                       │   through lazy loading + query  │
│                       │   optimization on MySQL         │
└───────────────────────┴─────────────────────────────────┘
                                          [Copy Rewrite 📋]
```

---

## 12. MVP vs Advanced Features

### MVP (Ship This First)

- [x] PDF upload + validation (client + server)
- [x] PDF text extraction
- [x] AI analysis with JSON scoring
- [x] Score visualization (overall + per section)
- [x] Roast feedback per section
- [x] Top 3 priorities panel
- [x] Section rewrite with streaming
- [x] Copy to clipboard
- [x] Error handling (invalid PDF, API failure)
- [x] Mobile responsive
- [x] Deploy on Vercel

### Phase 2 (Post-MVP)

- [ ] Chat mode: ask follow-up questions about your resume
- [ ] Version comparison: original vs rewritten side-by-side diff
- [ ] Target role input: "I'm applying for [role] at [company type]"
- [ ] ATS keyword checker: compare against job description
- [ ] Resume history (localStorage or Supabase)
- [ ] Export rewritten resume as PDF or DOCX
- [ ] Email results to yourself
- [ ] Multiple language support (Bahasa Indonesia)

---

## 13. TypeScript Types

```typescript
// types/analysis.ts

export interface SectionAnalysis {
  score: number;
  label: string;
  roast: string;
  feedback: string[];
}

export interface AnalysisResult {
  overall_score: number;
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  headline_roast: string;
  sections: {
    summary: SectionAnalysis;
    experience: SectionAnalysis;
    skills: SectionAnalysis;
    education: SectionAnalysis;
    ats_score: SectionAnalysis;
  };
  top_priorities: string[];
}

export type AppStatus = 
  | 'idle' 
  | 'file_ready' 
  | 'uploading' 
  | 'analyzing' 
  | 'results' 
  | 'rewriting' 
  | 'error';

export interface RewriteState {
  sectionName: string;
  isLoading: boolean;
  result: string;
}

// types/upload.ts
export interface UploadResult {
  success: boolean;
  text?: string;
  wordCount?: number;
  error?: string;
}
```

---

## 14. Environment Variables

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx

# Optional: set your Vercel URL for OpenRouter referrer header
NEXT_PUBLIC_APP_URL=https://resumeroast.vercel.app
```

---

## 15. Quickstart Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest resumeroast --typescript --tailwind --app --no-src-dir

# 2. Install dependencies
cd resumeroast
npm install pdf-parse
npm install -D @types/pdf-parse

# 3. Set env
echo "OPENROUTER_API_KEY=your_key_here" > .env.local

# 4. Run dev
npm run dev

# 5. Deploy
npx vercel --prod
```

---

*Built for: WealthyPeople.id Stage 2 Challenge — Web & AI Creativity Challenge*
*Stack: Next.js 14 App Router + Tailwind CSS + OpenRouter + pdf-parse + Vercel*
