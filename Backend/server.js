require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- TỐI ƯU 1: QUẢN LÝ KEY VÀ KẾT NỐI ---
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

// Hàm lấy client mà không khởi tạo lại liên tục
function getGroqClient() {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; // Xoay vòng index
    return new Groq({ apiKey: key });
}

// --- TỐI ƯU 2: CÁC BỘ PROMPT NGẮN GỌN (GIẢM ĐỘ TRỄ) ---
const MATH_PROMPT = (topic) => `Role: SAT Math Expert. 
Task: 1 unique question about ${topic}. 
Rules: Question/Options in English. Explanation in Vietnamese. No LaTeX. 
Format: Return ONLY JSON.
JSON: {"passage": null, "question": "...", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "..."}`;

const READING_PROMPT = () => `Role: SAT Reading. Task: 1 passage (100 words) + 1 question. 
Rules: English content, Vietnamese explanation. ONLY JSON.
JSON: {"passage": "...", "question": "...", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "..."}`;

const WRITING_PROMPT = () => `Role: SAT Writing. Task: 1 grammar question. 
Rules: English content, Vietnamese explanation. ONLY JSON.
JSON: {"passage": "Context here", "question": "...", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "..."}`;

// --- 1. API PRACTICE (SIÊU TỐC ĐỘ) ---
app.get('/api/sat-question', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const { category } = req.query;
    
    let finalPrompt = "";
    if (category === 'math') {
        const topics = ["Algebra", "Geometry", "Data Analysis", "Functions"];
        finalPrompt = MATH_PROMPT(topics[Math.floor(Math.random() * topics.length)]);
    } else if (category === 'writing') {
        finalPrompt = WRITING_PROMPT();
    } else {
        finalPrompt = READING_PROMPT();
    }

    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: finalPrompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0,
            max_tokens: 600, // TỐI ƯU: Giảm max_tokens để AI trả về nhanh hơn
        });

        const content = completion.choices[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) res.json(JSON.parse(jsonMatch[0]));
        else throw new Error("JSON fail");
    } catch (error) {
        console.error("Speed Error:", error.message);
        res.status(500).json({ error: "API Busy" });
    }
});

// --- 2. API QUIZ ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const prompt = `Create ${count} SAT ${subject} questions (${difficulty}). English content, Vietnamese explanation. ONLY JSON: {"questions": [...]}`;
    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
            max_tokens: 1500
        });
        const jsonMatch = completion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        res.status(500).json({ error: "Quiz Error" });
    }
});

// --- 3. API CHAT ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an SAT Tutor. Speak Vietnamese.' },
                { role: 'user', content: req.body.message }
            ],
            model: 'llama-3.1-8b-instant',
        });
        const reply = completion.choices[0].message.content;
        res.json({ reply, isQuiz: /\{[\s\S]*\}/.test(reply) });
    } catch (error) {
        res.status(500).json({ error: "Chat Error" });
    }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));