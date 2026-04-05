require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

function getGroqClient() {
  const keysString = process.env.GROQ_API_KEYS || "";
  const keys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
  const selectedKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : process.env.GROQ_API_KEY;
  console.log(`Using Key: ${selectedKey ? selectedKey.substring(0, 10) : "MISSING"}...`);
  return new Groq({ apiKey: selectedKey });
}

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// --- 1. API Tạo câu hỏi đơn lẻ ---
app.get('/api/sat-question', async (req, res) => {
  const category = req.query.category || 'math';
  const mathSubTopics = ["Linear equations", "Quadratic functions", "Ratios", "Trigonometry", "Circle equations", "Exponential growth"];
  const randomTopic = mathSubTopics[Math.floor(Math.random() * mathSubTopics.length)];
  
  // ÉP AI CHỈ TRẢ VỀ JSON VÀ HẠ MODEL XUỐNG 8B ĐỂ TRÁNH TREO
  const prompt = `Role: SAT Expert. Task: Generate a UNIQUE SAT ${category} question about ${randomTopic}.
    STRICT RULE: Return ONLY a valid JSON object. No conversational text. 
    Language: English, Explanation in Vietnamese.
    JSON Structure: {"passage": "text or null", "question": "text", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "text"}`;

  try {
    const groqClient = getGroqClient(); 
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // ĐỔI THÀNH 8B ĐỂ NHANH VÀ KHÔNG LỖI
      temperature: 0,
      max_tokens: 1000
    });
    
    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    console.log("AI Response:", aiResponse); // Log để soi lỗi nếu có

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      throw new Error("No JSON found in AI response");
    }
  } catch (error) {
    console.error("SAT Question Error:", error.message);
    res.status(500).json({ question: "AI đang bận, hãy nhấn 'Next' để thử lại.", options: ["A","B","C","D"], answer: "A", step_by_step_explanation: "Lỗi kết nối API." });
  }
});

// --- 2. API Tạo trọn bộ Quiz ---
app.post('/api/generate-quiz', async (req, res) => {
  const { subject, difficulty, count } = req.body;
  const prompt = `Create a ${count}-question SAT quiz on ${subject}. Level: ${difficulty}. 
    STRICT RULE: Return ONLY JSON. Format: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}`;

  try {
    const groqClient = getGroqClient(); 
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [{ role: 'system', content: 'You are an SAT Professor. Return ONLY JSON.' }, { role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // ĐỔI THÀNH 8B ĐỂ TRÁNH QUAY VÒNG LÂU
      temperature: 0,
    });
    const jsonMatch = chatCompletion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    res.status(500).json({ error: "Không thể tạo Quiz lúc này." });
  }
});

// --- 3. API AI Tutor Chat ---
app.post('/api/ai-tutor/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const groqClient = getGroqClient(); 
    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a friendly SAT Tutor. Answer in Vietnamese.' },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant', // ĐỔI THÀNH 8B CHO MƯỢT
    });
    const aiResponse = completion.choices[0].message.content;
    const isJson = /\{[\s\S]*\}/.test(aiResponse);
    res.json({ reply: aiResponse, isQuiz: isJson });
  } catch (error) {
    res.status(500).json({ error: "AI Tutor đang bận!" });
  }
});

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
server.timeout = 60000; // Tăng timeout lên 60s cho chắc chắn