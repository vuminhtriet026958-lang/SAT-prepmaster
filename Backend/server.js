require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- HÀM XOAY VÒNG KEY ---
function getGroqClient() {
    const keysString = process.env.GROQ_API_KEYS || "";
    const keys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
    const selectedKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : process.env.GROQ_API_KEY;
    return new Groq({ apiKey: selectedKey });
}

// --- 1. API PRACTICE (ĐÃ GIA CỐ CỰC MẠNH) ---
app.get('/api/sat-question', async (req, res) => {
    // Ép trình duyệt không được cache kết quả
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    const { category } = req.query; // math, reading, writing
    
    // TẠO SYSTEM PROMPT RIÊNG BIỆT CHO TỪNG MÔN
    let systemRole = "";
    if (category === 'math') {
        systemRole = "You are an SAT Math Expert. Generate ONLY Math questions. No passages. English for questions, Vietnamese for explanations.";
    } else if (category === 'reading') {
        systemRole = "You are an SAT Reading Expert. You MUST provide a long academic passage (English). Question and options in English, explanation in Vietnamese.";
    } else if (category === 'writing') {
        systemRole = "You are an SAT Writing Expert. Provide a short passage with grammar focus (English). Question in English, explanation in Vietnamese.";
    } else {
        systemRole = "You are an SAT Expert. Return ONLY JSON.";
    }

    const userPrompt = `Generate one UNIQUE SAT ${category.toUpperCase()} question. 
    STRICT RULES:
    1. Language: Passage/Question/Options MUST BE IN ENGLISH.
    2. Explanation: MUST BE IN VIETNAMESE.
    3. Format: Return ONLY JSON.
    JSON: {"passage": "text or null", "question": "string", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "Giải thích..."}`;

    try {
        const groqClient = getGroqClient();
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [
                { role: 'system', content: systemRole }, // Ép vai trò AI ở đây
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0, // Tuyệt đối không để AI sáng tạo sai ngôn ngữ
            max_tokens: 1200
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || "";
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("No JSON found");
        }
    } catch (error) {
        console.error("Practice Error:", error.message);
        res.status(500).json({ error: "Lỗi hệ thống." });
    }
});

// --- 2. API QUIZ (GIA CỐ ĐỘ KHÓ) ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const prompt = `Create an SAT ${subject.toUpperCase()} quiz. Difficulty: ${difficulty}. 
    - Questions/Options: English. 
    - Explanations: Vietnamese.
    - Return ONLY JSON: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}`;

    try {
        const groqClient = getGroqClient();
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [{ role: 'system', content: `You are an SAT Professor specialized in ${difficulty} level.` }, { role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1
        });
        const jsonMatch = chatCompletion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        res.status(500).json({ error: "Lỗi tạo Quiz." });
    }
});

// --- 3. API CHAT (BỎ DẤU NGOẶC KHI NÓI CHUYỆN) ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    const { message } = req.body;
    try {
        const groqClient = getGroqClient();
        const completion = await groqClient.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a friendly SAT Tutor. Speak ONLY Vietnamese. If you give a practice question, use JSON format inside your response.' },
                { role: 'user', content: message }
            ],
            model: 'llama-3.1-8b-instant',
        });
        const aiResponse = completion.choices[0].message.content;
        const isJson = /\{[\s\S]*\}/.test(aiResponse);
        res.json({ reply: aiResponse, isQuiz: isJson });
    } catch (error) {
        res.status(500).json({ error: "AI bận!" });
    }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));