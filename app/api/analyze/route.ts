import { analyzeResume } from "@/services/analyzeResume";
import { extractJsonFromLLMResponse } from "@/utils/extractJson";

type AnalyzeRequestBody = {
	resumeText?: string;
};

export async function POST(request: Request) {
	let body: AnalyzeRequestBody;

	try {
		body = (await request.json()) as AnalyzeRequestBody;
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	if (!body.resumeText || !body.resumeText.trim()) {
		return Response.json({ error: "resumeText is required." }, { status: 400 });
	}

	try {
		console.log("[analyze] resumeText length:", body.resumeText.length);
		const response = await analyzeResume({ resumeText: body.resumeText });
		const choices = response as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const content = choices.choices?.[0]?.message?.content ?? "";
		console.log("[analyze] OpenRouter choices count:", choices.choices?.length ?? 0);
		console.log("[analyze] OpenRouter content length:", content.length);

		if (!content.trim()) {
			return Response.json(
				{ error: "Model returned an empty analysis response." },
				{ status: 502 },
			);
		}

		const parsedAnalysis = extractJsonFromLLMResponse(content);
		return Response.json(parsedAnalysis);
	} catch (error) {
		console.error("[analyze] Failed to analyze resume:", error);
		const message = error instanceof Error ? error.message : "Failed to analyze resume.";
		return Response.json({ error: message }, { status: 500 });
	}
}
