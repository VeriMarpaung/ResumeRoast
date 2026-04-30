const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterMessage = {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
};

export type OpenRouterChatCompletionInput = {
	model: string;
	messages: OpenRouterMessage[];
};

export async function openRouterChatCompletionStream({
	model,
	messages,
}: OpenRouterChatCompletionInput): Promise<Response> {
	const apiKey = process.env.OPENROUTER_API_KEY;

	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY is not set.");
	}

	const response = await fetch(OPENROUTER_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			Accept: "text/event-stream",
		},
		body: JSON.stringify({
			model,
			messages,
			stream: true,
		}),
	});

	if (!response.ok) {
		const data = await response.text();
		throw new Error(
			`OpenRouter request failed with status ${response.status}: ${data}`,
		);
	}

	return response;
}

export async function openRouterChatCompletion({
	model,
	messages,
}: OpenRouterChatCompletionInput): Promise<unknown> {
	const apiKey = process.env.OPENROUTER_API_KEY;

	if (!apiKey) {
		throw new Error("OPENROUTER_API_KEY is not set.");
	}

	const response = await fetch(OPENROUTER_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			messages,
		}),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(
			`OpenRouter request failed with status ${response.status}: ${JSON.stringify(data)}`,
		);
	}

	return data;
}
