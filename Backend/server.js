require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// 1. QUẢN LÝ API KEY (Xoay vòng để tránh Rate Limit)
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

function getGroqClient() {
    if (apiKeys.length === 0) return null;
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return new Groq({ apiKey: key });
}

// 2. HÀM LỌC JSON AN TOÀN (Chống ký tự lạ làm crash JSON.parse)
const safeParse = (str) => {
    try {
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        let cleaned = jsonMatch[0]
            .replace(/[\u0000-\u001F]+/g, " ") 
            .replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, "\\\\");
        return JSON.parse(cleaned);
    } catch (e) { return null; }
};

// 3. DANH SÁCH CHỦ ĐỀ TOÁN (Tăng tính đa dạng)
const mathTopics = [
    "Linear equations with two variables", "Quadratic functions and graphs",
    "Ratios and Proportions", "Right triangle trigonometry",
    "Circle equations in XY-plane", "Exponential growth and decay",
    "Systems of linear inequalities", "Polynomial factors and graphs"
];

// 4. API PRACTICE (Tạo câu hỏi đơn lẻ)
app.get('/api/sat-question', async (req, res) => {
    const category = req.query.category || 'math';
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "Missing API Key" });

    const topic = category === 'math' ? mathTopics[Math.floor(Math.random() * mathTopics.length)] : category;
    const seed = Math.floor(Math.random() * 100000);

    // ÉP AI DÙNG TIẾNG ANH CHO CÂU HỎI QUA SYSTEM ROLE
    const prompt = `Task: Generate one unique SAT ${category} question. Topic: ${topic}. Seed: ${seed}.
    STRICT LANGUAGE RULES:
    - "passage", "question", "options" MUST BE IN ENGLISH.
    - "step_by_step_explanation" MUST BE IN VIETNAMESE.
    - NO LaTeX. Use ^ for powers.
    - RETURN ONLY JSON.`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an SAT Expert. You always provide questions in English and explanations in Vietnamese.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.5, // Tăng nhẹ để tránh lặp câu hỏi
            response_format: { type: "json_object" }
        });

        const data = safeParse(completion.choices[0]?.message?.content || "");
        if (data) {
            // Trả về cả 2 kiểu Key để tương thích mọi phiên bản Frontend
            res.json({
                passage: data.passage || null,
                question: data.question || data.text || "Question content missing",
                options: data.options || [],
                answer: data.answer || "A",
                step_by_step_explanation: data.step_by_step_explanation || data.explanation || "Không có giải thích.",
                explanation: data.explanation || data.step_by_step_explanation || ""
            });
        } else { throw new Error("JSON Parse Error"); }
    } catch (e) {
        res.status(500).json({ error: "Lỗi tạo câu hỏi" });
    }
});

// 5. API QUIZ (Tạo bộ đề - Sửa lỗi kết nối page.tsx)
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const client = getGroqClient();
    
    const prompt = `Create a ${count}-question SAT ${subject} quiz. Difficulty: ${difficulty}.
    STRICT RULES:
    1. "text", "options", "passage" fields MUST BE IN ENGLISH.
    2. "explanation" field MUST BE IN VIETNAMESE.
    3. JSON Format: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}
    Note: "correct" is index 0, 1, 2, or 3.`;

    try {
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.6,
            response_format: { type: "json_object" }
        });

        const data = safeParse(completion.choices[0]?.message?.content || "");
        
        if (data && data.questions) {
            // Mapping dữ liệu để "đỡ" lỗi cho Frontend nếu page.tsx dùng key khác
            const finalized = data.questions.map(q => ({
                ...q,
                question: q.text, // Backup cho key 'question'
                answer: String.fromCharCode(65 + (q.correct || 0)) // Chuyển 0 -> A, 1 -> B...
            }));
            res.json({ questions: finalized });
        } else {
            res.status(422).json({ error: "AI Format Error" });
        }
    } catch (e) {
        res.status(500).json({ error: "Lỗi kết nối AI" });
    }
});

// 6. API AI TUTOR
app.post('/api/ai-tutor/chat', async (req, res) => {
    const client = getGroqClient();
    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a friendly SAT Tutor. Speak VIETNAMESE. Only use English for SAT academic terms or questions. Keep it concise.' },
                { role: 'user', content: req.body.message }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
        });
        const reply = completion.choices[0].message.content;
        res.json({ reply, isQuiz: reply.trim().startsWith('{') });
    } catch (e) {
        res.status(500).json({ error: "Tutor error" });
    }
});

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.timeout = 60000; // Tăng lên 60s cho các bộ Quiz dài