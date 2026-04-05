require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. HÀM HỖ TRỢ TOÀN CỤC (Dùng chung để fix lỗi .replace) ---
const safeStr = (v) => v ? String(v) : "";

// --- 2. HỆ THỐNG XOAY VÒNG API KEYS ---
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

function getGroqClient() {
    if (apiKeys.length === 0) return null;
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log(`Using API Key index: ${currentKeyIndex}`);
    return new Groq({ apiKey: key });
}

// --- 3. API PRACTICE ---
app.get('/api/sat-question', async (req, res) => {
    const category = (req.query.category || 'math').toLowerCase();
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "Missing API Key" });

    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 999999);
    const mathSubTopics = ["Linear equations", "Quadratic functions", "Systems of equations", "Geometry", "Ratios"];
    const currentTopic = category === 'math' ? mathSubTopics[Math.floor(Math.random() * mathSubTopics.length)] : category;

    const prompt = `
    ### IDENTITY: Senior SAT Developer. ID: ${timestamp}-${randomSeed}
    ### TASK: Generate ONE UNIQUE SAT ${category.toUpperCase()} question.
    ### LANGUAGE: EVERYTHING MUST BE IN ENGLISH. NO VIETNAMESE.
    ### FORMAT: Return ONLY JSON.
    {
        "passage": "English text",
        "question": "English text",
        "options": ["A) ", "B) ", "C) ", "D) "],
        "answer": "A",
        "step_by_step_explanation": "Detailed English explanation"
    }`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: `SAT Expert. Category: ${category}. Strictly English.` },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: "json_object" }
        });

        const rawContent = completion.choices[0]?.message?.content || "";
        const data = JSON.parse(rawContent);

        // Trả về dữ liệu đã được làm sạch bằng safeStr
        res.json({
            passage: data.passage ? safeStr(data.passage) : (category === 'math' ? null : "Please read the text."),
            question: safeStr(data.question || data.text),
            options: Array.isArray(data.options) ? data.options.map(safeStr) : ["A","B","C","D"],
            answer: safeStr(data.answer).toUpperCase().charAt(0),
            step_by_step_explanation: safeStr(data.step_by_step_explanation || data.explanation)
        });
    } catch (error) {
        console.error("Practice Error:", error);
        res.status(500).json({ error: "AI is busy. Please try again." });
    }
});

// --- 4. API QUIZ ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "No API Key" });

    const prompt = `Create a ${count}-question SAT ${subject} quiz. Level: ${difficulty}. 
    STRICT: Questions in English, Explanations in Vietnamese.
    JSON Format: {"questions": [{"text": "...", "passage": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You strictly output JSON.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1, 
            max_tokens: 4000, 
            response_format: { type: "json_object" }
        });

        const rawData = JSON.parse(completion.choices[0].message.content);
        const finalizedQuestions = rawData.questions.map(q => ({
            text: safeStr(q.text || q.question),
            question: safeStr(q.text || q.question),
            passage: q.passage ? safeStr(q.passage) : null,
            options: Array.isArray(q.options) ? q.options.map(safeStr) : ["A", "B", "C", "D"],
            correct: parseInt(q.correct) || 0,
            explanation: safeStr(q.explanation),
            answer: String.fromCharCode(65 + (parseInt(q.correct) || 0))
        }));

        res.json({ questions: finalizedQuestions });
    } catch (error) {
        res.status(500).json({ error: "Quiz Generation Error" });
    }
});

// --- 5. AI TUTOR CHAT ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    const client = getGroqClient();
    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'SAT Tutor. Answer in Vietnamese.' },
                { role: 'user', content: req.body.message }
            ],
            model: 'llama-3.1-8b-instant',
        });
        res.json({ reply: completion.choices[0].message.content });
    } catch (e) { res.status(500).json({ error: "Tutor error" }); }
});

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err.stack);
    res.status(500).json({ error: "Server encountered an issue." });
});

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.timeout = 60000;