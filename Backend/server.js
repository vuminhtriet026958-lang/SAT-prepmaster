require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. QUẢN LÝ XOAY VÒNG API KEY (Chống Crash) ---
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

function getGroqClient() {
    if (apiKeys.length === 0) {
        console.error("CRITICAL: Không tìm thấy API Key!");
        return null;
    }
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return new Groq({ apiKey: key });
}

// --- 2. HÀM LỌC RÁC JSON (Đã nâng cấp để chống lỗi Bad Control Character) ---
const safeParse = (str) => {
    try {
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        let cleaned = jsonMatch[0]
            .replace(/[\u0000-\u001F]+/g, " ") 
            .replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, "\\\\");
        return JSON.parse(cleaned);
    } catch (e) {
        return null;
    }
};

// --- 3. CHỦ ĐỀ TOÁN (Đảm bảo tính đa dạng) ---
const mathTopics = [
    "Linear equations with two variables", "Quadratic functions and graphs",
    "Ratios and Proportions", "Right triangle trigonometry",
    "Circle equations in XY-plane", "Exponential growth and decay"
];

// --- 4. API PRACTICE (Đồng nhất hóa để không lỗi practice.tsx) ---
app.get('/api/sat-question', async (req, res) => {
    const { category } = req.query;
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "Missing API Key" });

    const seed = Math.floor(Math.random() * 10000);
    const topic = category === 'math' ? mathTopics[Math.floor(Math.random() * mathTopics.length)] : category;

    const prompt = `Role: SAT Expert. Task: Create a unique SAT ${category} question. Topic: ${topic}. Seed: ${seed}.
    RULES: 
    - Question/Passage/Options MUST BE ENGLISH. 
    - Explanation MUST BE VIETNAMESE.
    - NO LaTeX. Use ^ for powers.
    - Return ONLY JSON: {"passage": "...", "question": "...", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "..."}`;

    try {
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const data = safeParse(completion.choices[0]?.message?.content || "");
        if (data) {
            // TRẢ VỀ CẢ 2 KEY (explanation và step_by_step_explanation) ĐỂ CHỐNG XUNG ĐỘT FRONTEND
            res.json({
                passage: data.passage || null,
                question: data.question || data.text || "No question content",
                options: data.options || [],
                answer: data.answer || "A",
                step_by_step_explanation: data.step_by_step_explanation || data.explanation || "Không có giải thích.",
                explanation: data.explanation || data.step_by_step_explanation || "" 
            });
        } else { throw new Error("AI Error"); }
    } catch (e) { res.status(500).json({ error: "Lỗi tạo câu hỏi" }); }
});

// --- 5. API QUIZ (SỬA LỖI XUNG ĐỘT VỚI page.tsx) ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const client = getGroqClient();
    
    // ÉP AI CHỈ DÙNG TIẾNG ANH CHO CÂU HỎI
    const prompt = `Create a ${count}-question SAT ${subject} quiz (${difficulty}). 
    STRICT RULES:
    1. Everything in English EXCEPT the "explanation" field (Vietnamese).
    2. Format: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}
    Note: "correct" is index 0-3 (0 for A, 1 for B, etc.)`;

    try {
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const data = safeParse(completion.choices[0]?.message?.content || "");
        
        if (data && data.questions) {
            // ĐỒNG NHẤT HÓA BIẾN: Code cũ của bạn dùng "text" và "correct", code mới dùng "question" và "answer"
            // Mình sẽ trả về CẢ HAI để file page.tsx cũ hay mới đều chạy được.
            const finalizedQuestions = data.questions.map(q => ({
                text: q.text || q.question || "", 
                question: q.question || q.text || "",
                options: q.options || [],
                correct: (q.correct !== undefined) ? q.correct : (q.answer === "A" ? 0 : q.answer === "B" ? 1 : q.answer === "C" ? 2 : 3),
                answer: q.answer || (q.correct === 0 ? "A" : q.correct === 1 ? "B" : q.correct === 2 ? "C" : "D"),
                explanation: q.explanation || "Chưa có giải thích.",
                passage: q.passage || null
            }));

            res.json({ questions: finalizedQuestions });
        } else {
            res.status(422).json({ error: "AI Format Error" });
        }
    } catch (e) { res.status(500).json({ error: "Lỗi kết nối AI" }); }
});

// --- 6. API AI TUTOR ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    const client = getGroqClient();
    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a friendly SAT Tutor. Speak VIETNAMESE. English only for SAT terms. No JSON unless asked.' },
                { role: 'user', content: req.body.message }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
        });
        const reply = completion.choices[0].message.content;
        res.json({ reply, isQuiz: reply.trim().startsWith('{') });
    } catch (e) { res.status(500).json({ error: "Tutor error" }); }
});

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.timeout = 60000; // Tăng timeout lên 60s cho các Quiz dài