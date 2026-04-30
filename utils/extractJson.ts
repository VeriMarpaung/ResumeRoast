export function extractJsonFromLLMResponse<T = unknown>(text: string): T {
	const cleanedText = text
		.replace(/```json\s*/gi, "")
		.replace(/```\s*/g, "")
		.trim();

	const match = cleanedText.match(/\{[\s\S]*\}/);

	if (!match) {
		throw new Error("Could not extract JSON from response.");
	}

	try {
		return JSON.parse(match[0]) as T;
	} catch {
		throw new Error("Could not parse extracted JSON.");
	}
}
