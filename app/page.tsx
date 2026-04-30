"use client";

import UploadZone from "@/components/UploadZone";
import { useState } from "react";
import AnalysisResults, { type AnalysisResult } from "@/components/AnalysisResults";

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [extractedText, setExtractedText] = useState("");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_45%,_#e2e8f0_100%)] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
        <section className="flex-1 space-y-6">
          <div className="inline-flex rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm backdrop-blur">
            ResumeRoast + Rewrite
          </div>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Brutally honest resume feedback, then a rewrite that actually helps.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Upload a PDF resume, get a structured roast-style analysis, and turn weak bullets
              into stronger, clearer, ATS-friendly writing.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Impact
              </p>
              <p className="mt-2 text-2xl font-semibold">92</p>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Clarity
              </p>
              <p className="mt-2 text-2xl font-semibold">68</p>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                ATS Score
              </p>
              <p className="mt-2 text-2xl font-semibold">74</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 shadow-sm">
              PDF parsing
            </span>
            <span className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 shadow-sm">
              Streaming AI feedback
            </span>
            <span className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 shadow-sm">
              Interactive rewrites
            </span>
          </div>
        </section>

        <section className="flex-1 lg:max-w-2xl">
          <UploadZone 
            onAnalysisComplete={(result, text) => {
              setAnalysisResult(result);
              setExtractedText(text);
            }}
          />
        </section>
      </main>

      {analysisResult && extractedText && (
        <div className="mx-auto w-full max-w-7xl mt-12">
          <AnalysisResults analysis={analysisResult} resumeText={extractedText} />
        </div>
      )}
    </div>
  );
}
