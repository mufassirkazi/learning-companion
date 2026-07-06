"use server";

import { db } from "../lib/db";
import { parsePDF } from "../lib/pdf";
import { generateQuizFromText, GeneratedQuestion } from "../lib/openai";
import { verifyTiunToken } from "../lib/tiun-server";
import { fallbackDb } from "../lib/fallback-db";

// Helper to check if database error is a connection failure
function isConnectionError(error: any): boolean {
  const msg = error?.message || "";
  return (
    msg.includes("ENOTFOUND") ||
    msg.includes("DatabaseNotReachable") ||
    msg.includes("Can't reach database") ||
    msg.includes("P1001") ||
    msg.includes("P1003") ||
    msg.includes("P2024") ||
    msg.includes("Failed to connect")
  );
}

// Helper to sync user state from Tiun token
async function syncUser(token?: string): Promise<{ userId: string; isPro: boolean } | null> {
  if (!token) return null;
  const verification = await verifyTiunToken(token);
  if (!verification.isAuthenticated || !verification.userInfo) {
    return null;
  }

  const { userId, email, productAccess } = verification.userInfo;
  const proProductId = process.env.NEXT_PUBLIC_TIUN_PRODUCT_ID || "p-test-pro";
  const isPro =
    productAccess.includes(proProductId) ||
    productAccess.includes("p-test-pro") ||
    productAccess.includes("p-live-pro");

  try {
    // Upsert user in db
    const user = await db.user.upsert({
      where: { id: userId },
      update: { email, isPro },
      create: { id: userId, email, isPro },
    });
    return { userId: user.id, isPro: user.isPro };
  } catch (err) {
    if (isConnectionError(err)) {
      console.warn("⚠️ DATABASE FALLBACK: Syncing user locally.");
      fallbackDb.upsertUser(userId, email, isPro);
      return { userId, isPro };
    }
    throw err;
  }
}

export interface QuizUploadResult {
  success: boolean;
  error?: string;
  quizId?: string;
  questions?: {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  }[];
}

export async function uploadPDFAndGenerateQuiz(
  formData: FormData,
  clientUserId: string,
  tiunToken?: string
): Promise<QuizUploadResult> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file uploaded." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File exceeds 5 MB size limit." };
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return { success: false, error: "Only PDF files are allowed." };
    }

    // 1. Determine user and tier
    let userId = clientUserId;
    let isPro = false;

    if (tiunToken) {
      const synced = await syncUser(tiunToken);
      if (synced) {
        userId = synced.userId;
        isPro = synced.isPro;
      }
    }

    // 2. Check limits
    if (!isPro) {
      const isAnon = userId.startsWith("anon_");

      try {
        if (isAnon) {
          // Anonymous users are allowed exactly ONE complete quiz
          const quizCount = await db.quiz.count({ where: { userId } });
          if (quizCount >= 1) {
            return {
              success: false,
              error: "Anonymous users are allowed exactly one quiz. Please sign up for a free account!",
            };
          }
        } else {
          // Free users cannot generate another quiz
          const quizCount = await db.quiz.count({ where: { userId } });
          if (quizCount >= 1) {
            return {
              success: false,
              error: "Free tier limit reached. Please upgrade to Pro for unlimited quiz generations!",
            };
          }
        }
      } catch (err) {
        if (isConnectionError(err)) {
          console.warn("⚠️ DATABASE FALLBACK: Checking quiz limits locally.");
          const count = fallbackDb.getQuizCount(userId);
          if (count >= 1) {
            return {
              success: false,
              error: isAnon
                ? "Anonymous users are allowed exactly one quiz. Please sign up for a free account!"
                : "Free tier limit reached. Please upgrade to Pro for unlimited quiz generations!",
            };
          }
        } else {
          throw err;
        }
      }
    }

    // 3. Parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";
    try {
      text = await parsePDF(buffer);
    } catch (parseErr) {
      console.warn("⚠️ PDF parsing failed, falling back to topic-based generation:", parseErr);
    }

    if (!text || text.trim().length < 50) {
      // Intelligently extract topic from file name (e.g., "History_of_Rome.pdf" -> "History of Rome")
      const cleanName = file.name
        .replace(/\.pdf$/i, "")
        .replace(/[_-]/g, " ")
        .replace(/\d+/g, "") // remove numbers if it's a timestamp
        .trim();

      const topic = cleanName.length > 3 ? cleanName : "General Knowledge and Learning";
      console.log(`⚠️ PDF text extraction empty. Generating quiz based on topic: "${topic}"`);
      
      text = `[TOPIC: ${topic}] Please generate a quiz about this topic: ${topic}.`;
    }

    // 4. Generate Quiz with OpenAI
    const questionsData = await generateQuizFromText(text);

    // 5. Save Quiz and Questions to DB
    try {
      // Ensure we create the user in the DB if they don't exist yet
      await db.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, isPro },
      });

      const quiz = await db.quiz.create({
        data: {
          userId,
          pdfName: file.name,
          questions: {
            create: questionsData.map((q) => ({
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctOption: q.correctOption,
              reasoning: q.reasoning,
            })),
          },
        },
        include: {
          questions: true,
        },
      });

      return {
        success: true,
        quizId: quiz.id,
        questions: quiz.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
        })),
      };
    } catch (err) {
      if (isConnectionError(err)) {
        console.warn("⚠️ DATABASE FALLBACK: Saving generated quiz locally.");
        const quiz = fallbackDb.createQuiz(userId, file.name, questionsData);
        return {
          success: true,
          quizId: quiz.id,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
          })),
        };
      }
      throw err;
    }
  } catch (error: any) {
    console.error("Error in uploadPDFAndGenerateQuiz Server Action:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export interface QuizResults {
  score: number;
  pdfName: string;
  questions: {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    reasoning: string;
    userAnswer?: {
      selectedOption: string;
      isCorrect: boolean;
    };
  }[];
}

export async function submitQuizAnswers(
  quizId: string,
  userId: string,
  answers: { questionId: string; selectedOption: "A" | "B" | "C" | "D" }[]
): Promise<{ success: boolean; results?: QuizResults; error?: string }> {
  try {
    // 1. Fetch Quiz and Questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found." };
    }

    // Ensure we have User created in DB
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // 2. Evaluate answers and save them
    let score = 0;
    const userAnswersData = [];

    for (const ans of answers) {
      const question = quiz.questions.find((q: any) => q.id === ans.questionId);
      if (!question) continue;

      const isCorrect = question.correctOption === ans.selectedOption;
      if (isCorrect) {
        score++;
      }

      userAnswersData.push({
        userId,
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect,
      });
    }

    // Save answers in DB
    await db.$transaction(
      userAnswersData.map((ua) =>
        db.userAnswer.create({
          data: ua,
        })
      )
    );

    // Update quiz with score
    const updatedQuiz = await db.quiz.update({
      where: { id: quizId },
      data: { score },
      include: {
        questions: {
          include: {
            userAnswers: {
              where: { userId },
            },
          },
        },
      },
    });

    const results: QuizResults = {
      score,
      pdfName: updatedQuiz.pdfName,
      questions: updatedQuiz.questions.map((q: any) => {
        const ua = q.userAnswers[0];
        return {
          id: q.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          reasoning: q.reasoning,
          userAnswer: ua
            ? {
                selectedOption: ua.selectedOption,
                isCorrect: ua.isCorrect,
              }
            : undefined,
        };
      }),
    };

    return { success: true, results };
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn("⚠️ DATABASE FALLBACK: Submitting answers locally.");
      const results = fallbackDb.submitAnswers(quizId, userId, answers);
      if (results) {
        return { success: true, results };
      }
      return { success: false, error: "Quiz not found locally." };
    }
    console.error("Error submitting quiz answers:", error);
    return { success: false, error: error.message || "Failed to submit answers." };
  }
}

export async function claimAnonymousQuiz(
  anonUserId: string,
  tiunToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const synced = await syncUser(tiunToken);
    if (!synced) {
      return { success: false, error: "Failed to authenticate with Tiun." };
    }

    const { userId: tiunUserId } = synced;

    try {
      // 1. Update quizzes owned by anonUserId to tiunUserId
      await db.quiz.updateMany({
        where: { userId: anonUserId },
        data: { userId: tiunUserId },
      });

      // 2. Update user answers owned by anonUserId to tiunUserId
      await db.userAnswer.updateMany({
        where: { userId: anonUserId },
        data: { userId: tiunUserId },
      });
    } catch (err) {
      if (isConnectionError(err)) {
        console.warn("⚠️ DATABASE FALLBACK: Claiming anonymous quiz locally.");
        fallbackDb.claimHistory(anonUserId, tiunUserId);
      } else {
        throw err;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error claiming anonymous quiz:", error);
    return { success: false, error: error.message || "Failed to transfer quiz history." };
  }
}

export async function getRecentQuizzes(
  userId: string,
  tiunToken?: string
): Promise<{ success: boolean; quizzes?: any[]; error?: string }> {
  try {
    let activeUserId = userId;
    if (tiunToken) {
      const synced = await syncUser(tiunToken);
      if (synced) {
        activeUserId = synced.userId;
      }
    }

    const quizzes = await db.quiz.findMany({
      where: { userId: activeUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        pdfName: true,
        score: true,
        createdAt: true,
      },
    });

    return { success: true, quizzes };
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn("⚠️ DATABASE FALLBACK: Loading recent quizzes locally.");
      const quizzes = fallbackDb.getRecentQuizzes(userId);
      return { success: true, quizzes };
    }
    console.error("Error fetching recent quizzes:", error);
    return { success: false, error: error.message || "Failed to load recent quizzes." };
  }
}

export async function getQuizResults(
  quizId: string,
  userId: string,
  tiunToken?: string
): Promise<{ success: boolean; results?: QuizResults; error?: string }> {
  try {
    let activeUserId = userId;
    if (tiunToken) {
      const synced = await syncUser(tiunToken);
      if (synced) {
        activeUserId = synced.userId;
      }
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            userAnswers: {
              where: { userId: activeUserId },
            },
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found." };
    }

    const results: QuizResults = {
      score: quiz.score || 0,
      pdfName: quiz.pdfName,
      questions: quiz.questions.map((q: any) => {
        const ua = q.userAnswers[0];
        return {
          id: q.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          reasoning: q.reasoning,
          userAnswer: ua
            ? {
                selectedOption: ua.selectedOption,
                isCorrect: ua.isCorrect,
              }
            : undefined,
        };
      }),
    };

    return { success: true, results };
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn("⚠️ DATABASE FALLBACK: Loading quiz results locally.");
      const quiz = fallbackDb.getQuiz(quizId);
      if (quiz) {
        // Fetch user answers locally
        const mockResults = fallbackDb.submitAnswers(quizId, userId, []);
        if (mockResults) {
          return { success: true, results: mockResults };
        }
      }
      return { success: false, error: "Quiz not found locally." };
    }
    console.error("Error fetching quiz results:", error);
    return { success: false, error: error.message || "Failed to fetch quiz results." };
  }
}

export interface AdaptiveReviewQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  reasoning: string;
}

export async function getAdaptiveReviewQuestion(
  userId: string,
  tiunToken?: string
): Promise<{ success: boolean; question?: AdaptiveReviewQuestion; error?: string }> {
  try {
    let activeUserId = userId;
    if (tiunToken) {
      const synced = await syncUser(tiunToken);
      if (synced) {
        activeUserId = synced.userId;
      }
    }

    // Find user's incorrect answers
    const incorrectAnswers = await db.userAnswer.findMany({
      where: {
        userId: activeUserId,
        isCorrect: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        question: true,
      },
    });

    if (incorrectAnswers.length === 0) {
      return { success: true }; // No incorrect questions to review
    }

    // Pick the most recent incorrect question
    const incorrect = incorrectAnswers[0];
    const q = incorrect.question;

    return {
      success: true,
      question: {
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption as "A" | "B" | "C" | "D",
        reasoning: q.reasoning,
      },
    };
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn("⚠️ DATABASE FALLBACK: Getting adaptive review locally.");
      const q = fallbackDb.getAdaptiveReviewQuestion(userId);
      if (q) {
        return {
          success: true,
          question: {
            id: q.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            reasoning: q.reasoning,
          },
        };
      }
      return { success: true };
    }
    console.error("Error fetching adaptive review question:", error);
    return { success: false, error: error.message || "Failed to load review question." };
  }
}

export async function submitAdaptiveReviewAnswer(
  userId: string,
  questionId: string,
  selectedOption: "A" | "B" | "C" | "D",
  tiunToken?: string
): Promise<{ success: boolean; isCorrect?: boolean; error?: string }> {
  try {
    let activeUserId = userId;
    if (tiunToken) {
      const synced = await syncUser(tiunToken);
      if (synced) {
        activeUserId = synced.userId;
      }
    }

    const question = await db.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return { success: false, error: "Question not found." };
    }

    const isCorrect = question.correctOption === selectedOption;

    // Save this answer to user answers history
    await db.userAnswer.create({
      data: {
        userId: activeUserId,
        questionId,
        selectedOption,
        isCorrect,
      },
    });

    return { success: true, isCorrect };
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn("⚠️ DATABASE FALLBACK: Submitting adaptive review answer locally.");
      const res = fallbackDb.submitAdaptiveReviewAnswer(userId, questionId, selectedOption);
      return { success: true, isCorrect: res.isCorrect };
    }
    console.error("Error submitting adaptive review answer:", error);
    return { success: false, error: error.message || "Failed to submit review answer." };
  }
}

export async function deleteQuiz(
  quizId: string,
  userId: string,
  tiunToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let activeUserId = userId;
    if (tiunToken) {
      const synced = await syncUser(tiunToken);
      if (synced) {
        activeUserId = synced.userId;
      }
    }

    await db.quiz.delete({
      where: { id: quizId, userId: activeUserId },
    });

    return { success: true };
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn("⚠️ DATABASE FALLBACK: Deleting quiz locally.");
      fallbackDb.deleteQuiz(quizId);
      return { success: true };
    }
    console.error("Error deleting quiz:", error);
    return { success: false, error: error.message || "Failed to delete quiz." };
  }
}
