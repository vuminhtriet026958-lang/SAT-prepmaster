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
    topicInstruction = "Create a SAT Math question (Algebra, Geometry, or Advanced Math). Ensure the math notation is clear (e.g., use x^2 for square).";
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