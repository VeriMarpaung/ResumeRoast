import { openRouterChatCompletion, type OpenRouterMessage } from "@/lib/openrouter";

export const ANALYSIS_SYSTEM_PROMPT = `You are ResumeRoast — an brutally honest but constructive AI career coach.
Your job is to analyze resumes and give specific, actionable, data-driven feedback.

RULES:
- NEVER give generic advice like "add more action verbs" without pointing to a specific line
- ALWAYS reference the actual text from the resume when giving feedback
- Be honest, direct, and sometimes funny — but never cruel or discouraging
- Focus on IMPACT: does this resume communicate results, or just duties?
- Focus on ATS: will this pass automated screening?
- All scores are out of 100. Be strict. A score of 70 means genuinely good.
- Output ONLY valid JSON. No markdown, no explanation outside JSON.`;

export function buildAnalysisUserPrompt(resumeText: string) {
  return `Here is the resume text to analyze:

---
${resumeText}
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

Feedback must reference ACTUAL lines from the resume. Be specific. Be honest.`;
}

type AnalyzeResumeOptions = {
	resumeText: string;
	model?: string;
};

export async function analyzeResume({
	resumeText,
	model = process.env.OPENROUTER_ANALYSIS_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
}: AnalyzeResumeOptions): Promise<unknown> {
	const messages: OpenRouterMessage[] = [
		{ role: "system", content: ANALYSIS_SYSTEM_PROMPT },
		{ role: "user", content: buildAnalysisUserPrompt(resumeText) },
	];

	const maxAttempts = 2;
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			return await openRouterChatCompletion({ model, messages });
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			const isRateLimited = message.includes("status 429") || message.includes("rate-limited");

			if (!isRateLimited || attempt === maxAttempts) {
				throw error;
			}

			const retryAfterSecondsMatch = message.match(/"retry_after_seconds"\s*:\s*(\d+)/);
			const retryAfterSeconds = retryAfterSecondsMatch
				? Number(retryAfterSecondsMatch[1])
				: 5;
			await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
		}
	}

	throw new Error("OpenRouter request failed after retries.");
}
