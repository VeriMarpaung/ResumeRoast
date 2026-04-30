"use client";

import { useRef, useState } from "react";

type SectionAnalysis = {
	score: number;
	label: string;
	roast: string;
	feedback: string[];
};

export type AnalysisResult = {
	overall_score: number;
	overall_grade: "A" | "B" | "C" | "D" | "F";
	headline_roast: string;
	sections: Partial<{
		summary: SectionAnalysis;
		experience: SectionAnalysis;
		skills: SectionAnalysis;
		education: SectionAnalysis;
		ats_score: SectionAnalysis;
	}>;
	top_priorities?: string[];
};

type AnalysisResultsProps = {
	analysis: AnalysisResult;
	resumeText: string;
};

const SECTION_ORDER: Array<keyof AnalysisResult["sections"]> = [
	"summary",
	"experience",
	"skills",
	"education",
	"ats_score",
];

const SECTION_LABELS: Record<string, string> = {
	summary: "Summary",
	experience: "Experience",
	skills: "Skills",
	education: "Education",
	ats_score: "ATS Compatibility",
};

function getScoreAccent(score: number) {
	if (score >= 75) {
		return {
			bar: "bg-emerald-400",
			text: "text-emerald-200",
			chip: "bg-emerald-500/15 text-emerald-200",
		};
	}

	if (score >= 55) {
		return {
			bar: "bg-amber-400",
			text: "text-amber-200",
			chip: "bg-amber-500/15 text-amber-200",
		};
	}

	if (score >= 35) {
		return {
			bar: "bg-orange-400",
			text: "text-orange-200",
			chip: "bg-orange-500/15 text-orange-200",
		};
	}

	return {
		bar: "bg-rose-400",
		text: "text-rose-200",
		chip: "bg-rose-500/15 text-rose-200",
	};
}

type RewriteState = {
	isLoading: boolean;
	originalText: string;
	rewrittenText: string;
	error: string;
};

function buildSectionText(resumeText: string, sectionName: string, section: SectionAnalysis) {
	return `Section: ${sectionName}\n\n${section.label}\n\n${resumeText}\n\nFeedback context:\n${section.feedback.join("\n")}`;
}

