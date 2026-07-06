import fs from "fs";
import path from "path";

const FALLBACK_FILE = path.join(process.cwd(), "prisma", "fallback-db.json");

interface FallbackData {
  users: Record<string, { id: string; email?: string; isPro: boolean }>;
  quizzes: Record<
    string,
    {
      id: string;
      userId: string;
      pdfName: string;
      score: number | null;
      createdAt: string;
      questions: {
        id: string;
        questionText: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        correctOption: "A" | "B" | "C" | "D";
        reasoning: string;
      }[];
    }
  >;
  userAnswers: {
    id: string;
    userId: string;
    questionId: string;
    selectedOption: "A" | "B" | "C" | "D";
    isCorrect: boolean;
    createdAt: string;
  }[];
}

function getEmptyData(): FallbackData {
  return { users: {}, quizzes: {}, userAnswers: [] };
}

function readData(): FallbackData {
  try {
    if (!fs.existsSync(FALLBACK_FILE)) {
      // Ensure directory exists
      const dir = path.dirname(FALLBACK_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(getEmptyData(), null, 2));
      return getEmptyData();
    }
    const content = fs.readFileSync(FALLBACK_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading fallback database:", error);
    return getEmptyData();
  }
}

function writeData(data: FallbackData) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing fallback database:", error);
  }
}

export const fallbackDb = {
  upsertUser: (id: string, email?: string, isPro = false) => {
    const data = readData();
    data.users[id] = { id, email, isPro };
    writeData(data);
  },

  getUser: (id: string) => {
    const data = readData();
    return data.users[id] || null;
  },

  createQuiz: (userId: string, pdfName: string, questions: any[]) => {
    const data = readData();
    const quizId = "f-quiz-" + Math.random().toString(36).substring(2, 9);
    
    const formattedQuestions = questions.map((q) => ({
      id: "f-q-" + Math.random().toString(36).substring(2, 9),
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      reasoning: q.reasoning,
    }));

    data.quizzes[quizId] = {
      id: quizId,
      userId,
      pdfName,
      score: null,
      createdAt: new Date().toISOString(),
      questions: formattedQuestions,
    };

    writeData(data);
    return data.quizzes[quizId];
  },

  getQuiz: (id: string) => {
    const data = readData();
    return data.quizzes[id] || null;
  },

  deleteQuiz: (id: string) => {
    const data = readData();
    delete data.quizzes[id];
    writeData(data);
  },

  getQuizCount: (userId: string) => {
    const data = readData();
    return Object.values(data.quizzes).filter((q) => q.userId === userId).length;
  },

  getRecentQuizzes: (userId: string) => {
    const data = readData();
    return Object.values(data.quizzes)
      .filter((q) => q.userId === userId)
      .map((q) => ({
        id: q.id,
        pdfName: q.pdfName,
        score: q.score,
        createdAt: new Date(q.createdAt),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  submitAnswers: (quizId: string, userId: string, answers: any[]) => {
    const data = readData();
    const quiz = data.quizzes[quizId];
    if (!quiz) return null;

    let score = 0;
    const submittedAnswers: any[] = [];

    for (const ans of answers) {
      const question = quiz.questions.find((q) => q.id === ans.questionId);
      if (!question) continue;

      const isCorrect = question.correctOption === ans.selectedOption;
      if (isCorrect) score++;

      const userAnswer = {
        id: "f-ua-" + Math.random().toString(36).substring(2, 9),
        userId,
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect,
        createdAt: new Date().toISOString(),
      };

      data.userAnswers.push(userAnswer);
      submittedAnswers.push(userAnswer);
    }

    quiz.score = score;
    writeData(data);

    return {
      score,
      pdfName: quiz.pdfName,
      questions: quiz.questions.map((q) => {
        const ua = submittedAnswers.find((a) => a.questionId === q.id);
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
  },

  claimHistory: (anonUserId: string, tiunUserId: string) => {
    const data = readData();
    
    // Update quizzes
    for (const q of Object.values(data.quizzes)) {
      if (q.userId === anonUserId) {
        q.userId = tiunUserId;
      }
    }

    // Update user answers
    for (const ua of data.userAnswers) {
      if (ua.userId === anonUserId) {
        ua.userId = tiunUserId;
      }
    }

    writeData(data);
  },

  getAdaptiveReviewQuestion: (userId: string) => {
    const data = readData();
    
    // Find incorrect answers for this user
    const incorrect = data.userAnswers
      .filter((ua) => ua.userId === userId && !ua.isCorrect)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (incorrect.length === 0) return null;

    const mostRecent = incorrect[0];
    
    // Find the associated question
    for (const q of Object.values(data.quizzes)) {
      const question = q.questions.find((quest) => quest.id === mostRecent.questionId);
      if (question) {
        return question;
      }
    }

    return null;
  },

  submitAdaptiveReviewAnswer: (userId: string, questionId: string, selectedOption: "A" | "B" | "C" | "D") => {
    const data = readData();
    
    // Find the question to check if correct
    let question = null;
    for (const q of Object.values(data.quizzes)) {
      const found = q.questions.find((quest) => quest.id === questionId);
      if (found) {
        question = found;
        break;
      }
    }

    if (!question) return { isCorrect: false };

    const isCorrect = question.correctOption === selectedOption;

    data.userAnswers.push({
      id: "f-ua-" + Math.random().toString(36).substring(2, 9),
      userId,
      questionId,
      selectedOption,
      isCorrect,
      createdAt: new Date().toISOString(),
    });

    writeData(data);
    return { isCorrect };
  }
};
