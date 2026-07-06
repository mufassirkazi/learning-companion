"use client";

import React from "react";
import { useTiun } from "../providers/TiunProvider";
import { X, Check, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { checkout } = useTiun();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
<div
  className="relative w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
  style={{
    background: "linear-gradient(70deg, #000000 0%, #000000 100%)",
    borderColor: "#232425",
  }}
>        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="inline-flex items-center justify-center rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 mb-4">
            <img
  src="/assets/pro-version.svg"
  alt="Quizly"
  className="h-10 w-auto flex-shrink-0"
/>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Upgrade to Quizly Pro
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Master any document with unlimited AI quizzes and adaptive review.
          </p>
        </div>

        {/* Price Tag */}
       <div
  className="my-6 rounded-xl p-[1px]"
  style={{
    background: "linear-gradient(-270deg, #191919 0%, #413571 100%)",
  }}
>
  <div
    className="rounded-[11px] p-4 text-center"
    style={{
      background:
        "linear-gradient(70deg, #000000 38%, #1D0638 71%, #3E0D76 100%)",
    }}
  >
    <span className="text-4xl font-extrabold text-white">
      $5
    </span>
    <span className="font-medium text-[#B6B6B6]">
      /month
    </span>
  </div>
</div>

        {/* Benefits List */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex items-center justify-center">
  <Check className="h-5 w-5 text-[#8023FE]" strokeWidth={2.5} />
</div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Unlimited PDF uploads (up to 5MB each)
            </p>
          </div>
          <div className="flex items-start gap-3">
           <div className="mt-0.5 flex items-center justify-center">
  <Check className="h-5 w-5 text-[#8023FE]" strokeWidth={2.5} />
</div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Unlimited custom quiz generations
            </p>
          </div>
          <div className="flex items-start gap-3">
           <div className="mt-0.5 flex items-center justify-center">
  <Check className="h-5 w-5 text-[#8023FE]" strokeWidth={2.5} />
</div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Adaptive review before every new quiz
            </p>
          </div>
          <div className="flex items-start gap-3">
           <div className="mt-0.5 flex items-center justify-center">
  <Check className="h-5 w-5 text-[#8023FE]" strokeWidth={2.5} />
</div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Detailed AI reasoning for every answer
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => checkout()}
            className="w-full rounded-xl bg-violet-600 py-3 px-4 text-center text-sm font-semibold text-white hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-lg shadow-violet-600/10 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Upgrade Now
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-200 bg-transparent py-3 px-4 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
