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
  const category = req.query.category || 'math';
  let topicInstruction = "";
  
  // Cấu trúc Prompt chung cho Reading/Writing
  if (category === 'math') {
    topicInstruction = `
      Generate a SAT Math question. 
      1. Internal Solve: Verify all calculations carefully (e.g., (-2)^2 = 4).
      2. Format: Use plain text only. DO NOT use dollar signs ($) or LaTeX. Use ^ for exponents (e.g., x^2) and standard operators.
      3. Fields: Provide 'question', 'options' (A, B, C, D), 'answer' (the letter), and 'explanation'.`;
  } else if (category === 'writing') {
    topicInstruction = `
      Generate an SAT WRITING & LANGUAGE question. 
      - Focus: Standard English Conventions (grammar, punctuation, sentence structure).
      - Style: A professional or academic short paragraph with an underlined portion or a specific grammatical error to fix.
      - Fields: 'passage' (the paragraph), 'question' (e.g., "Which choice best completes the sentence?"), 'options', 'answer', 'explanation'.`;
  } else {
    topicInstruction = `
      Generate an SAT READING question. 
      - Focus: Information and Ideas (main purpose, tone, or evidence-based claims).
      - Style: A self-contained excerpt from a scientific study, historical speech, or literary text.
      - Fields: 'passage', 'question' (e.g., "Which statement best describes the main idea?"), 'options', 'answer', 'explanation'.`;
  }

  const prompt = `
    Role: SAT Expert.
    Task: ${topicInstruction}
    STRICT RULES:
    - Language: Question/Options/Passage in ENGLISH. Explanation in VIETNAMESE.
    - Output: ONLY JSON.
    - JSON Structure: 
      {
        "passage": "text or null",
        "question": "text",
        "options": ["A) ", "B) ", "C) ", "D) "],
        "answer": "Letter (A/B/C/D)",
        "step_by_step_explanation": "text in Vietnamese"
      }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2, // Chỉnh xuống 0.2 để tính toán chính xác hơn
    });
    
    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Trả về dữ liệu đã được chuẩn hóa để Frontend không bị lỗi
        res.json({
          passage: parsedData.passage || null,
          question: parsedData.question || "No question generated.",
          options: parsedData.options || ["A", "B", "C", "D"],
          answer: parsedData.answer || "A",
          step_by_step_explanation: parsedData.step_by_step_explanation || parsedData.explanation || "No explanation available."
        });
      } catch (e) {
        console.error("JSON Parse Error:", e);
        res.json({
          passage: null,
          question: "The AI generated a malformed response. Please click 'Next Question' to try again.",
          options: ["A) Retry", "B) Retry", "C) Retry", "D) Retry"],
          answer: "A",
          step_by_step_explanation: "Lỗi định dạng dữ liệu từ AI."
        });
      }
    } else {
      throw new Error("JSON not found in AI response");
    }
  } catch (error) {
    console.error("Global API Error:", error);
    res.status(500).json({ error: "Lỗi kết nối AI." });
  }
}); // Đây là dấu đóng hàm app.get chính xác
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
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });