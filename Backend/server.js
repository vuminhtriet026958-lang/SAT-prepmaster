require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- HÀM LẤY API KEY XOAY VÒNG ---
function getGroqClient() {
  const keysString = process.env.GROQ_API_KEYS || "";
  const keys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
  const selectedKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : process.env.GROQ_API_KEY;
  return new Groq({ apiKey: selectedKey });
}

// --- 1. API Tạo câu hỏi đơn lẻ (Practice) ---
app.get('/api/sat-question', async (req, res) => {
  const { category } = req.query; // math, reading, writing
  
  // Logic phân loại Prompt chi tiết để AI không nhầm lẫn
  let taskDescription = "";
  if (category === 'math') {
    taskDescription = "Generate a challenging SAT Math question (Algebra, Geometry, or Data Analysis). No passage needed.";
  } else if (category === 'reading') {
    taskDescription = "Generate an SAT Reading question. Include a high-quality academic passage (100-150 words). Focus on Evidence-Based Reading.";
  } else if (category === 'writing') {
    taskDescription = "Generate an SAT Writing question. Focus on Standard English Conventions (grammar, punctuation) or Expression of Ideas.";
  }

  const prompt = `Role: Senior SAT Expert. Task: ${taskDescription}
    STRICT LANGUAGE RULES: 
    - passage, question, and options MUST BE IN ENGLISH.
    - step_by_step_explanation MUST BE IN VIETNAMESE.
    
    STRICT FORMAT: Return ONLY a valid JSON. No prefix/suffix.
    Structure: {"passage": "string or null", "question": "string", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "Giải thích chi tiết..."}`;

  try {
    const groqClient = getGroqClient();
    const completion = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', 
      temperature: 0.3, // Tăng nhẹ để câu hỏi đa dạng, không bị trùng
      max_tokens: 1200
    });

    const aiResponse = completion.choices[0]?.message?.content || "";
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/); // Chỉ lấy phần nằm trong dấu { }

    if (!jsonMatch) throw new Error("AI failed to return JSON");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Practice Error:", error.message);
    res.status(500).json({ error: "Lỗi kết nối AI." });
  }
});

// --- 2. API Tạo trọn bộ Quiz (Create Quiz) ---
app.post('/api/generate-quiz', async (req, res) => {
  const { subject, difficulty, count } = req.body;
  
  // Tối ưu hóa logic độ khó
  const difficultyGuide = {
    easy: "Focus on fundamental concepts, straightforward calculations, and clear vocabulary.",
    medium: "Involve multi-step problems, moderate inference, and standard SAT complexity.",
    hard: "Focus on complex abstract reasoning, advanced math topics, or subtle nuance in texts."
  };

  const prompt = `Task: Create a ${count}-question SAT quiz for ${subject.toUpperCase()}. 
    Difficulty: ${difficulty.toUpperCase()} (${difficultyGuide[difficulty] || ""}).
    
    RULES:
    1. Language: English for content, Vietnamese for explanations.
    2. Format: Return ONLY a JSON object.
    3. JSON: {"questions": [{"text": "Question in English", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "Giải thích tiếng Việt"}]}`;

  try {
    const groqClient = getGroqClient();
    const completion = await groqClient.chat.completions.create({
      messages: [{ role: 'system', content: 'You are an SAT Quiz Generator. Ensure the difficulty strictly matches the user request.' }, { role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
    });

    const jsonMatch = completion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ error: "Lỗi tạo bộ Quiz." });
  }
});

// --- 3. API AI Tutor Chat ---
app.post('/api/ai-tutor/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const groqClient = getGroqClient();
    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful SAT Tutor. Always explain clearly in Vietnamese. If you provide a practice question, wrap it in a JSON block within your message.' },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
    });
    const aiResponse = completion.choices[0].message.content;
    const isJson = /\{[\s\S]*\}/.test(aiResponse);
    res.json({ reply: aiResponse, isQuiz: isJson });
  } catch (error) {
    res.status(500).json({ error: "AI đang bận!" });
  }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));