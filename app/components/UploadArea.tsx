"use client";

import React, { useState, useRef, useMemo } from "react";
import { AlertCircle } from "lucide-react";

interface UploadAreaProps {
  onUpload: (file: File) => void;
  isDisabled?: boolean;
  onUpgradeNeeded?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  pdfSize?: string;
  progressMessage?: string;
}

export default function UploadArea({
  onUpload,
  isDisabled = false,
  onUpgradeNeeded,
  isUploading = false,
  uploadProgress = 0,
  pdfSize = "",
  progressMessage = "",
}: UploadAreaProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);

    if (isDisabled) {
      if (onUpgradeNeeded) onUpgradeNeeded();
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5 MB limit.");
      return;
    }

    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (isDisabled) {
      if (onUpgradeNeeded) onUpgradeNeeded();
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isDisabled) {
      if (onUpgradeNeeded) onUpgradeNeeded();
      return;
    }

    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent duplicate triggers if clicking the outer container
    if (isDisabled) {
      if (onUpgradeNeeded) onUpgradeNeeded();
      return;
    }
    fileInputRef.current?.click();
  };

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
    <div className="w-full max-w-[479px] mx-auto relative select-none">
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

      {/* Layer 1: Glow Background Effect (484 x 369px, 10% opacity, 300px blur) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[484px] h-[369px] bg-white/10 blur-[300px] pointer-events-none -z-10" />

      {/* Layer 2: Form Outer Container (479 x 369px, rounded 24px, linear stroke gradient) */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative w-[479px] h-[369px] bg-[#131416] rounded-[24px] p-1.5 border border-[#3e3f42] flex items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragActive ? "scale-102 border-violet-500 shadow-xl shadow-violet-500/10" : ""
        } ${isDisabled ? "opacity-75 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleChange}
        />

        {/* Layer 3: Inner Container (467 x 357px, black, rounded 20px, stroke #343536) */}
        <div className="w-[467px] h-[357px] bg-black rounded-[20px] p-[21px] border border-[#343536] flex items-center justify-center">
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center text-center space-y-5 w-full">
              {/* Upload SVG with Circle Backdrop */}
              <div className="w-[66px] h-[66px] bg-[#1B1B1B] rounded-full flex items-center justify-center shadow-inner">
                {/* Embedded Upload SVG (36 x 35px) */}
                <svg width="36" height="35" viewBox="0 0 39 37" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[36px] h-[35px]">
                  <path d="M19.7249 26.804C14.0957 26.804 13.6627 23.2316 12.0389 21.4995C7.6546 17.4941 2.29599 21.4996 1.53821 24.3683C0.762384 26.2988 0.412362 30.9177 5.21885 33.9488C5.83231 34.2736 7.55719 34.9881 9.54905 35.2479C11.5409 35.5077 17.1629 35.6698 19.7249 35.5615" stroke="white" stroke-width="2.16509"/>
                  <path d="M18.7253 26.804C24.3545 26.804 24.7875 23.2316 26.4113 21.4995C30.7956 17.4941 36.1542 21.4996 36.912 24.3683C37.6878 26.2988 38.0378 30.9177 33.2313 33.9488C32.6179 34.2736 30.893 34.9881 28.9011 35.2479C26.9093 35.5077 21.2873 35.6698 18.7253 35.5615" stroke="white" stroke-width="2.16509"/>
                  <mask id="path-3-inside-1_2442_1049" fill="white">
                    <path d="M3.02832 7.5778C3.02832 3.3927 6.42102 0 10.6061 0H27.3855C31.5706 0 34.9633 3.3927 34.9633 7.5778V20.6766H3.02832V7.5778Z"/>
                  </mask>
                  <path d="M0.863235 7.5778C0.863235 2.19695 5.22527 -2.16509 10.6061 -2.16509H27.3855C32.7664 -2.16509 37.1284 2.19695 37.1284 7.5778H32.7983C32.7983 4.58844 30.3749 2.16509 27.3855 2.16509H10.6061C7.61676 2.16509 5.19341 4.58844 5.19341 7.5778H0.863235ZM5.19341 7.5778M34.9633 20.6766H3.02832H34.9633M0.863235 20.6766V7.5778C0.863235 2.19695 5.22527 -2.16509 10.6061 -2.16509V2.16509C7.61676 2.16509 5.19341 4.58844 5.19341 7.5778V20.6766H0.863235ZM27.3855 -2.16509C32.7664 -2.16509 37.1284 2.19695 37.1284 7.5778V20.6766H32.7983V7.5778C32.7983 4.58844 30.3749 2.16509 27.3855 2.16509V-2.16509Z" fill="white" mask="url(#path-3-inside-1_2442_1049)"/>
                  <path d="M17.9673 19.8105C17.9673 20.4084 18.4519 20.8931 19.0498 20.8931C19.6477 20.8931 20.1323 20.4084 20.1323 19.8105L19.0498 19.8105L17.9673 19.8105ZM19.8153 6.81234C19.3925 6.38958 18.7071 6.38958 18.2843 6.81234L11.3951 13.7016C10.9723 14.1244 10.9723 14.8098 11.3951 15.2325C11.8178 15.6553 12.5033 15.6553 12.926 15.2325L19.0498 9.10876L25.1736 15.2325C25.5964 15.6553 26.2818 15.6553 26.7045 15.2325C27.1273 14.8098 27.1273 14.1244 26.7045 13.7016L19.8153 6.81234ZM19.0498 19.8105L20.1323 19.8105L20.1323 7.57781L19.0498 7.57781L17.9673 7.57781L17.9673 19.8105L19.0498 19.8105Z" fill="white"/>
                </svg>
              </div>

              {/* Uploading Text & Progress Message */}
              <div className="space-y-1">
                <h4 className="font-work-sans text-[16px] font-medium text-white tracking-wide">
                  Uploading
                </h4>
                <p className="font-work-sans text-[14px] font-medium text-[#8B8F97]">
                  {progressMessage}
                </p>
              </div>

              {/* Progress Bar & Details Container */}
              <div className="w-[251px] flex flex-col space-y-2 mt-1">
                {/* Gradient Progress Bar */}
                <div className="w-[251px] h-[10px] bg-[#292929] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#3E0D76] to-[#B66AFC] transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {/* Size & Percentage */}
                <div className="flex justify-between w-full font-work-sans text-[14px] font-normal text-[#8B8F97]">
                  <span>{pdfSize}</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            </div>
          ) : (
            /* Layer 4: Dashed Area (423 x 316px, transparent, dashed stroke #343536) */
            <div className="w-[423px] h-[316px] border border-dashed border-[#343536] rounded-[16px] flex flex-col items-center justify-center text-center p-6 space-y-5">
              
              {/* Upload SVG with Circle Backdrop */}
              <div className="flex flex-col items-center">
                <div className="w-[66px] h-[66px] bg-[#1B1B1B] rounded-full flex items-center justify-center shadow-inner">
                  {/* Embedded Upload SVG (36 x 35px) */}
                  <svg width="36" height="35" viewBox="0 0 39 37" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[36px] h-[35px]">
                    <path d="M19.7249 26.804C14.0957 26.804 13.6627 23.2316 12.0389 21.4995C7.6546 17.4941 2.29599 21.4996 1.53821 24.3683C0.762384 26.2988 0.412362 30.9177 5.21885 33.9488C5.83231 34.2736 7.55719 34.9881 9.54905 35.2479C11.5409 35.5077 17.1629 35.6698 19.7249 35.5615" stroke="white" stroke-width="2.16509"/>
                    <path d="M18.7253 26.804C24.3545 26.804 24.7875 23.2316 26.4113 21.4995C30.7956 17.4941 36.1542 21.4996 36.912 24.3683C37.6878 26.2988 38.0378 30.9177 33.2313 33.9488C32.6179 34.2736 30.893 34.9881 28.9011 35.2479C26.9093 35.5077 21.2873 35.6698 18.7253 35.5615" stroke="white" stroke-width="2.16509"/>
                    <mask id="path-3-inside-1_2442_1049" fill="white">
                      <path d="M3.02832 7.5778C3.02832 3.3927 6.42102 0 10.6061 0H27.3855C31.5706 0 34.9633 3.3927 34.9633 7.5778V20.6766H3.02832V7.5778Z"/>
                    </mask>
                    <path d="M0.863235 7.5778C0.863235 2.19695 5.22527 -2.16509 10.6061 -2.16509H27.3855C32.7664 -2.16509 37.1284 2.19695 37.1284 7.5778H32.7983C32.7983 4.58844 30.3749 2.16509 27.3855 2.16509H10.6061C7.61676 2.16509 5.19341 4.58844 5.19341 7.5778H0.863235ZM5.19341 7.5778M34.9633 20.6766H3.02832H34.9633M0.863235 20.6766V7.5778C0.863235 2.19695 5.22527 -2.16509 10.6061 -2.16509V2.16509C7.61676 2.16509 5.19341 4.58844 5.19341 7.5778V20.6766H0.863235ZM27.3855 -2.16509C32.7664 -2.16509 37.1284 2.19695 37.1284 7.5778V20.6766H32.7983V7.5778C32.7983 4.58844 30.3749 2.16509 27.3855 2.16509V-2.16509Z" fill="white" mask="url(#path-3-inside-1_2442_1049)"/>
                    <path d="M17.9673 19.8105C17.9673 20.4084 18.4519 20.8931 19.0498 20.8931C19.6477 20.8931 20.1323 20.4084 20.1323 19.8105L19.0498 19.8105L17.9673 19.8105ZM19.8153 6.81234C19.3925 6.38958 18.7071 6.38958 18.2843 6.81234L11.3951 13.7016C10.9723 14.1244 10.9723 14.8098 11.3951 15.2325C11.8178 15.6553 12.5033 15.6553 12.926 15.2325L19.0498 9.10876L25.1736 15.2325C25.5964 15.6553 26.2818 15.6553 26.7045 15.2325C27.1273 14.8098 27.1273 14.1244 26.7045 13.7016L19.8153 6.81234ZM19.0498 19.8105L20.1323 19.8105L20.1323 7.57781L19.0498 7.57781L17.9673 7.57781L17.9673 19.8105L19.0498 19.8105Z" fill="white"/>
                  </svg>
                </div>
              </div>

              {/* Choose a File Text (Work Sans, 16px, medium, white, 2px padding) */}
              <div className="space-y-1">
                <h4 className="font-work-sans text-[16px] font-medium text-white p-[2px] tracking-wide">
                  Choose a File
                </h4>
                {/* Files up to 5MB (Work Sans, 14px, medium, color 8B8F97) */}
                <p className="font-work-sans text-[14px] font-medium text-[#8B8F97]">
                  Files up to 5MB
                </p>
              </div>

              {/* Upload Button (Fill white, black text, 16px, medium, px 20px, py 10px) */}
              <button
                onClick={onButtonClick}
                className="font-work-sans text-[16px] font-medium text-black bg-white px-[20px] py-[10px] rounded-[12px] hover:bg-zinc-200 transition-all duration-200 active:scale-98 focus:outline-none shadow-md"
              >
                Upload Your Study Material
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-950/20 p-4 text-sm text-red-400 border border-red-900/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
