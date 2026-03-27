require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. API Tạo câu hỏi đơn lẻ (Cho trang Practice) ---
app.get('/api/sat-question', async (req, res) => {
  const category = req.query.category || 'math';
  let topicInstruction = "";
  
  if (category === 'math') {
    topicInstruction = `
      Generate a SIMPLE SAT Math question. 
      - TYPE: Heart of Algebra or Passport to Advanced Math.
      - FORMAT: Use plain text only. STRICTLY NO dollar signs ($) and NO LaTeX. 
      - CONTENT: One question, 4 options, 1 correct answer letter.
      - EXPLAIN: Short Vietnamese explanation (max 2 sentences).
      - FIELDS: 'question', 'options', 'answer', 'step_by_step_explanation'.`;
  } else if (category === 'writing') {
    topicInstruction = `
      Generate an SAT WRITING & LANGUAGE question. 
      - Focus: Standard English Conventions (grammar, punctuation).
      - Style: A short paragraph with a specific grammatical part to fix.
      - Fields: 'passage', 'question', 'options', 'answer', 'step_by_step_explanation'.`;
  } else {
    topicInstruction = `
      Generate an SAT READING question. 
      - Focus: Information and Ideas (main purpose or claims).
      - Style: A self-contained excerpt from academic or literary text.
      - Fields: 'passage', 'question', 'options', 'answer', 'step_by_step_explanation'.`;
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
        "answer": "A",
        "step_by_step_explanation": "Giải thích chi tiết bằng tiếng Việt"
      }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', 
      temperature: 0,      // <--- THAY THẾ: Chỉnh từ 0.2 về 0 để AI phản hồi nhanh nhất
      max_tokens: 800      // <--- THÊM MỚI: Đảm bảo AI không bị ngắt quãng giữa chừng
    });
    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        res.json({
          passage: parsedData.passage || null,
          question: parsedData.question || "No question content.",
          options: parsedData.options || ["A) ", "B) ", "C) ", "D) "],
          answer: parsedData.answer || "A",
          step_by_step_explanation: parsedData.step_by_step_explanation || parsedData.explanation || "Không có giải thích."
        });
      } catch (e) {
        throw new Error("Malformed JSON");
      }
    } else {
      throw new Error("No JSON found");
    }
  } catch (error) {
    console.error("SAT Question Error:", error);
    res.status(500).json({ 
      passage: null,
      question: "AI Tutor đang bận, vui lòng nhấn 'Next Question' để thử lại.",
      options: ["A) Thử lại", "B) Thử lại", "C) Thử lại", "D) Thử lại"],
      answer: "A",
      step_by_step_explanation: "Lỗi kết nối hoặc định dạng từ AI."
    });
  }
});

// --- 2. API Tạo trọn bộ Quiz (Cho trang Create Quiz) ---
app.post('/api/generate-quiz', async (req, res) => {
  const { subject, difficulty, count } = req.body;
  let subjectName = subject === 'math' ? "SAT Math" : "SAT Verbal";

  const prompt = `Create a ${count}-question SAT quiz on ${subjectName}. Difficulty: ${difficulty}.
    Return ONLY JSON: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
    });
    const jsonMatch = chatCompletion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Quiz Error:", error);
    res.status(500).json({ error: "Không thể tạo Quiz lúc này." });
  }
});

// --- 3. API AI Tutor Chat (Gộp 2 hàm thành 1 bản chuẩn) ---
app.post('/api/ai-tutor/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are a friendly SAT Tutor. Help with Math, Reading, Writing. Answer in Vietnamese, use English for SAT terms. If providing a JSON question, use the standard format.' 
        },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
    });

    const aiResponse = completion.choices[0].message.content;
    const isJson = aiResponse.trim().startsWith('{');
    
    res.json({ reply: aiResponse, isQuiz: isJson });
  } catch (error) {
    res.status(500).json({ error: "AI Tutor đang bận suy nghĩ!" });
  }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });