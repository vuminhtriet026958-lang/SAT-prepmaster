require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- HÀM LẤY API KEY XOAY VÒNG (GIÚP CHẠY NHIỀU KEY) ---
function getGroqClient() {
    const keysString = process.env.GROQ_API_KEYS || "";
    const keys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
    
    // Chọn key ngẫu nhiên hoặc dùng key đơn nếu không có danh sách
    const selectedKey = keys.length > 0 
        ? keys[Math.floor(Math.random() * keys.length)] 
        : process.env.GROQ_API_KEY;

    if (!selectedKey) {
        console.error("CRITICAL: No API Key found!");
    }
    return new Groq({ apiKey: selectedKey });
}

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// --- 1. API Tạo câu hỏi đơn lẻ (Giữ nguyên Prompt chi tiết của Triết) ---
app.get('/api/sat-question', async (req, res) => {
    const category = req.query.category || 'math';
    const mathSubTopics = ["Linear equations with two variables", "Quadratic functions and graphs", "Ratios and Proportions", "Right triangle trigonometry", "Circle equations in XY-plane", "Exponential growth and decay"];
    const randomTopic = mathSubTopics[Math.floor(Math.random() * mathSubTopics.length)];
    const randomSeed = Math.floor(Math.random() * 10000);
    
    let topicInstruction = "";
    if (category === 'math') {
        topicInstruction = `Generate a UNIQUE SAT Math question. TOPIC: ${randomTopic} (Seed: ${randomSeed}). Use ^ for powers. Return ONLY JSON.`;
    } else if (category === 'writing') {
        topicInstruction = `Generate an SAT WRITING & LANGUAGE question. Focus: Standard English Conventions.`;
    } else {
        topicInstruction = `Generate an SAT READING question. Focus: Information and Ideas.`;
    }

    const prompt = `Role: SAT Expert. Task: ${topicInstruction}
    STRICT RULES: Question/Passage in ENGLISH. Explanation in VIETNAMESE. 
    Return ONLY JSON: {"passage": "text or null", "question": "text", "options": ["A) ", "B) ", "C) ", "D) "], "answer": "A", "step_by_step_explanation": "text"}`;

    try {
        const groqClient = getGroqClient();
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1, // Thấp để chính xác nhất
            max_tokens: 1000
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content || "";
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/); // Trích xuất JSON sạch

        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("No JSON found");
        }
    } catch (error) {
        res.status(500).json({ question: "AI đang bận, hãy nhấn 'Next' để thử lại." });
    }
});

// --- 2. API Tạo trọn bộ Quiz (Gia cố Logic đáp án) ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    let subjectName = subject === 'math' ? "SAT Math" : "SAT Verbal";

    const prompt = `Task: Create a ${count}-question SAT quiz on ${subjectName}. Difficulty: ${difficulty}.
    STRICT LOGIC: Double check all calculations. Solve the problem internally before setting the 'correct' field.
    The 'correct' field MUST be the integer index (0-3) of the right answer.
    Return ONLY JSON: {"questions": [{"text": "...", "options": ["A) ", "B) ", "C) ", "D) "], "correct": 0, "explanation": "Giải thích tiếng Việt"}]}`;

    try {
        const groqClient = getGroqClient();
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
        });
        const jsonMatch = chatCompletion.choices[0]?.message?.content.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        res.status(500).json({ error: "Lỗi tạo Quiz." });
    }
});

// --- 3. API AI Tutor Chat (Sửa lỗi hiển thị dấu ngoặc) ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    const { message } = req.body;
    try {
        const groqClient = getGroqClient();
        const completion = await groqClient.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a friendly SAT Tutor. Explain in Vietnamese. If you give a question, provide it as a JSON block. If not, just talk naturally.' },
                { role: 'user', content: message }
            ],
            model: 'llama-3.1-8b-instant',
        });

        const aiResponse = completion.choices[0].message.content;
        
        // KIỂM TRA JSON THÔNG MINH:
        // Nếu có JSON bên trong, web sẽ render Quiz. 
        // Chúng ta kiểm tra sự tồn tại của cấu trúc JSON thay vì startsWith('{')
        const isJson = /\{[\s\S]*\}/.test(aiResponse);
        
        res.json({ 
            reply: aiResponse, 
            isQuiz: isJson 
        });
    } catch (error) {
        res.status(500).json({ error: "AI Tutor đang bận!" });
    }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));