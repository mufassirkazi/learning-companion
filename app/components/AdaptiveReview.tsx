"use client";

import React, { useState, useEffect } from "react";
import { AdaptiveReviewQuestion } from "../actions/quiz";
import { Sparkles, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface AdaptiveReviewProps {
  question: AdaptiveReviewQuestion;
  onSubmitAnswer: (selectedOption: "A" | "B" | "C" | "D") => Promise<boolean>;
  onComplete: () => void;
}

export default function AdaptiveReview({
  question,
  onSubmitAnswer,
  onComplete,
}: AdaptiveReviewProps) {
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [isSubmitted, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleOptionSelect = (option: "A" | "B" | "C" | "D") => {
    if (isSubmitted !== null) return;
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!selectedOption || loading || isSubmitted !== null) return;
    setLoading(true);

    try {
      const correct = await onSubmitAnswer(selectedOption);
      setIsCorrect(correct);

      // Start countdown to auto-continue
      const delay = correct ? 3 : 8; // 3 seconds if correct, 8 seconds if incorrect (to let them read explanation)
      setCountdown(delay);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  const options = [
    { key: "A" as const, text: question.optionA },
    { key: "B" as const, text: question.optionB },
    { key: "C" as const, text: question.optionC },
    { key: "D" as const, text: question.optionD },
  ];

  return (
<div
  className="w-full max-w-2xl mx-auto rounded-[32px] p-[1px] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
  style={{
    background: "#232425",
  }}
>
  <div
    className="rounded-[32px] overflow-hidden p-8"
    style={{
      background: "linear-gradient(180deg, #000000 0%, #000000 100%)",
    }}
  >
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-6">
        <div className="rounded-full bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Before we begin...
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Let's revisit something you missed last time.
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
         <div
   className="rounded-[16px] p-[1px] mb-8"
   style={{
    background:
      "linear-gradient(-270deg, #191919 0%, #413571 100%)",
   }}
   >
   <div
    className="rounded-[15px] p-4"
    style={{
      background:
        "linear-gradient(70deg, #000000 38%, #1D0638 71%, #3E0D76 100%)",
    }}
   > 
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-relaxed">
          {question.questionText}
        </h3>
      </div>
      </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;
          const isCorrectAnswer = question.correctOption === opt.key;
          
          let optionStyle = "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/30";
          if (isSelected) {
            optionStyle = "border-violet-500 bg-violet-50/50 dark:bg-violet-950/10 text-violet-900 dark:text-violet-300";
          }

          if (isSubmitted !== null) {
            if (isCorrectAnswer) {
              optionStyle = "border-green-500 bg-green-50/50 dark:bg-green-950/10 text-green-900 dark:text-green-300";
            } else if (isSelected) {
              optionStyle = "border-red-500 bg-red-50/50 dark:bg-red-950/10 text-red-900 dark:text-red-300";
            } else {
              optionStyle = "border-zinc-100 dark:border-zinc-800 opacity-50";
            }
          }

          return (
            <button
              key={opt.key}
              disabled={isSubmitted !== null}
              onClick={() => handleOptionSelect(opt.key)}
              className={`w-full flex items-center gap-4 text-left p-4 rounded-xl border font-medium text-sm transition-all focus:outline-none ${optionStyle}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                isSelected 
                  ? "bg-violet-600 border-violet-600 text-white" 
                  : isSubmitted !== null && isCorrectAnswer
                    ? "bg-green-600 border-green-600 text-white"
                    : isSubmitted !== null && isSelected && !isCorrectAnswer
                      ? "bg-red-600 border-red-600 text-white"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
              }`}>
                {opt.key}
              </span>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback & Actions */}
      {isSubmitted === null ? (
        <div className="flex justify-end">
          <button
            disabled={!selectedOption || loading}
            onClick={handleSubmit}
            className="rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:active:bg-zinc-100 dark:text-zinc-900 text-white py-3 px-6 font-semibold text-sm transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? "Checking..." : "Submit Answer"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6 border-t border-zinc-100 dark:border-zinc-800 pt-6 animate-in fade-in duration-300">
          {/* Correction Banner */}
          <div className="flex items-start gap-3">
            {isSubmitted ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-green-700 dark:text-green-400">
                    Nice! You remembered it.
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Excellent progress. Let's start your new quiz now.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-red-700 dark:text-red-400">
                    Not quite.
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    The correct answer is <span className="font-bold text-zinc-900 dark:text-zinc-50">Option {question.correctOption}</span>.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Reasoning / AI Explanation (always shown, so they can reinforce learning) */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-5 border border-zinc-100 dark:border-zinc-800/80">
            <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              AI Explanation
            </h5>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {question.reasoning}
            </p>
          </div>

          {/* Continue Action */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Continuing automatically in {countdown}s...
            </span>
            <button
              onClick={onComplete}
              className="rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:active:bg-zinc-100 dark:text-zinc-900 text-white py-2.5 px-5 font-semibold text-sm transition-colors focus:outline-none flex items-center gap-2"
            >
              Continue to Quiz
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
