require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. QUẢN LÝ XOAY VÒNG API KEY ---
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

function getGroqClient() {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return new Groq({ apiKey: key });
}

// --- 2. HÀM LỌC RÁC JSON (BẢO VỆ SERVER) ---
const safeParse = (str) => {
    try {
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const cleaned = jsonMatch[0].replace(/[\u0000-\u001F]+/g, " ");
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Lỗi parse JSON:", e.message);
        return null;
    }
};

// --- 3. PROMPT CHI TIẾT (ĐÃ PHÂN LOẠI READING/WRITING) ---
const getMathPrompt = (topic, seed) => `
Role: Senior SAT Math Professor. Unique ID: ${seed}.
Task: Create a NEW SAT Math question about ${topic}.
RULES:
1. Double-check math logic: Ensure only ONE option is correct.
2. English for Question/Options. Vietnamese for "explanation".
3. NO LaTeX. Use x^2, sqrt(x).
Format: Return ONLY a JSON object.`;

const getReadingWritingPrompt = (category, seed) => {
    const isWriting = category === 'writing';
    return `
Role: Senior SAT ${category} Specialist. Unique ID: ${seed}.
Task: Create an SAT ${category.toUpperCase()} question.
STRICT RULES:
1. PASSAGE: Write a 100-word paragraph. ${isWriting ? "Focus on grammar/punctuation/transitions." : "Focus on main idea/inference."}
2. QUESTION: ${isWriting ? "Ask to correct a specific part of the text." : "Ask about the author's tone or evidence."}
3. Language: English (content), Vietnamese (explanation).
Format: Return ONLY a JSON object.`;
};

// --- 4. API PRACTICE (ĐÃ GIA CỐ) ---
app.get('/api/sat-question', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { category } = req.query;
    const seed = Math.floor(Math.random() * 1000000); 
    
    let finalPrompt = category === 'math' 
        ? getMathPrompt("Algebra/Geometry", seed) 
        : getReadingWritingPrompt(category, seed);

    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an SAT Expert. Output ONLY raw JSON. No conversational filler.' },
                { role: 'user', content: finalPrompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.4, // Giảm xuống để logic toán chính xác hơn
            response_format: { type: "json_object" } 
        });

        const data = safeParse(completion.choices[0]?.message?.content || "");
        if (data) res.json(data);
        else throw new Error("Format Error");
    } catch (error) {
        res.status(500).json({ error: "Lỗi tạo câu hỏi Practice." });
    }
});

// --- 5. API QUIZ ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const prompt = `Create a ${count}-question SAT ${subject} quiz (${difficulty}). Return ONLY JSON: {"questions": [{"passage": "...", "question": "...", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "explanation": "..."}]}`;

    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.4,
            response_format: { type: "json_object" }
        });
        const data = safeParse(completion.choices[0]?.message?.content || "");
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Lỗi tạo Quiz." });
    }
});

// --- 6. API CHAT TUTOR (CHẶN NÓI CHỮ "JSON") ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [
                { 
                  role: 'system', 
                  content: 'You are a helpful SAT Tutor. Speak Vietnamese. NEVER say "Here is the JSON" or show code blocks. If providing a question, just provide the content naturally unless JSON is required for the app logic.' 
                },
                { role: 'user', content: req.body.message }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
        });
        const reply = completion.choices[0].message.content;
        const isQuiz = reply.includes('"question"') && reply.includes('{');
        res.json({ reply, isQuiz });
    } catch (error) {
        res.status(500).json({ error: "Lỗi AI Tutor." });
    }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));