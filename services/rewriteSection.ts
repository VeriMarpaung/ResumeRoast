import {
	openRouterChatCompletion,
	openRouterChatCompletionStream,
	type OpenRouterMessage,
} from "@/lib/openrouter";

export const REWRITE_SYSTEM_PROMPT = `You are ResumeRoast's rewrite engine. Your job is to take a weak resume section
and rewrite it to be strong, specific, and impactful.

RULES:
- Use the CAR format for experience bullets: Context → Action → Result
- Include metrics/numbers where they can reasonably be inferred or added
- Match the user's target role if provided
- Do NOT invent specific company names or fake achievements
- Keep the same general facts but make them compelling
- Output ONLY the rewritten section text — no explanations, no labels`;

export function buildRewriteUserPrompt(
	sectionName: string,
	sectionText: string,
	userContext?: string,
) {
	return `Rewrite the following resume section: ${sectionName}

Original text:
---
${sectionText}
---

${userContext ? `Target role/context: ${userContext}

` : ""}Return only the rewritten text, ready to paste into a resume.`;
}

type RewriteSectionOptions = {
	sectionName: string;
	sectionText: string;
	userContext?: string;
	model?: string;
};

export async function rewriteSection({
	sectionName,
	sectionText,
	userContext,
	model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
}: RewriteSectionOptions): Promise<string> {
	const messages: OpenRouterMessage[] = [
		{ role: "system", content: REWRITE_SYSTEM_PROMPT },
		{
			role: "user",
			content: buildRewriteUserPrompt(sectionName, sectionText, userContext),
		},
	];

	const response = (await openRouterChatCompletion({ model, messages })) as {
		choices?: Array<{ message?: { content?: string } }>;
	};

	return response.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function rewriteSectionStream({
	sectionName,
	sectionText,
	userContext,
	model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
}: RewriteSectionOptions): Promise<ReadableStream<Uint8Array>> {
	const messages: OpenRouterMessage[] = [
		{ role: "system", content: REWRITE_SYSTEM_PROMPT },
		{
			role: "user",
			content: buildRewriteUserPrompt(sectionName, sectionText, userContext),
		},
	];

	const response = await openRouterChatCompletionStream({ model, messages });
	const encoder = new TextEncoder();

	return new ReadableStream<Uint8Array>({
		async start(controller) {
			if (!response.body) {
				controller.error(new Error("Empty OpenRouter stream."));
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						break;
					}

					buffer += decoder.decode(value, { stream: true });
					const events = buffer.split("\n");
					buffer = events.pop() ?? "";

					for (const event of events) {
						if (!event.startsWith("data: ")) {
							continue;
						}

						const data = event.slice(6).trim();

						if (!data || data === "[DONE]") {
							continue;
						}

						try {
							const parsed = JSON.parse(data) as {
								choices?: Array<{ delta?: { content?: string } }>;
							};

							const chunk = parsed.choices?.[0]?.delta?.content;
							if (chunk) {
								controller.enqueue(encoder.encode(chunk));
							}
						} catch {
							// Ignore malformed SSE chunks.
						}
					}
				}

				const remaining = buffer.trim();
				if (remaining.startsWith("data: ")) {
					const data = remaining.slice(6).trim();
					if (data && data !== "[DONE]") {
						try {
							const parsed = JSON.parse(data) as {
								choices?: Array<{ delta?: { content?: string } }>;
							};

							const chunk = parsed.choices?.[0]?.delta?.content;
							if (chunk) {
								controller.enqueue(encoder.encode(chunk));
							}
						} catch {
							// Ignore malformed SSE chunks.
						}
					}
				}

				controller.close();
			} catch (error) {
				controller.error(error);
			} finally {
				reader.releaseLock();
			}
		},
	});
}
