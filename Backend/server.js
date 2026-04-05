require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- HÀM LẤY API KEY XOAY VÒNG ---
function getGroqClient() {
    const keysString = process.env.GROQ_API_KEYS || "";
    const keys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
    const selectedKey = keys.length > 0 
        ? keys[Math.floor(Math.random() * keys.length)] 
        : process.env.GROQ_API_KEY;
    console.log(`Using Key: ${selectedKey ? selectedKey.substring(0, 10) : "MISSING"}...`);
    return new Groq({ apiKey: selectedKey });
}

// --- 1. API Tạo câu hỏi đơn lẻ (Practice) ---
app.get('/api/sat-question', async (req, res) => {
    const category = req.query.category || 'math';
    let topicInstruction = "";

    // Phân loại logic cực kỳ nghiêm ngặt để tránh bị loạn môn
    if (category === 'math') {
        topicInstruction = `Generate a UNIQUE SAT MATH question. 
        - Requirement: Use REAL-WORLD context. 
        - Math Format: Use standard text (e.g., x^2, sqrt(x)). DO NOT use LaTeX.
        - Important: Set 'passage' to null.`;
    } else if (category === 'reading') {
        topicInstruction = `Generate an SAT READING question. 
        - Requirement: MUST provide a 'passage' (100-150 words) from an academic context.
        - Question: Must be based strictly on the provided passage.`;
    } else if (category === 'writing') {
        topicInstruction = `Generate an SAT WRITING & LANGUAGE question. 
        - Requirement: Provide a 'passage' (a short paragraph) with a grammatical underlined part.
        - Question: Ask to improve the underlined part or fix a punctuation error.`;
    }

    const prompt = `Role: Senior SAT Expert.
    Task: ${topicInstruction}
    
    STRICT RULES:
    1. Language: Passage, Question, and Options MUST be in ENGLISH.
    2. Explanation: 'step_by_step_explanation' MUST be in VIETNAMESE.
    3. Output: Return ONLY a valid JSON object.
    
    Structure:
    {
      "passage": "English text here for Reading/Writing, or null for Math",
      "question": "English question content",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "A",
      "step_by_step_explanation": "Giải thích chi tiết bằng tiếng Việt"
    }`;

    try {
        const groqClient = getGroqClient();
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant', 
            temperature: 0, // Đưa về 0 để AI bớt "sáng tạo" sai ngôn ngữ
            max_tokens: 1000
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
        res.status(500).json({ error: "Lỗi tạo câu hỏi." });
    }
});

// --- 2. API Tạo trọn bộ Quiz ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const prompt = `Create a ${count}-question SAT quiz on ${subject} with ${difficulty} difficulty.
    - Content: English. Explanation: Vietnamese.
    - Double check math logic.
    - Return ONLY JSON: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "..."}]}`;

    try {
        const groqClient = getGroqClient();
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1
        });
        const jsonMatch = chatCompletion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        res.status(500).json({ error: "Lỗi tạo Quiz." });
    }
});

// --- 3. API AI Tutor Chat (Fix lỗi dấu ngoặc) ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    const { message } = req.body;
    try {
        const groqClient = getGroqClient();
        const completion = await groqClient.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an SAT Tutor. Always speak Vietnamese. If you send a JSON question, wrap it inside {}.' },
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