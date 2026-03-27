require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Đảm bảo bạn đã có biến này trong file .env
});
const app = express();
app.use(cors());
app.use(express.json());

// 1. Khởi tạo Groq (Giữ API Key của bạn)
const apiKey = process.env.GROQ_API_KEY;

// 2. API Tạo câu hỏi đơn lẻ (Cho trang Practice)
app.get('/api/sat-question', async (req, res) => {
  const category = req.query.category || 'reading';
  let topicInstruction = "";
  
  if (category === 'math') {
  topicInstruction = `
  You are an expert SAT Math content creator. Your goal is to generate high-quality, realistic SAT Math questions (covering Algebra, Advanced Math, and Problem Solving).

  STRICT ACCURACY PROTOCOL (To prevent calculation errors):
  1. **Internal Verification**: Before generating the final output, you must internally solve the problem step-by-step.
  2. **Double-Check Signs**: Pay extra attention to negative numbers and exponents (e.g., $(-2)^2$ is $4$, not $-4$).
  3. **Option Matching**: The final numerical result MUST exactly match one of the four options (A, B, C, or D).
  4. **Plausible Distractors**: The three incorrect options should represent common student mistakes (e.g., sign errors, forgetting to distribute).
  5. **Math Formatting**: Use LaTeX ($...$) for all mathematical expressions and variables (e.g., $f(x) = 2x^2$).

  OUTPUT FORMAT (Return ONLY a JSON object):
  {
    "question": "The text of the SAT question in English",
    "options": ["A) value", "B) value", "C) value", "D) value"],
    "answer": "The correct letter only (A, B, C, or D)",
    "step_by_step_explanation": "A clear, pedagogical explanation in English showing the steps to reach the correct answer."
  }

  REFERENCE CASE:
  If the question is f(-2) for $f(x) = 2x^2 + 5x - 3$:
  - Calculate: $2(4) + 5(-2) - 3 = 8 - 10 - 3 = -5$.
  - Ensure '-5' is the correct option and correctly labeled in the 'answer' field.
`;
} else if (category === 'writing') {
    topicInstruction = "Create a SAT Writing & Language question focusing on grammar, punctuation, or sentence structure.";
  } else {
    topicInstruction = "Create a SAT Reading question with a short passage (2-4 sentences) and a question about its purpose or meaning.";
  }

  const prompt = `
    Role: SAT Expert.
    Task: ${topicInstruction}
    STRICT LANGUAGE RULES:
    1. The "text" and "options" MUST BE 100% IN ENGLISH.
    2. ONLY the "explanation" MUST BE IN VIETNAMESE.
    Return ONLY JSON: {"text": "...", "options": ["..."], "correct": 0, "explanation": "..."}
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });
    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("JSON not found");
    }
  } catch (error) {
    res.json({ text: "Error loading question.", options: ["A", "B", "C", "D"], correct: 0, explanation: "Lỗi kết nối AI." });
  }
});

// 3. API Tạo trọn bộ Quiz (Cho trang Create Quiz)
app.post('/api/generate-quiz', async (req, res) => {
  const { subject, difficulty, count } = req.body;
  let subjectInstruction = subject === 'math' ? "SAT Math" : (subject === 'writing' ? "SAT Writing" : "SAT Reading");

  const prompt = `
    Task: Create a ${count}-question SAT quiz on ${subjectInstruction}. Difficulty: ${difficulty}.
    Rules: Questions/options in English, explanations in Vietnamese.
    Return ONLY JSON format:
    {
      "questions": [
        {
          "text": "...",
          "options": ["A) ", "B) ", "C) ", "D) "],
          "correct": 0,
          "explanation": "..."
        }
      ]
    }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
    });
    const jsonMatch = chatCompletion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Lỗi tạo Quiz:", error);
    res.status(500).json({ error: "Không thể tạo Quiz lúc này." });
  }
});
// API dành riêng cho AI Tutor trò chuyện
app.post('/api/ai-tutor/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are a friendly SAT Tutor. Help the student with Math, Reading, and Writing. Answer in Vietnamese if they ask in Vietnamese, but keep SAT terms in English.' 
        },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "AI Tutor đang bận suy nghĩ, thử lại sau nhé!" });
  }
});
app.post('/api/ai-tutor/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `You are an expert SAT Tutor. 
          1. If the user asks for a practice question, provide a JSON-formatted question with "passage", "question", "choices" (A, B, C, D), and "answer". 
          2. If the user asks a general question, explain it clearly in Vietnamese.
          3. For SAT terms, use English.
          4. If providing a quiz, start the response with { "isQuiz": true, ... }` 
        },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Kiểm tra xem AI có đang gửi một chuỗi JSON câu hỏi không
    const isQuiz = aiResponse.trim().startsWith('{');
    
    res.json({ 
      reply: aiResponse,
      isQuiz: isQuiz
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi kết nối AI" });
  }
});

// 4. Khởi chạy Server
const PORT = 3010;
app.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log(`🚀 SERVER ĐANG CHẠY: http://localhost:${PORT}`);
    console.log("-----------------------------------------");
});