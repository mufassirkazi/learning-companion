"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTiun } from "./providers/TiunProvider";
import {
  uploadPDFAndGenerateQuiz,
  submitQuizAnswers,
  claimAnonymousQuiz,
  getRecentQuizzes,
  getQuizResults,
  getAdaptiveReviewQuestion,
  submitAdaptiveReviewAnswer,
  deleteQuiz,
  AdaptiveReviewQuestion,
  QuizResults,
} from "./actions/quiz";

import Dashboard from "./components/Dashboard";
import UploadArea from "./components/UploadArea";
import QuizView from "./components/QuizView";
import AdaptiveReview from "./components/AdaptiveReview";
import ResultsView from "./components/ResultsView";
import UpgradeModal from "./components/UpgradeModal";

import { Sparkles, FileText, ArrowRight, HelpCircle, Loader2 } from "lucide-react";

type Screen =
  | "LANDING"
  | "DASHBOARD"
  | "LOADING_UPLOAD"
  | "ADAPTIVE_REVIEW"
  | "QUIZ"
  | "RESULTS"
  | "REVIEW_PAST";

export default function Home() {
  const {
    isAuthenticated,
    user,
    isPro,
    loading: tiunLoading,
    login,
    logout,
    getVerificationToken,
  } = useTiun();

  // Screen state
  const [activeScreen, setActiveScreen] = useState<Screen>("LANDING");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // User details
  const [anonUserId, setAnonUserId] = useState<string>("");

  // Quiz taking state
  const [currentQuizId, setCurrentQuizId] = useState<string>("");
  const [currentPdfName, setCurrentPdfName] = useState<string>("");
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentResults, setCurrentResults] = useState<QuizResults | null>(null);

  // Upload state
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgressMessage, setUploadProgressMessage] = useState("Reading your document...");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSizeStr, setUploadSizeStr] = useState("");

  // Adaptive review state
  const [reviewQuestion, setReviewQuestion] = useState<AdaptiveReviewQuestion | null>(null);
  const [hasShownRecap, setHasShownRecap] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  // Recent Quizzes list
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);

  // Pending answers to submit after login
  const [pendingAnswers, setPendingAnswers] = useState<any[] | null>(null);

  // 1. Initialize anonymous user ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("quizly_anon_id");
      if (!id) {
        id = "anon_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("quizly_anon_id", id);
      }
      setAnonUserId(id);
    }
  }, []);

  // 2. Load recent quizzes based on auth state
  const loadRecentQuizzes = useCallback(async () => {
    const activeUserId = isAuthenticated ? (user?.userId || "") : anonUserId;
    if (!activeUserId) return;

    setQuizzesLoading(true);
    try {
      const token = isAuthenticated ? await getVerificationToken() : undefined;
      const res = await getRecentQuizzes(activeUserId, token || undefined);
      if (res.success && res.quizzes) {
        setRecentQuizzes(res.quizzes);
      }
    } catch (err) {
      console.error("Error loading recent quizzes:", err);
    } finally {
      setQuizzesLoading(false);
    }
  }, [isAuthenticated, user, anonUserId, getVerificationToken]);

  useEffect(() => {
    if (anonUserId) {
      loadRecentQuizzes();
    }
  }, [anonUserId, isAuthenticated, loadRecentQuizzes]);

  // 3. Set initial screen
  useEffect(() => {
    if (tiunLoading) return;

    if (isAuthenticated) {
      setActiveScreen("DASHBOARD");
    } else {
      setActiveScreen("LANDING");
    }
  }, [isAuthenticated, tiunLoading]);

  // 3.5. Trigger adaptive review recap modal upon entering the dashboard
  useEffect(() => {
    const checkAndShowRecap = async () => {
      if (tiunLoading || !isAuthenticated || !isPro || hasShownRecap || activeScreen !== "DASHBOARD") return;

      setHasShownRecap(true); // Mark as shown immediately to prevent double triggers
      
      try {
        const token = await getVerificationToken();
        const res = await getAdaptiveReviewQuestion(user?.userId || "", token || undefined);
        
        if (res.success && res.question) {
          setReviewQuestion(res.question);
          setIsRecapOpen(true);
        }
      } catch (err) {
        console.error("Error checking adaptive review recap:", err);
      }
    };

    checkAndShowRecap();
  }, [activeScreen, isAuthenticated, isPro, tiunLoading, hasShownRecap, user, getVerificationToken]);

  // 4. Progress message cycler for upload
  useEffect(() => {
    if (activeScreen !== "LOADING_UPLOAD") return;

    setUploadProgressMessage("Reading through...");

    const t1 = setTimeout(() => {
      setUploadProgressMessage("Extracting key insights...");
    }, 2000);

    const t2 = setTimeout(() => {
      setUploadProgressMessage("Creating...");
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeScreen]);

  // 5. Handle post-login claiming of anonymous quiz history
  useEffect(() => {
    const claimHistoryAndSubmit = async () => {
      if (!isAuthenticated || !pendingAnswers || !currentQuizId || !anonUserId) return;


      setActiveScreen("LOADING_UPLOAD");
  setUploadProgressMessage("Preparing your results...");

      const token = await getVerificationToken();
      if (!token) return;

      setQuizzesLoading(true);
      try {
        // Check if the old account already has quizzes before we claim the new one
        const checkRes = await getRecentQuizzes(user?.userId || "", token);
        const hadQuizzes = checkRes.success && checkRes.quizzes && checkRes.quizzes.length > 0;

        // Claim the anonymous quiz first
        await claimAnonymousQuiz(anonUserId, token);

        // Submit the pending answers under their new account
        const res = await submitQuizAnswers(currentQuizId, user?.userId || "", pendingAnswers);
        if (res.success && res.results) {
          setCurrentResults(res.results);
          setPendingAnswers(null);
          await loadRecentQuizzes();

          // If they signed into a Free old account with previous history, trigger upgrade modal!
          if (!isPro && hadQuizzes) {
            setIsUpgradeModalOpen(true);
            setActiveScreen("DASHBOARD");
          } else {
            setActiveScreen("RESULTS");
          }
        }
      } catch (err) {
        console.error("Error claiming and submitting:", err);
      } finally {
        setQuizzesLoading(false);
      }
    };

    claimHistoryAndSubmit();
  }, [isAuthenticated, pendingAnswers, currentQuizId, anonUserId, user, getVerificationToken, loadRecentQuizzes]);

  // Trigger actual PDF parsing and quiz generation
  const startQuizGeneration = async (file: File) => {
    setActiveScreen("LOADING_UPLOAD");
    setUploadError(null);

    try {
      const token = isAuthenticated ? await getVerificationToken() : undefined;
      const activeUserId = isAuthenticated ? (user?.userId || "") : anonUserId;

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadPDFAndGenerateQuiz(formData, activeUserId, token || undefined);

      if (res.success && res.quizId && res.questions) {
        setCurrentQuizId(res.quizId);
        setCurrentPdfName(file.name);
        setCurrentQuestions(res.questions);
        setActiveScreen("QUIZ");
        setUploadingFile(null);
      } else {
        setUploadError(res.error || "Failed to generate quiz.");
        setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An unexpected error occurred.");
      setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
    }
  };

  // 6. Handle PDF file selection
  const handlePDFUpload = async (file: File) => {
    // PDF upload goes straight to generation now, as recap is handled on dashboard entry
    await startQuizGeneration(file);
  };

  // 7. Handle adaptive review submission
  const handleAdaptiveReviewSubmit = async (selectedOption: "A" | "B" | "C" | "D"): Promise<boolean> => {
    if (!reviewQuestion) return false;
    try {
      const token = await getVerificationToken();
      const res = await submitAdaptiveReviewAnswer(
        user?.userId || "",
        reviewQuestion.id,
        selectedOption,
        token || undefined
      );
      return !!res.isCorrect;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // 8. Handle quiz submission
  const handleQuizSubmit = async (answers: { questionId: string; selectedOption: "A" | "B" | "C" | "D" }[]) => {
    if (isAnonymous) {
      // Gate the results with Tiun auth
      setPendingAnswers(answers);
      login();
    } else {
      // Logged in user, submit directly
      setActiveScreen("LOADING_UPLOAD"); // reuse loading screen for evaluating
      setUploadProgressMessage("Evaluating answers...");

      try {
        const res = await submitQuizAnswers(currentQuizId, user?.userId || "", answers);
        if (res.success && res.results) {
          setCurrentResults(res.results);
          setActiveScreen("RESULTS");
          loadRecentQuizzes();
        } else {
          alert(res.error || "Failed to submit answers.");
          setActiveScreen("DASHBOARD");
        }
      } catch (err) {
        console.error(err);
        setActiveScreen("DASHBOARD");
      }
    }
  };

  // 9. Review a past quiz from the dashboardsssgi
  const handleReviewPastQuiz = async (quizId: string) => {
    setActiveScreen("LOADING_UPLOAD");
    setUploadProgressMessage("Loading quiz history...");

    try {
      const token = isAuthenticated ? await getVerificationToken() : undefined;
      const activeUserId = isAuthenticated ? (user?.userId || "") : anonUserId;

      const res = await getQuizResults(quizId, activeUserId, token || undefined);
      if (res.success && res.results) {
        setCurrentResults(res.results);
        setActiveScreen("REVIEW_PAST");
      } else {
        alert(res.error || "Failed to load past results.");
        setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
      }
    } catch (err) {
      console.error(err);
      setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
    }
  };

  const handleContinueQuiz = async (quizId: string, pdfName: string) => {
    setActiveScreen("LOADING_UPLOAD");
    setUploadProgressMessage("Resuming your quiz...");

    try {
      const token = isAuthenticated ? await getVerificationToken() : undefined;
      const activeUserId = isAuthenticated ? (user?.userId || "") : anonUserId;

      const res = await getQuizResults(quizId, activeUserId, token || undefined);
      if (res.success && res.results) {
        setCurrentQuizId(quizId);
        setCurrentPdfName(pdfName);
        setCurrentQuestions(res.results.questions);
        setActiveScreen("QUIZ");
      } else {
        alert(res.error || "Failed to resume quiz.");
        setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
      }
    } catch (err) {
      console.error(err);
      setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
    }
  };

  const handleStartOver = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to discard this incomplete quiz and start a new one?")) return;

    setActiveScreen("LOADING_UPLOAD");
    setUploadProgressMessage("Starting over...");

    try {
      const token = isAuthenticated ? await getVerificationToken() : undefined;
      const activeUserId = isAuthenticated ? (user?.userId || "") : anonUserId;

      const res = await deleteQuiz(quizId, activeUserId, token || undefined);
      if (res.success) {
        await loadRecentQuizzes();
        setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
      } else {
        alert(res.error || "Failed to start over.");
        setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
      }
    } catch (err) {
      console.error(err);
      setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      const newId = "anon_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("quizly_anon_id", newId);
      setAnonUserId(newId);
    }
    await logout();
    setRecentQuizzes([]);
  };

  const isAnonymous = !isAuthenticated;

  // Render Loader if Tiun is initializing
  if (tiunLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-4">
          Loading Quizly...
        </p>
      </div>
    );
  }

  const incompleteQuiz = recentQuizzes.find((q) => q.score === null);

  const isQuizScreen = activeScreen === "QUIZ";

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#07080A]">
      {/* Navbar */}
      <header className={`w-full ${isQuizScreen ? "max-w-[689px]" : "max-w-[1200px]"} mx-auto px-6 pt-6 sticky top-0 z-40 bg-transparent transition-all duration-300`}>
        <div className="bg-[#000000] border border-[#1E1E1E] rounded-[18px] px-6 h-16 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            {/* Main Logo SVG Wrapper */}
            <img
  src="/assets/logo.svg"
  alt="Quizly"
  className="h-10 w-auto flex-shrink-0"
/>
          </div>

          <div className="flex items-center gap-4">
            {isAnonymous ? (
              <div className="flex items-center gap-4">
                {/* Guest indicator */}
                <div className="flex items-center gap-2 text-[#8A8F98]">
                  <img src="/assets/guest-icon.png" alt="Guest" className="w-[18px] h-[18px] opacity-80" />
                  <span className="font-work-sans text-sm font-medium">Guest</span>
                </div>
                {/* Sign Up Button */}
                <button
                  onClick={() => login()}
                  className="rounded-xl border border-white hover:bg-white/10 text-white py-2 px-5 font-work-sans font-medium text-sm transition-colors focus:outline-none"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline truncate max-w-[150px]">
                  {user?.email}
                </span>
                <button
                  onClick={() => handleLogout()}
                  className="rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 py-1.5 px-3 font-medium text-xs transition-colors focus:outline-none"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${isQuizScreen ? "py-4 max-w-[689px]" : "py-12 max-w-[1140px]"} w-full mx-auto justify-center transition-all duration-300`}>
        {activeScreen === "LANDING" && (
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Left Side: Logo, Heading and Subheading */}
            <div className="flex-1 flex flex-col items-start text-left max-w-2xl">
              {/* Heading (Poppins, semibold, 48px, white, 40px padding bottom) */}
              <h1 className="font-poppins text-[40px] sm:text-[40px] font-semibold text-white leading-tight pb-[24px] tracking-tight">
                The AI Quiz Generator <br/> That Tests & Finds What <br></br>You Don't Know
              </h1>
              
              {/* Subheading (Work Sans, 18px, leading 24px, color 8A8F98, medium) */}
              <p className="font-work-sans text-[18px] leading-[24px] font-medium text-[#8A8F98]">
                Stop rereading your notes. Upload a PDF and Quizly turns it into a 5-question quiz with instant feedback on your weak spots.
              </p>
            </div>

            {/* Right Side: Upload Area / Continue Card / Lock Card */}
            <div className="w-full max-w-[479px] shrink-0">
              {incompleteQuiz ? (
                <div className="relative w-[479px] h-[369px] bg-[#131416] rounded-[24px] p-1.5 border border-[#3e3f42] flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-[467px] h-[357px] bg-black rounded-[20px] p-[24px] border border-[#343536] flex flex-col items-center justify-center text-center space-y-5">
                    <h3 className="font-work-sans text-[20px] font-bold text-white">
                      Continue where you left off?
                    </h3>
                    <p className="font-work-sans text-[14px] font-medium text-[#8B8F97] max-w-[320px] leading-relaxed">
                      You have an incomplete quiz from your last session: <span className="font-bold text-white">"{incompleteQuiz.pdfName}"</span>.
                    </p>
                    <div className="flex flex-col gap-3 pt-2 w-full max-w-[280px]">
                      <button
                        onClick={() => handleContinueQuiz(incompleteQuiz.id, incompleteQuiz.pdfName)}
                        className="font-work-sans text-[16px] font-medium text-black bg-white py-[10px] rounded-[12px] hover:bg-zinc-200 transition-all duration-200 active:scale-98 focus:outline-none shadow-md"
                      >
                        Continue Quiz
                      </button>
                      <button
                        onClick={() => handleStartOver(incompleteQuiz.id)}
                        className="font-work-sans text-[14px] font-medium text-[#8B8F97] hover:text-white py-[8px] rounded-[12px] hover:bg-zinc-900/50 transition-all duration-200 focus:outline-none"
                      >
                        Start Over (Delete)
                      </button>
                    </div>
                  </div>
                </div>
              ) : recentQuizzes.length >= 1 ? (
                <div className="relative w-[479px] h-[369px] bg-[#131416] rounded-[24px] p-1.5 border border-[#3e3f42] flex items-center justify-center">
                  <div className="w-[467px] h-[357px] bg-black rounded-[20px] p-[24px] border border-[#343536] flex flex-col items-center justify-center text-center space-y-5">
                    <h3 className="font-work-sans text-[20px] font-bold text-white">
                      Your results are locked!
                    </h3>
                    <p className="font-work-sans text-[14px] font-medium text-[#8B8F97] max-w-[320px] leading-relaxed">
                      Create a free account to unlock your results, view detailed AI explanations, and save your learning history.
                    </p>
                    <button
                      onClick={() => login()}
                      className="font-work-sans text-[16px] font-medium text-black bg-white px-[20px] py-[10px] rounded-[12px] hover:bg-zinc-200 transition-all duration-200 active:scale-98 focus:outline-none shadow-md w-full max-w-[280px]"
                    >
                      Create Free Account
                    </button>
                  </div>
                </div>
              ) : (
                <UploadArea
                  onUpload={handlePDFUpload}
                  isDisabled={isUploading}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  pdfSize={uploadSizeStr}
                  progressMessage={uploadProgressMessage}
                />
              )}
            </div>

            {uploadError && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-red-950/20 p-4 text-sm text-red-400 border border-red-900/30">
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {activeScreen === "DASHBOARD" && (
          incompleteQuiz ? (
            <div className="w-full max-w-lg mx-auto py-12">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-md text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Continue where you left off?
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  You have an incomplete quiz from your last session: <span className="font-bold text-zinc-800 dark:text-zinc-200">"{incompleteQuiz.pdfName}"</span>.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => handleContinueQuiz(incompleteQuiz.id, incompleteQuiz.pdfName)}
                    className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-3 px-4 font-semibold text-sm transition-colors shadow-lg shadow-violet-600/10 focus:outline-none"
                  >
                    Continue Quiz
                  </button>
                  <button
                    onClick={() => handleStartOver(incompleteQuiz.id)}
                    className="w-full rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 py-2.5 px-4 font-semibold text-sm transition-colors focus:outline-none"
                  >
                    Start Over (Delete)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Dashboard
              isPro={isPro}
              userName={user?.email?.split("@")[0] || "User"}
              onUpload={handlePDFUpload}
              onUpgradeClick={() => setIsUpgradeModalOpen(true)}
              onReviewQuiz={handleReviewPastQuiz}
              recentQuizzes={recentQuizzes}
              onLogout={handleLogout}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              pdfSize={uploadSizeStr}
              progressMessage={uploadProgressMessage}
            />
          )
        )}

        {activeScreen === "LOADING_UPLOAD" && (
          <div className="flex flex-col items-center justify-center text-center py-16 animate-in fade-in duration-300">
            <Loader2 className="h-12 w-12 text-violet-600 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {uploadProgressMessage}
            </h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Please wait while we process your request.
            </p>
          </div>
        )}

        {activeScreen === "QUIZ" && (
          <QuizView
            questions={currentQuestions}
            pdfName={currentPdfName}
            isAnonymous={isAnonymous}
            onSubmit={handleQuizSubmit}
          />
        )}

        {(activeScreen === "RESULTS" || activeScreen === "REVIEW_PAST") && currentResults && (
          <ResultsView
            results={currentResults}
            isPro={isPro}
            onUploadNew={() => {
              setActiveScreen(isAuthenticated ? "DASHBOARD" : "LANDING");
            }}
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E1E1E] py-8 text-xs text-zinc-400 dark:text-zinc-500 mt-12 bg-[#07080A]">
        <div className="max-w-[1140px] w-full mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Quizly SaaS. All rights reserved.</p>
          <p>Built with Next.js, OpenAI, and Tiun SDK.</p>
        </div>
      </footer>

      {/* Global Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Pro Adaptive Review Recap Modal */}
      {isRecapOpen && reviewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl">
            <AdaptiveReview
              question={reviewQuestion}
              onSubmitAnswer={handleAdaptiveReviewSubmit}
              onComplete={() => {
                setIsRecapOpen(false);
                setReviewQuestion(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
