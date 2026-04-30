export const runtime = "nodejs";

import { extractTextFromPdf } from "@/lib/parsepdf";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isPdfFile(file: File) {
	return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function POST(request: Request) {
	const contentType = request.headers.get("content-type") ?? "";
	console.log("[upload] content-type:", contentType);

	if (!contentType.toLowerCase().includes("multipart/form-data")) {
		return Response.json(
			{ error: "Content-Type must be multipart/form-data." },
			{ status: 415 },
		);
	}

	try {
		const formData = await request.formData();
		const uploadedFile = formData.get("file");

		if (!(uploadedFile instanceof File)) {
			return Response.json({ error: "No file was provided." }, { status: 400 });
		}

		console.log("[upload] file:", {
			name: uploadedFile.name,
			type: uploadedFile.type,
			size: uploadedFile.size,
		});

		if (!isPdfFile(uploadedFile)) {
			return Response.json({ error: "Only PDF files are allowed." }, { status: 400 });
		}

		if (uploadedFile.size > MAX_FILE_SIZE) {
			return Response.json({ error: "File must be 5MB or smaller." }, { status: 413 });
		}

		const arrayBuffer = await uploadedFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const extractedText = await extractTextFromPdf(buffer);

		return Response.json({
			success: true,
			file: {
				name: uploadedFile.name,
				type: uploadedFile.type || "application/pdf",
				size: uploadedFile.size,
				bufferSize: buffer.length,
			},
			extractedText,
		});
	} catch (error) {
		console.error("[upload] Failed to parse PDF:", error);
		const message = error instanceof Error ? error.message : "Failed to parse PDF.";
		return Response.json({ error: message }, { status: 500 });
	}
}

export async function GET() {
	return Response.json({
		message: "Upload endpoint ready. Send a multipart/form-data POST request with a PDF file named 'file'.",
	});
}
