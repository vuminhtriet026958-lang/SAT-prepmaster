require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. HỆ THỐNG XOAY VÒNG API KEYS ---
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

function getGroqClient() {
    if (apiKeys.length === 0) return null;
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return new Groq({ apiKey: key });
}

// --- 2. HÀM LÀM SẠCH JSON (Fix lỗi AI trả về ```json ... ```) ---
const cleanAndParseJSON = (text) => {
    try {
        // Tìm đoạn nằm giữa { và } để loại bỏ chữ "json" dư thừa hoặc lời dẫn
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        return null;
    }
};

// --- 3. API PRACTICE (Fix lỗi nhầm Reading/Math & Tiếng Việt) ---
app.get('/api/sat-question', async (req, res) => {
    const category = req.query.category || 'math';
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "No API Key" });

    const mathSubTopics = ["Linear equations", "Quadratic functions", "Ratios", "Trigonometry", "Circle equations", "Exponential growth"];
    const randomTopic = mathSubTopics[Math.floor(Math.random() * mathSubTopics.length)];
    const randomSeed = Math.floor(Math.random() * 10000);

    // Ép AI bằng cách nhắc lại Category ở đầu mỗi Prompt
    let topicInstruction = `Generate a UNIQUE SAT ${category.toUpperCase()} question. `;
    
    if (category === 'math') {
        topicInstruction += `Topic: ${randomTopic}. Seed: ${randomSeed}. Use ^ for powers. No LaTeX.`;
    } else {
        topicInstruction += `Focus on ${category === 'writing' ? 'Standard English Conventions' : 'Information and Ideas'}.`;
    }

    const prompt = `Role: SAT Expert.
    Task: ${topicInstruction}
    STRICT RULES:
    1. Question/Passage/Options MUST BE IN ENGLISH.
    2. Explanation MUST BE IN VIETNAMESE.
    3. Return ONLY JSON: {"passage": "text or null", "question": "text", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "..."}`;

    try {
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1, // Thấp để tránh AI "sáng tạo" quá đà ra tiếng Việt
        });

        const parsedData = cleanAndParseJSON(completion.choices[0]?.message?.content || "");
        
        if (parsedData) {
            res.json({
                passage: parsedData.passage || null,
                question: parsedData.question || "No question content",
                options: parsedData.options || [],
                answer: parsedData.answer || "A",
                step_by_step_explanation: parsedData.step_by_step_explanation || parsedData.explanation || "Không có giải thích."
            });
        } else { throw new Error("JSON Error"); }
    } catch (error) {
        res.status(500).json({ question: "Lỗi kết nối AI, vui lòng thử lại." });
    }
});

// --- 4. API QUIZ (Sửa lỗi đáp án sai & Cấu trúc JSON) ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const client = getGroqClient();
    
    // Yêu cầu AI kiểm tra kỹ logic đáp án
    const prompt = `Create a ${count}-question SAT quiz on ${subject}. Difficulty: ${difficulty}.
    STRICT RULES:
    - Language: Questions in English, Explanations in Vietnamese.
    - Logic: Ensure the 'correct' index (0-3) matches the actual correct option.
    - Format: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}`;

    try {
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
        });
        const data = cleanAndParseJSON(completion.choices[0]?.message?.content);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Không thể tạo Quiz." });
    }
});

// --- 5. API AI TUTOR (Xử lý chuỗi JSON sạch sẽ) ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    const { message } = req.body;
    const client = getGroqClient();
    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a friendly SAT Tutor. Answer in Vietnamese, use English for SAT terms. If providing a question, use JSON.' },
                { role: 'user', content: message }
            ],
            model: 'llama-3.1-8b-instant',
        });

        const reply = completion.choices[0].message.content;
        const isJson = reply.trim().includes('{') && reply.trim().includes('}');
        
        res.json({ reply, isQuiz: isJson });
    } catch (error) {
        res.status(500).json({ error: "Tutor đang bận!" });
    }
});

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.timeout = 60000;