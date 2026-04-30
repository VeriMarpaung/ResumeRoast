export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
	const { default: DOMMatrixPolyfill } = await import("dommatrix");
	const { PDFParse } = await import("pdf-parse");

	if (!globalThis.DOMMatrix) {
		// Polyfill for pdfjs in Node.js runtimes (e.g., Vercel)
		globalThis.DOMMatrix = DOMMatrixPolyfill as typeof globalThis.DOMMatrix;
	}

	if (!buffer || buffer.length === 0) {
		throw new Error("PDF buffer is empty.");
	}

	const workerSrc = new URL(
		"pdfjs-dist/legacy/build/pdf.worker.mjs",
		import.meta.url,
	).toString();
	PDFParse.setWorker(workerSrc);
	const parser = new PDFParse({
		data: buffer,
	} as unknown as { data: Buffer });

	try {
		const result = await parser.getText();
		const text = result.text.trim();

		if (!text) {
			throw new Error("PDF text is empty.");
		}

		return text;
	} finally {
		await parser.destroy();
	}
}
