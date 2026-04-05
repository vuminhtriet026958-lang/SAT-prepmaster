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
        console.error("CRITICAL: Không tìm thấy API Key trong .env!");
        return null;
    }
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return new Groq({ apiKey: key });
}

// --- 2. HÀM LỌC RÁC JSON "SIÊU CẤP" ---
const safeParse = (str) => {
    try {
        // Tìm đoạn nằm giữa { và }
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        let cleaned = jsonMatch[0]
            // Xử lý lỗi "Bad control character" (xuống dòng, tab trong chuỗi)
            .replace(/[\u0000-\u001F]+/g, " ")
            // Xử lý lỗi AI hay quên thoát dấu gạch chéo ngược
            .replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, "\\\\");
            
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Lỗi Parse JSON thực tế:", e.message);
        return null;
    }
};

// --- 3. DANH SÁCH CHỦ ĐỀ TOÁN (CHỐNG LẶP) ---
const mathTopics = [
    "Linear functions: interpreting slope and intercept in context",
    "Systems of equations: real-world price/quantity problems",
    "Quadratic equations: modeling projectile motion or area",
    "Percentages: multi-step increase/decrease and tax problems",
    "Data analysis: mean, median, and standard deviation comparison",
    "Geometry: calculating volume/surface area of complex shapes",
    "Trigonometry: solving for sides/angles in right triangles",
    "Exponential growth: modeling population or interest rates"
];

// --- 4. BỘ KHUNG PROMPT SIÊU CHI TIẾT ---
const getMathPrompt = (topic, seed) => `
Role: Senior SAT Math Professor. ID: ${seed}.
Task: Create a unique SAT Math question.
Topic: ${topic}.
RULES:
1. CONTENT: Only ONE correct answer. Arithmetic must be clean.
2. LANGUAGE: "question" and "options" MUST BE ENGLISH. "explanation" MUST BE VIETNAMESE.
3. FORMAT: NO LaTeX. Use ^ for powers (x^2).
Return ONLY JSON:
{
  "passage": null,
  "question": "English text",
  "options": ["A) ", "B) ", "C) ", "D) "],
  "answer": "A",
  "explanation": "Giải thích chi tiết bằng tiếng Việt"
}`;

const getReadingWritingPrompt = (category, seed) => {
    const isWriting = category === 'writing';
    return `
Role: SAT ${category} Expert. ID: ${seed}.
RULES:
1. PASSAGE (REQUIRED): Write a 100-word English passage.
2. CONTENT: ${isWriting ? "Focus on grammar/punctuation/transitions." : "Focus on main idea/inference."}
3. LANGUAGE: Passage/Question/Options in ENGLISH. Explanation in VIETNAMESE.
Return ONLY JSON:
{
  "passage": "English passage content",
  "question": "English question",
  "options": ["A) ", "B) ", "C) ", "D) "],
  "answer": "A",
  "explanation": "Giải thích chi tiết bằng tiếng Việt"
}`;
};

// --- 5. API PRACTICE (ĐÃ ĐỒNG NHẤT HÓA KEY) ---
app.get('/api/sat-question', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { category } = req.query;
    const seed = Math.floor(Math.random() * 1000000);
    const client = getGroqClient();

    if (!client) return res.status(500).json({ error: "API Key missing" });

    let finalPrompt = (category === 'math') 
        ? getMathPrompt(mathTopics[Math.floor(Math.random() * mathTopics.length)], seed)
        : getReadingWritingPrompt(category, seed);

    try {
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: finalPrompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3, // Thấp để đảm bảo JSON chuẩn
            response_format: { type: "json_object" }
        });

        const data = safeParse(completion.choices[0]?.message?.content || "");

        if (data) {
            // ÉP KIỂU DỮ LIỆU: Đảm bảo Frontend luôn nhận được đúng tên key
            res.json({
                passage: data.passage || null,
                question: data.question || data.text || "Question content missing",
                options: data.options || [],
                answer: data.answer || "A",
                explanation: data.explanation || data.step_by_step_explanation || ""
            });
        } else {
            throw new Error("Invalid AI Response");
        }
    } catch (error) {
        console.error("Practice Error:", error.message);
        res.status(500).json({ error: "Lỗi tạo câu hỏi." });
    }
});

// --- 6. API QUIZ ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const prompt = `Create an SAT ${subject} quiz (${difficulty}) with ${count} questions. 
    Content: English. Explanation: Vietnamese. 
    Format: {"questions": [{"passage": "...", "question": "...", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "explanation": "..."}]}`;

    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.4,
            response_format: { type: "json_object" }
        });

        const data = safeParse(completion.choices[0]?.message?.content || "");
        if (data && data.questions) {
            // Normalize từng câu trong mảng quiz
            data.questions = data.questions.map(q => ({
                passage: q.passage || null,
                question: q.question || q.text || "",
                options: q.options || [],
                answer: q.answer || "A",
                explanation: q.explanation || ""
            }));
            res.json(data);
        } else {
            throw new Error("Quiz format error");
        }
    } catch (error) {
        res.status(500).json({ error: "Lỗi tạo Quiz." });
    }
});

// --- 7. API CHAT TUTOR (BẢO VỆ NGHIÊM NGẶT) ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [
                { 
                  role: 'system', 
                  content: 'You are a friendly SAT Tutor. Speak VIETNAMESE. NEVER show JSON, code blocks, or say "Here is the JSON". Keep answers natural and encouraging.' 
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
        res.status(500).json({ error: "Lỗi Tutor." });
    }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));