export default function AnalysisResults({ analysis, resumeText }: AnalysisResultsProps) {
	const [rewriteStates, setRewriteStates] = useState<Record<string, RewriteState>>({});
	const rewriteBufferRef = useRef<Record<string, string>>({});

	async function handleRewrite(sectionKey: string, section: SectionAnalysis) {
		const originalText = buildSectionText(resumeText, sectionKey, section);

		setRewriteStates((current) => ({
			...current,
			[sectionKey]: {
				isLoading: true,
				originalText,
				rewrittenText: current[sectionKey]?.rewrittenText ?? "",
				error: "",
			},
		}));
		rewriteBufferRef.current[sectionKey] = "";

		try {
			const response = await fetch("/api/rewrite", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					sectionName: section.label,
					sectionText: originalText,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || "Failed to rewrite section.");
			}

			if (!response.body) {
				throw new Error("Empty rewrite response.");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}

				rewriteBufferRef.current[sectionKey] += decoder.decode(value, {
					stream: true,
				});
				const streamedText = rewriteBufferRef.current[sectionKey];
				setRewriteStates((current) => ({
					...current,
					[sectionKey]: {
						isLoading: true,
						originalText,
						rewrittenText: streamedText,
						error: "",
					},
				}));
			}

			rewriteBufferRef.current[sectionKey] += decoder.decode();
			const completedText = rewriteBufferRef.current[sectionKey];

			setRewriteStates((current) => ({
				...current,
				[sectionKey]: {
					isLoading: false,
					originalText,
					rewrittenText: completedText,
					error: "",
				},
			}));
			console.log(`Rewritten ${sectionKey} section:`, completedText);
		} catch (rewriteError) {
			const message = rewriteError instanceof Error ? rewriteError.message : "Failed to rewrite section.";

			setRewriteStates((current) => ({
				...current,
				[sectionKey]: {
					isLoading: false,
					originalText,
					rewrittenText: "",
					error: message,
				},
			}));
		}
	}
	async function handleCopy(text: string) {
		await navigator.clipboard.writeText(text);
	}

	return (
		<div className="space-y-5 rounded-3xl border border-slate-900/10 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
			<div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
				<div className="rounded-2xl bg-slate-950 p-5 text-white">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
						Overall Score
					</p>
					<div className="mt-3 flex items-end gap-3">
						<span className="text-5xl font-semibold tracking-tight">
							{analysis.overall_score}
						</span>
						<span className="pb-1 text-sm text-white/60">/ 100</span>
					</div>
					<div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
						<div
							className="h-full rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300"
							style={{ width: `${Math.min(Math.max(analysis.overall_score, 0), 100)}%` }}
						/>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-900/10 bg-slate-50 p-5">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
						Grade
					</p>
					<div className="mt-3 flex items-center gap-3">
						<span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-semibold text-white">
							{analysis.overall_grade}
						</span>
						<p className="text-sm leading-6 text-slate-600">
							{analysis.headline_roast}
						</p>
					</div>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:auto-rows-max">
				{SECTION_ORDER.map((sectionKey) => {
					const section = analysis.sections[sectionKey];
					const rewriteState = rewriteStates[sectionKey] ?? {
						isLoading: false,
						rewrittenText: "",
						error: "",
					};

					if (!section) {
						return null;
					}

					const accent = getScoreAccent(section.score);

					return (
						<section
							key={sectionKey}
							className="rounded-2xl border border-slate-900/10 bg-white p-4 shadow-sm"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p className="text-sm font-semibold text-slate-950">
										{SECTION_LABELS[sectionKey] ?? section.label}
									</p>
									<p className="mt-1 text-sm leading-6 text-slate-600">{section.roast}</p>
								</div>
								<div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${accent.chip}`}>
									{section.score}/100
								</div>
							</div>

							<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
								<div
									className={`h-full rounded-full ${accent.bar}`}
									style={{ width: `${Math.min(Math.max(section.score, 0), 100)}%` }}
								/>
							</div>

							<ul className="mt-4 space-y-2">
								{section.feedback.map((item) => (
									<li
										key={item}
										className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
									>
										{item}
									</li>
								))}
							</ul>

							<div className="mt-4 flex items-center justify-between gap-3">
								<button
									type="button"
									onClick={() => handleRewrite(sectionKey, section)}
									disabled={rewriteState.isLoading}
									className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{rewriteState.isLoading ? "Rewriting..." : "Rewrite This →"}
								</button>
							</div>

							{rewriteState.error ? (
								<p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
									{rewriteState.error}
								</p>
							) : null}

							{rewriteState.rewrittenText ? (
								<div className="mt-3 rounded-2xl border border-slate-900/10 bg-slate-50 p-4">
									<div className="flex items-center justify-between gap-3">
										<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
											Original vs Rewritten
										</p>
										<button
											type="button"
											onClick={() => handleCopy(rewriteState.rewrittenText)}
											className="inline-flex items-center justify-center rounded-lg border border-slate-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
										>
											Copy
										</button>
									</div>

									<div className="mt-4 grid gap-4 lg:grid-cols-2">
										<div className="rounded-xl border border-slate-900/10 bg-white p-3">
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
												Original Text
											</p>
											<pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
												{rewriteState.originalText}
											</pre>
										</div>

										<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/70">
												Rewritten Text
											</p>
											<pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
												{rewriteState.rewrittenText}
											</pre>
										</div>
									</div>
								</div>
							) : null}
						</section>
					);
				})}
			</div>

			{analysis.top_priorities?.length ? (
				<div className="rounded-2xl border border-slate-900/10 bg-slate-950 p-5 text-white">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
						Top 3 Priorities
					</p>
					<ol className="mt-4 space-y-3">
						{analysis.top_priorities.map((item, index) => (
							<li
								key={`${index}-${item}`}
								className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-3 text-sm leading-6"
							>
								<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-xs font-semibold text-amber-200">
									{index + 1}
								</span>
								<span className="text-white/90">{item}</span>
							</li>
						))}
					</ol>
				</div>
			) : null}
		</div>
	);
}