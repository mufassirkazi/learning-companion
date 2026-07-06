import OpenAI from "openai";

export interface GeneratedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  reasoning: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

const MOCK_QUIZ: GeneratedQuestion[] = [
  {
    questionText: "What is the primary benefit of Next.js App Router Server Components?",
    optionA: "They run entirely on the client, reducing server load.",
    optionB: "They are rendered on the server, sending zero client-side JavaScript by default.",
    optionC: "They disable all CSS-in-JS libraries automatically.",
    optionD: "They require a separate Node.js server to run.",
    correctOption: "B",
    reasoning: "React Server Components (RSC) in Next.js App Router are executed on the server, which allows them to render without sending any JavaScript to the client, leading to faster page loads and better SEO."
  },
  {
    questionText: "How does the tiun SDK handle subscription gating on the client side?",
    optionA: "By polling a REST endpoint every 5 seconds.",
    optionB: "By listening to the 'userChange' event, which acts as the reactive source of truth.",
    optionC: "By checking the document.cookie object directly.",
    optionD: "By redirecting the user to an external billing portal on every page load.",
    correctOption: "B",
    reasoning: "The tiun SDK's 'userChange' event is the reactive source of truth for subscription gating. Entitlements can change mid-session, so listening to this event ensures the UI updates instantly."
  },
  {
    questionText: "What is the maximum file size allowed for PDF uploads in Quizly?",
    optionA: "2 MB",
    optionB: "5 MB",
    optionC: "10 MB",
    optionD: "Unlimited for all users",
    correctOption: "B",
    reasoning: "According to the product requirements, the maximum PDF file size allowed for upload is 5 MB."
  },
  {
    questionText: "What happens when an Anonymous Guest clicks 'Review Results' in Quizly?",
    optionA: "They are shown the results immediately.",
    optionB: "They are prompted to pay $5/month.",
    optionC: "They are displayed the tiun authentication modal to create a free account and save history.",
    optionD: "Their session is deleted and they are redirected to the homepage.",
    correctOption: "C",
    reasoning: "Anonymous users are allowed exactly one learning session. Clicking 'Review Results' prompts them with tiun authentication to unlock their results and save history."
  },
  {
    questionText: "In Quizly's Pro Subscriber tier, what happens before every new quiz generation?",
    optionA: "A payment verification of $5 is made.",
    optionB: "An adaptive review displays one previously incorrect question to revisit.",
    optionC: "The user is forced to upload at least three PDFs.",
    optionD: "The entire previous quiz history is deleted.",
    correctOption: "B",
    reasoning: "Quizly's Pro Subscriber tier features an adaptive review before every new quiz, where the user must revisit a question they previously answered incorrectly to reinforce learning."
  }
];

export async function generateQuizFromText(text: string): Promise<GeneratedQuestion[]> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "mock-key") {
    console.warn("OPENAI_API_KEY is not configured. Falling back to mock quiz generator.");
    // Simulate some delay for premium feel
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return MOCK_QUIZ;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert educator. Your task is to generate a quiz of exactly 5 multiple choice questions based on the provided text or topic.
If the input starts with "[TOPIC: ...]", generate a highly educational, challenging, and relevant quiz about that specific topic. Otherwise, base the quiz on the provided text.

Each question must be a challenging, high-quality multiple choice question with 4 options (A, B, C, D) and exactly one correct answer.
You must also provide a detailed reasoning/explanation for the correct answer, which can be shown directly to the user if they answer incorrectly.

You MUST respond with a raw, valid JSON array containing exactly 5 objects. Do not include markdown code block formatting (like \`\`\`json ... \`\`\`) or any conversational text.

The JSON structure of each object MUST be:
{
  "questionText": "string",
  "optionA": "string",
  "optionB": "string",
  "optionC": "string",
  "optionD": "string",
  "correctOption": "A" | "B" | "C" | "D",
  "reasoning": "string"
}`
        },
        {
          role: "user",
          content: text.startsWith("[TOPIC:") 
            ? `Generate a 5-question quiz about this topic: ${text}`
            : `Generate a 5-question quiz from this text:\n\n${text.slice(0, 8000)}` // Limit text length to avoid token limits
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    
    // Parse JSON safely
    // Remove potential markdown code blocks if the model ignored instructions
    const cleanJSON = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const questions = JSON.parse(cleanJSON) as GeneratedQuestion[];

    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error("OpenAI did not return exactly 5 questions.");
    }

    // Validate structure
    for (const q of questions) {
      if (
        !q.questionText ||
        !q.optionA ||
        !q.optionB ||
        !q.optionC ||
        !q.optionD ||
        !["A", "B", "C", "D"].includes(q.correctOption) ||
        !q.reasoning
      ) {
        throw new Error("Invalid question structure returned by OpenAI.");
      }
    }

    return questions;
  } catch (error) {
    console.error("Error generating quiz from OpenAI:", error);
    // Fallback to mock quiz on error
    return MOCK_QUIZ;
  }
}
