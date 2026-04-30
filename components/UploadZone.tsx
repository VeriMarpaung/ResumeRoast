"use client";

import { useRef, useState } from "react";
import AnalysisResults, { type AnalysisResult } from "./AnalysisResults";

type UploadZoneProps = {
	onAnalyze?: (file: File) => void | Promise<void>;
	onAnalysisComplete?: (result: AnalysisResult, extractedText: string) => void;
	className?: string;
};

type UploadResponse = {
	success?: boolean;
	error?: string;
	extractedText?: string;
};

type AnalyzeErrorResponse = {
	error?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileError(file: File) {
	if (file.type !== "application/pdf") {
		return "Please upload a PDF file only.";
	}

	if (file.size > MAX_FILE_SIZE) {
		return "File must be 5MB or smaller.";
	}

	return "";
}

async function readJsonSafely<T>(response: Response): Promise<T | null> {
	const contentType = response.headers.get("content-type") ?? "";
	const responseText = await response.text();

	if (!responseText.trim()) {
		return null;
	}

	if (!contentType.toLowerCase().includes("application/json")) {
		throw new Error(responseText.slice(0, 200) || "Unexpected non-JSON response.");
	}

	return JSON.parse(responseText) as T;
}

export default function UploadZone({ onAnalyze, onAnalysisComplete, className }: UploadZoneProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState("");
	const [extractedText, setExtractedText] = useState("");
	const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	function handleFile(fileToValidate?: File | null) {
		if (!fileToValidate) {
			setFile(null);
			setError("");
			setExtractedText("");
			setAnalysisResult(null);
			return;
		}

		const validationError = getFileError(fileToValidate);

		if (validationError) {
			setFile(null);
			setError(validationError);
			return;
		}

		setFile(fileToValidate);
		setError("");
		setExtractedText("");
		setAnalysisResult(null);
	}

	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
		handleFile(event.target.files?.[0] ?? null);
	}

	function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		setIsDragging(false);
		handleFile(event.dataTransfer.files?.[0] ?? null);
	}

	async function handleAnalyzeResume(resumeText: string) {
		setIsAnalyzing(true);

		try {
			const response = await fetch("/api/analyze", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ resumeText }),
			});
			const data = await readJsonSafely<AnalysisResult & AnalyzeErrorResponse>(response);

			if (!response.ok) {
				throw new Error(data?.error || "Analysis failed.");
			}

			if (!data) {
				throw new Error("Empty analysis response.");
			}

			setAnalysisResult(data);
			onAnalysisComplete?.(data, resumeText);
			console.log("Resume analysis result:", data);
			return data;
		} catch (analysisError) {
			const message = analysisError instanceof Error ? analysisError.message : "Analysis failed.";
			setError(message);
			throw analysisError;
		} finally {
			setIsAnalyzing(false);
		}
	}

	async function handleUpload() {
		if (!file) {
			setError("Select a PDF resume before analyzing.");
			return;
		}

		try {
			setIsUploading(true);
			setError("");

			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const data = (await response.json()) as UploadResponse;

			if (!response.ok) {
				throw new Error(data.error || "Upload failed.");
			}

			const resumeText = data.extractedText ?? "";
			setExtractedText(resumeText);
			await handleAnalyzeResume(resumeText);
			await onAnalyze?.(file);
		} catch (uploadError) {
			const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
			setError(message);
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<div
			className={`mx-auto w-full max-w-2xl rounded-3xl border border-dashed border-zinc-300 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm transition ${className ?? ""}`}
		>
			<div
				role="button"
				tabIndex={0}
				onClick={() => inputRef.current?.click()}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						inputRef.current?.click();
					}
				}}
				onDragEnter={() => setIsDragging(true)}
				onDragLeave={() => setIsDragging(false)}
				onDragOver={(event) => event.preventDefault()}
				onDrop={handleDrop}
				className={`group flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
					isDragging
						? "border-slate-900 bg-slate-950 text-white"
						: "border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-400 hover:bg-zinc-100"
				}`}
			>
				<input
					ref={inputRef}
					type="file"
					accept="application/pdf,.pdf"
					className="sr-only"
					onChange={handleInputChange}
				/>

				<div className="mb-4 rounded-full border border-current/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] opacity-70">
					Resume upload
				</div>

				<h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
					Drop your CV here
				</h2>
				<p className="mt-3 max-w-md text-sm leading-6 text-current/70">
					Drag and drop a PDF, or click to browse. We only accept PDF files up to 5MB.
				</p>

				<div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
					<div className="rounded-2xl border border-current/10 bg-white/70 px-4 py-3 text-left">
						<p className="text-xs font-medium uppercase tracking-[0.2em] text-current/50">
							Step 1
						</p>
						<p className="mt-1 text-sm font-medium">Upload your resume</p>
					</div>
					<div className="rounded-2xl border border-current/10 bg-white/70 px-4 py-3 text-left">
						<p className="text-xs font-medium uppercase tracking-[0.2em] text-current/50">
							Step 2
						</p>
						<p className="mt-1 text-sm font-medium">Get a blunt scorecard</p>
					</div>
					<div className="rounded-2xl border border-current/10 bg-white/70 px-4 py-3 text-left">
						<p className="text-xs font-medium uppercase tracking-[0.2em] text-current/50">
							Step 3
						</p>
						<p className="mt-1 text-sm font-medium">Rewrite weak sections</p>
					</div>
				</div>
			</div>

			<div className="mt-4 space-y-3 rounded-2xl bg-zinc-950 px-4 py-4 text-white">
				{file ? (
					<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-semibold">{file.name}</p>
							<p className="text-xs text-white/70">{formatFileSize(file.size)}</p>
						</div>
						<span className="inline-flex w-fit rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
							Ready to analyze
						</span>
					</div>
				) : (
					<p className="text-sm text-white/70">
						No file selected yet. Upload a PDF to start the roast.
					</p>
				)}

				{error ? <p className="text-sm text-rose-300">{error}</p> : null}

				<button
					type="button"
					onClick={handleUpload}
					disabled={!file || isUploading || isAnalyzing}
					className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isUploading || isAnalyzing ? "Analyzing..." : "Analyze My Resume"}
				</button>

				{extractedText ? (
					<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
							Extracted Text
						</p>
						<pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-white/85">
							{extractedText}
						</pre>
					</div>
				) : null}
			</div>
		</div>
	);
}
