"use client";

import React, { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, CheckSquare } from "lucide-react";

interface QuizQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

 
interface QuizViewProps {
  questions: QuizQuestion[];
  pdfName: string;
  isAnonymous: boolean;
  onSubmit: (answers: { questionId: string; selectedOption: "A" | "B" | "C" | "D" }[]) => void;
}

export default function QuizView({
  questions,
  pdfName,
  isAnonymous,
  onSubmit,
}: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const progressPercent = ((currentIdx + 1) / totalQuestions) * 100;

  const handleOptionSelect = (option: "A" | "B" | "C" | "D") => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = () => {
    // Build array of answers
    const answersArray = questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] || ("A" as const), // Default to A if somehow unanswered
    }));
    onSubmit(answersArray);
  };

  const isCurrentUnanswered = !answers[currentQuestion.id];
  const isLastQuestion = currentIdx === totalQuestions - 1;

  const options = [
    { key: "A" as const, text: currentQuestion.optionA },
    { key: "B" as const, text: currentQuestion.optionB },
    { key: "C" as const, text: currentQuestion.optionC },
    { key: "D" as const, text: currentQuestion.optionD },
  ];


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

     <div className="w-full max-w-2xl mx-auto relative select-none">
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

     {/* Glow */}
<div
  className="absolute inset-0 m-auto w-[1200px] h-[1200px] bg-white/5 blur-[400px] pointer-events-none z-0"
/>
      {/* Outer Container */}
      <div className="relative bg-[#131416] rounded-[24px] p-1.5 border border-[#3E3F42]">

    <div className="w-full max-w-2xl mx-auto bg-[#000000] rounded-[24px] border border-[#343536] dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Quiz Progress Header */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          <span className="truncate max-w-[70%]">{pdfName}</span>
          <span>
            Question {currentIdx + 1} of {totalQuestions}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
    className="h-full rounded-full bg-gradient-to-r from-[#3E0D76] to-[#B66AFC] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quiz Content */}

    
      <div className="p-8">
        {/* Question Text */}
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
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed mb-2">
          {currentQuestion.questionText}
        </h3>
        </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {options.map((opt) => {
            const isSelected = answers[currentQuestion.id] === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleOptionSelect(opt.key)}
                className={`w-full flex items-center gap-4 text-left p-4 rounded-xl border font-medium text-sm transition-all focus:outline-none ${
                  isSelected
                    ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/10 text-violet-900 dark:text-violet-300 font-semibold"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                  isSelected
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                }`}>
                  {opt.key}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <button
            disabled={currentIdx === 0}
            onClick={handlePrev}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 py-2.5 px-4 font-semibold text-sm transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {isLastQuestion ? (
            <button
              disabled={isCurrentUnanswered}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white py-2.5 px-5 font-semibold text-sm transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-600/10"
            >
              <CheckSquare className="h-4 w-4" />
              {isAnonymous ? "Review Results" : "Submit Results"}
            </button>
          ) : (
            <button
              disabled={isCurrentUnanswered}
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:active:bg-zinc-100 dark:text-zinc-900 text-white py-2.5 px-5 font-semibold text-sm transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
    </div>
 
  </div>
)}
