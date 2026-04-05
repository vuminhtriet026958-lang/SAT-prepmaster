require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. HỆ THỐNG XOAY VÒNG API KEYS (Fixed) ---
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

function getGroqClient() {
    if (apiKeys.length === 0) return null;
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return new Groq({ apiKey: key });
}

// --- 2. HÀM LÀM SẠCH DỮ LIỆU (Ngăn chặn lỗi sập web & Format JSON) ---
const cleanAndParse = (content, category) => {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const data = JSON.parse(jsonMatch[0]);

        // Ép dữ liệu về kiểu String để không bao giờ bị lỗi .replace() ở Frontend
        const safeString = (val) => val ? String(val) : "";

        return {
            passage: data.passage ? safeString(data.passage) : (category === 'math' ? null : "Please read the following text carefully."),
            question: safeString(data.question || data.text || "No question content."),
            options: Array.isArray(data.options) ? data.options.map(safeString) : ["A) ", "B) ", "C) ", "D) "],
            answer: safeString(data.answer || "A").toUpperCase().charAt(0),
            step_by_step_explanation: safeString(data.step_by_step_explanation || data.explanation || "Giải thích đang được cập nhật.")
        };
    } catch (e) { return null; }
};

// --- 3. API PRACTICE (Prompt chi tiết + Chống nhầm môn) ---
app.get('/api/sat-question', async (req, res) => {
    const category = (req.query.category || 'math').toLowerCase();
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "No API Key" });

    const mathSubTopics = ["Linear equations", "Quadratic functions", "Ratios", "Trigonometry", "Circle equations", "Exponential growth"];
    const randomTopic = mathSubTopics[Math.floor(Math.random() * mathSubTopics.length)];
    const randomSeed = Math.floor(Math.random() * 10000);

    // Prompt siêu chi tiết như bản cũ của bạn nhưng có thêm System Role
    const prompt = `
    Role: SAT Expert Test Developer.
    Task: Generate ONE UNIQUE SAT ${category.toUpperCase()} question.
    
    STRICT CONTENT RULES:
    ${category === 'math' ? `
    - TOPIC: ${randomTopic} (Seed: ${randomSeed}).
    - REQUIREMENT: Create new numbers and unique real-world context.
    - NO LaTeX: Use ^ for powers (x^2). No $ symbols.` : `
    - FOCUS: ${category === 'writing' ? 'Standard English Conventions' : 'Information and Ideas'}.
    - PASSAGE: Must be a formal 50-100 word academic text. NOT NULL.`}

    STRICT LANGUAGE RULES:
    1. "passage", "question", "options" MUST BE ENGLISH.
    2. "step_by_step_explanation" MUST BE VIETNAMESE.

    OUTPUT ONLY JSON:
    {
        "passage": "English text or null",
        "question": "English text",
        "options": ["A) ", "B) ", "C) ", "D) "],
        "answer": "A",
        "step_by_step_explanation": "Giải thích chi tiết bằng tiếng Việt"
    }`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: `You are an SAT Expert. You only output JSON. Questions in English, Explanations in Vietnamese. Current Category: ${category}.` },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0, // Tuyệt đối không để AI sáng tạo linh tinh
        });

        const sanitized = cleanAndParse(completion.choices[0]?.message?.content, category);
        if (sanitized) res.json(sanitized);
        else throw new Error("Format Error");

    } catch (error) {
        res.status(500).json({ question: "AI Tutor đang bận, vui lòng thử lại.", options: ["A", "B", "C", "D"], answer: "A" });
    }
});

// --- 4. API QUIZ (Prompt chi tiết + Sửa lỗi đáp án) ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const client = getGroqClient();

    const prompt = `Create a ${count}-question SAT ${subject} quiz. Level: ${difficulty}.
    STRICT RULES:
    - Questions/Passages in ENGLISH.
    - Explanations in VIETNAMESE.
    - Logic: Ensure 'correct' (0-3) matches the 'options' and 'explanation'.
    - Format: {"questions": [{"text": "...", "passage": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}`;

    try {
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0].message.content);
        const fixed = data.questions.map(q => ({
            ...q,
            question: q.text || q.question, // Trả về cả 2 key để Frontend không lỗi
            answer: String.fromCharCode(65 + (q.correct || 0))
        }));
        res.json({ questions: fixed });
    } catch (e) { res.status(500).json({ error: "Quiz Error" }); }
});

// --- 5. API AI TUTOR CHAT ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    const client = getGroqClient();
    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a friendly SAT Tutor. Help with Math, Reading, Writing. Answer in Vietnamese, use English for SAT terms.' },
                { role: 'user', content: req.body.message }
            ],
            model: 'llama-3.1-8b-instant',
        });
        const reply = completion.choices[0].message.content;
        res.json({ reply, isQuiz: reply.trim().startsWith('{') });
    } catch (e) { res.status(500).json({ error: "Tutor error" }); }
});

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.timeout = 60000;