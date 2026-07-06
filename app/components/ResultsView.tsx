"use client";

import React, { useState, useRef, useMemo } from "react";
import { QuizResults } from "../actions/quiz";
import { CheckCircle2, XCircle, Sparkles, Upload, ArrowUpCircle } from "lucide-react";

interface ResultsViewProps {
  results: QuizResults;
  isPro: boolean;
  onUploadNew: () => void;
  onUpgradeClick: () => void;
}

export default function ResultsView({
  results,
  isPro,
  onUploadNew,
  onUpgradeClick,
}: ResultsViewProps) {
  const percentage = (results.score / results.questions.length) * 100;
  
  // Custom feedback message based on score
  let feedbackTitle = "Keep learning!";
  let feedbackDesc = "Review the explanations below to master this concept.";
  if (results.score === results.questions.length) {
    feedbackTitle = "Perfect Score!";
    feedbackDesc = "Incredible job! You've completely mastered this material.";
  } else if (results.score >= 3) {
    feedbackTitle = "Great Job!";
    feedbackDesc = "You have a solid understanding of this document.";
  }

  // Generate star particles positioned around the form
    const stars = useMemo(() => {
      return [
        { top: "10%", left: "5%", delay: "0.5s" },
        { top: "15%", left: "85%", delay: "1.2s" },
        { top: "80%", left: "12%", delay: "0.8s" },
        { top: "85%", left: "78%", delay: "2.1s" },
        { top: "45%", left: "-8%", delay: "1.5s" },
        { top: "50%", left: "105%", delay: "0.3s" },
        { top: "-5%", left: "30%", delay: "1.9s" },
        { top: "105%", left: "60%", delay: "2.4s" },
        { top: "3%", left: "70%", delay: "0.7s" },
        { top: "95%", left: "25%", delay: "1.4s" },
        { top: "30%", left: "-3%", delay: "2.2s" },
        { top: "70%", left: "102%", delay: "1.1s" },
        { top: "-8%", left: "50%", delay: "0.4s" },
        { top: "108%", left: "40%", delay: "1.7s" },
        { top: "25%", left: "92%", delay: "1.0s" },
        { top: "60%", left: "-12%", delay: "2.5s" },
        { top: "-12%", left: "15%", delay: "0.2s" },
        { top: "112%", left: "80%", delay: "1.8s" },
        { top: "5%", left: "95%", delay: "2.0s" },
        { top: "90%", left: "-5%", delay: "0.9s" },
        { top: "35%", left: "110%", delay: "1.3s" },
        { top: "75%", left: "-10%", delay: "2.7s" },
        { top: "-15%", left: "75%", delay: "0.6s" },
        { top: "115%", left: "20%", delay: "2.3s" },
      ];
    }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Score Card */}
       {/* Glow */}

         <div className="w-full max-w-[auto] mx-auto relative select-none">
             {/* Twinkling Star Particles */}
             {stars.map((star, idx) => (
               <div
                 key={idx}
                 className="absolute w-[1.5px] h-[1.5px] bg-[#D9D9D9] rounded-full blur-[0.5px] animate-twinkle pointer-events-none"
                 style={{
                   top: star.top,
                   left: star.left,
                   "--twinkle-duration": "3s",
                   animationDelay: star.delay,
                 } as React.CSSProperties}
               />
             ))}
<div
  className="absolute inset-0 m-auto w-[1200px] h-[auto] bg-white/5 blur-[400px] pointer-events-none z-0"/>
      {/* Outer Container */}
      <div className="relative bg-[#131416] rounded-[24px] p-1.5 border border-[#3E3F42]">
      <div className="bg-[#000000] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden p-8 text-center">
        <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          Quiz Results
        </h2>
        <span className="text-zinc-500 dark:text-zinc-400 text-sm truncate block max-w-xs mx-auto mb-6">
          {results.pdfName}
        </span>

        {/* Circular Score Visual */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <svg className="h-32 w-32 transform -rotate-90">
             <defs>
    <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#e96bff" />
      <stop offset="100%" stopColor="#7400e1" />
    </linearGradient>
  </defs>
            <circle
              cx="64"
              cy="64"
              r="56"
              strokeWidth="10"
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 56}
              strokeDashoffset={2 * Math.PI * 56 * (1 - percentage / 100)}
              strokeLinecap="round"
                stroke="url(#score-gradient)"

              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {results.score}
            </span>
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">
              out of {results.questions.length}
            </span>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {feedbackTitle}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-8">
          {feedbackDesc}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <button
            onClick={onUploadNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:active:bg-zinc-100 dark:text-zinc-900 text-white py-3 px-6 font-semibold text-sm transition-colors focus:outline-none"
          >
            <Upload className="h-4 w-4" />
            Upload New PDF
          </button>
          
          {!isPro && (
            <button
              onClick={onUpgradeClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white py-3 px-6 font-semibold text-sm transition-colors focus:outline-none shadow-lg shadow-violet-600/10"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
      </div>
</div>
      {/* Question Review List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 px-1">
          Detailed Question Review
        </h3>

        {results.questions.map((q, idx) => {
          const ua = q.userAnswer;
          const isCorrect = ua?.isCorrect ?? false;
          const userOptionText = q[`option${ua?.selectedOption ?? "A"}` as keyof typeof q] as string;
          const correctOptionText = q[`option${q.correctOption}` as keyof typeof q] as string;

          return (
            <div
  key={q.id}
  className="rounded-2xl p-[1px] shadow-md"
  style={{
    background: isCorrect
      ? "linear-gradient(70deg, #1C1C1C 0%, #183022 100%)"
      : "linear-gradient(70deg, #171717 0%, #472424 100%)",
  }}
>
  <div
    className="rounded-[15px] p-6"
    style={{
      background: isCorrect
        ? "linear-gradient(70deg, #000000 70%, #09120D 100%)"
        : "linear-gradient(70deg, #000000 70%, #301818 100%)",
    }}
  >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#222222] bg-transparent text-[#6B6B6B] text-xs font-bold">
  {idx + 1}
</span>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-relaxed pt-0.5">
                  {q.questionText}
                </h4>
              </div>

              {/* User Answer Status */}
              <div className="space-y-3 mb-4 pl-9">
                <div className="flex items-center gap-2 text-sm">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-[#3CB46E] shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-[#B43C3C] shrink-0" />
                  )}
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">
                    Your Answer:
                  </span>
                  <div
  className={`inline-flex items-center rounded-md px-[6px] py-[3px] ${
    isCorrect ? "bg-[#0B150F]" : "bg-[#180C0C]"
  }`}
>
  <span
    className={`font-semibold ${
      isCorrect ? "text-[#3CB46E]" : "text-[#B43C3C]"
    }`}
  >
    ({ua?.selectedOption}) {userOptionText}
  </span>
</div>
                </div>

                {!isCorrect && (
                  <div className="flex items-center gap-2 text-sm pl-7">
                    <span className="font-medium text-zinc-400 dark:text-zinc-500">
                      Correct Answer:
                    </span>
                   <div className="inline-flex items-center rounded-md bg-[#0B150F] px-[6px] py-[3px]">
  <span className="font-semibold text-[#3CB46E]">
    ({q.correctOption}) {correctOptionText}
  </span>
</div>
            
                  </div>
                )}
              </div>

              {/* AI Explanation reasoning (Only shown if incorrect, per requirements) */}
              {!isCorrect && (
                <div className="ml-9 rounded-xl bg-[#000000] p-4 border border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5 mb-1.5">
  <svg width="0" height="0">
    <defs>
      <linearGradient id="sparkles-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#808080" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
    </defs>
  </svg>

  <Sparkles
    className="h-4 w-4"
    style={{ stroke: "url(#sparkles-gradient)" }}
  />

  <h5 className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#808080] to-[#808080] bg-clip-text text-transparent">
    AI Explanation
  </h5>
</div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {q.reasoning}
                  </p>
                </div>
              )}
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
