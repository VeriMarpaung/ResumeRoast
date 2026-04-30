import { rewriteSectionStream } from "@/services/rewriteSection";

type RewriteRequestBody = {
	sectionName?: string;
	sectionText?: string;
	userContext?: string;
};

export async function POST(request: Request) {
	let body: RewriteRequestBody;

	try {
		body = (await request.json()) as RewriteRequestBody;
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	if (!body.sectionName || !body.sectionName.trim()) {
		return Response.json({ error: "sectionName is required." }, { status: 400 });
	}

	if (!body.sectionText || !body.sectionText.trim()) {
		return Response.json({ error: "sectionText is required." }, { status: 400 });
	}

	try {
		const stream = await rewriteSectionStream({
			sectionName: body.sectionName,
			sectionText: body.sectionText,
			userContext: body.userContext,
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to rewrite section.";
		return Response.json({ error: message }, { status: 500 });
	}
}
