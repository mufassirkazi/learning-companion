"use client";

import React from "react";
import UploadArea from "./UploadArea";
import { ArrowUpCircle, HelpCircle, History, Sparkles, FileText, ChevronRight } from "lucide-react";

interface QuizHistoryItem {
  id: string;
  pdfName: string;
  score: number | null;
  createdAt: Date;
}

interface DashboardProps {
  isPro: boolean;
  userName: string;
  onUpload: (file: File) => void;
  onUpgradeClick: () => void;
  onReviewQuiz: (quizId: string) => void;
  recentQuizzes: QuizHistoryItem[];
  onLogout: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  pdfSize?: string;
  progressMessage?: string;
}

export default function Dashboard({
  isPro,
  userName,
  onUpload,
  onUpgradeClick,
  onReviewQuiz,
  recentQuizzes,
  isUploading = false,
  uploadProgress = 0,
  pdfSize = "",
  progressMessage = "",
}: DashboardProps) {
  // Free users cannot upload another PDF if they already have 1 or more quizzes
  const hasReachedFreeLimit = !isPro && recentQuizzes.length >= 1;

  return (
    <div className="w-full max-w-[1140px] mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1 py-2">
        <div>
          <h2 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
            Welcome, {userName}
            {isPro && (
              <span className="inline-flex items-center rounded-full bg-[#B66AFC]/20 px-2.5 py-0.5 text-xs font-bold text-[#B66AFC]">
                PRO
              </span>
            )}
          </h2>
          <p className="text-sm text-[#8A8F98] mt-1">
            {isPro ? "Enjoy unlimited uploads and adaptive review!" : "Free Tier — 1 PDF Upload Limit"}
          </p>
        </div>

        {!isPro && userName !== "Guest" && (
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 font-semibold text-xs transition-colors shadow-sm focus:outline-none"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Two-Column Grid on Desktop */}
      <div className="flex flex-col lg:flex-row gap-12 items-start w-full">
        
        {/* Left Column: Recent Quizzes */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center gap-2 px-1">
            <History className="h-5 w-5 text-zinc-500" />
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Recent Quizzes
            </h3>
          </div>

          {recentQuizzes.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-400 dark:text-zinc-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No quizzes generated yet.</p>
              <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">
                Upload your first PDF on the right to generate a custom quiz!
              </p>
            </div>
          ) : (
            <div className="bg-[#0A0C10] border border-[#1E1E1E] rounded-2xl overflow-hidden shadow-sm divide-y divide-zinc-900">
              {recentQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-5 hover:bg-zinc-900/20 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-[60%]">
                    <div className="rounded-xl bg-zinc-900 p-2.5 text-zinc-400 border border-zinc-800">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-zinc-50 truncate">
                        {quiz.pdfName}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(quiz.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-zinc-50">
                        {quiz.score !== null ? `${quiz.score} / 5` : "Incomplete"}
                      </span>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                        Score
                      </p>
                    </div>
                    <button
                      onClick={() => onReviewQuiz(quiz.id)}
                      className="flex items-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-2 px-3.5 font-bold text-xs transition-colors focus:outline-none"
                    >
                      Review
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upload Document */}
        <div className="w-full lg:w-[479px] shrink-0 space-y-4">
          <div className="px-1 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Upload New Document
            </h3>
            {!isPro && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {recentQuizzes.length}/1 uploads used
              </span>
            )}
          </div>

          <UploadArea
            onUpload={onUpload}
            isDisabled={hasReachedFreeLimit || isUploading}
            onUpgradeNeeded={onUpgradeClick}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            pdfSize={pdfSize}
            progressMessage={progressMessage}
          />
          
          {hasReachedFreeLimit && (
            <div className="rounded-xl bg-amber-950/10 p-4 text-xs text-amber-400 border border-amber-900/20 flex items-start gap-2.5">
              <HelpCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold">Free Upload Limit Reached</p>
                <p className="mt-0.5 text-zinc-400">
                  You've used your 1 free quiz generation. Upgrade to Quizly Pro to upload unlimited PDFs, generate unlimited quizzes, and unlock adaptive review before every session!
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
