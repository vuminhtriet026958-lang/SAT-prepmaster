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

    // 1. CẤU HÌNH CHI TIẾT TỪNG MÔN (Phòng chống nhầm môn)
    const categoryConfigs = {
        math: {
            topics: ["Linear equations", "Quadratic functions", "Systems of equations", "Geometry", "Ratios", "Circle theorems"],
            rules: "FOCUS: Algebra and Geometry. Use variables, numbers, and math word problems. NO PASSAGES."
        },
        reading: {
            topics: ["Literature", "Social Studies", "History", "Natural Science"],
            rules: "FOCUS: Information and Ideas. MUST include a 60-90 word academic passage. Question must relate to the passage."
        },
        writing: {
            topics: ["Standard English Conventions", "Punctuation", "Verb Tense", "Sentence Structure"],
            rules: "FOCUS: Grammar and effective language use. Provide a short passage (40-60 words) with a specific error to fix."
        }
    };

    const config = categoryConfigs[category] || categoryConfigs.math;
    const selectedTopic = config.topics[Math.floor(Math.random() * config.topics.length)];
    const timestamp = Date.now();

    // 2. PROMPT SIÊU CHI TIẾT - CẤM TIẾNG VIỆT TUYỆT ĐỐI
    const prompt = `
    ### ROLE: Senior SAT Content Specialist.
    ### TASK: Generate ONE (1) UNIQUE SAT ${category.toUpperCase()} question.
    ### TOPIC: ${selectedTopic}. ID: ${timestamp}

    ### CONTENT RULES:
    - ${config.rules}
    - Style: Official Digital SAT (Bluebook) style.

    ### STRICT LANGUAGE RULES:
    - ALL FIELDS (passage, question, options, step_by_step_explanation) MUST BE 100% ENGLISH.
    - DO NOT USE VIETNAMESE UNDER ANY CIRCUMSTANCES.
    - If any Vietnamese word is found, the output is considered a failure.

    ### OUTPUT FORMAT (STRICT JSON):
    {
        "passage": "Academic English text (null only for Math if not needed)",
        "question": "English question text",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "answer": "A",
        "step_by_step_explanation": "Detailed step-by-step logic in English."
    }`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are an SAT Expert. Current Mode: ${category.toUpperCase()}. You only use English. You strictly output valid JSON.` 
                },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.4, // Tăng nhẹ để câu hỏi luôn mới
            max_tokens: 2500,
            response_format: { type: "json_object" }
        });

        const rawContent = completion.choices[0]?.message?.content || "";
        const data = JSON.parse(rawContent);

        // 3. TRẢ VỀ DỮ LIỆU ĐÃ ĐƯỢC LỌC AN TOÀN
        res.json({
            // Ép buộc hiện passage cho Reading/Writing
            passage: (category !== 'math' && (!data.passage || data.passage === "null")) 
                     ? "No passage provided. Please check the content." 
                     : safeStr(data.passage),
            question: safeStr(data.question || data.text),
            options: Array.isArray(data.options) ? data.options.map(safeStr) : ["A","B","C","D"],
            answer: safeStr(data.answer).toUpperCase().charAt(0),
            step_by_step_explanation: safeStr(data.step_by_step_explanation || data.explanation)
        });

    } catch (error) {
        console.error("Practice API Error:", error);
        res.status(500).json({ 
            error: "AI is busy.", 
            question: "Lỗi kết nối AI. Vui lòng bấm 'Next' để thử lại." 
        });
    }
});

// --- 4. API QUIZ ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "No API Key" });

    // 1. CHỈ THỊ RIÊNG CHO TỪNG MÔN (Dùng để ép AI hiện Passage)
    const subjectInstruction = {
        math: `FOCUS: Algebra, Geometry, Data. Use numbers/variables. Passage field should be null unless it is a Word Problem.`,
        reading: `FOCUS: Information/Ideas. MUST include a 60-100 word academic passage for EVERY question. Question must be based on the passage.`,
        writing: `FOCUS: Standard English Conventions. MUST include a 40-60 word passage with a grammatical error to be corrected.`
    };

    const currentInstruction = subjectInstruction[subject] || subjectInstruction.reading;

    // 2. PROMPT SIÊU CHI TIẾT VỚI LỆNH CẤM TIẾNG VIỆT
    const prompt = `
    ### IDENTITY: Senior SAT Content Engineer.
    ### TASK: Create a ${count}-question Digital SAT ${subject.toUpperCase()} quiz.
    ### DIFFICULTY: ${difficulty}.

    ### CONTENT REQUIREMENTS:
    - ${currentInstruction}
    - Each question must follow the official Digital SAT Bluebook format.

    ### LANGUAGE PROTOCOL (STRICT):
    - "text", "passage", "options" fields: MUST BE 100% ENGLISH. 
    - CRITICAL: NO VIETNAMESE ALLOWED in these 3 fields. 
    - "explanation" field: MUST BE 100% VIETNAMESE (Giải thích chi tiết các bước làm bài).

    ### FORMAT: Return ONLY a valid JSON object.
    {
      "questions": [
        {
          "text": "The English question text...",
          "passage": "The English academic passage text...",
          "options": ["A) ", "B) ", "C) ", "D) "],
          "correct": 0,
          "explanation": "Giải thích chi tiết bằng tiếng Việt..."
        }
      ]
    }`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are an SAT Expert. You strictly use English for test content and Vietnamese for explanations. Subject Mode: ${subject.toUpperCase()}. If you use Vietnamese in the question, the user will fail their exam.` 
                },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2, // Thấp để giữ logic chuẩn
            max_tokens: 4000, 
            response_format: { type: "json_object" }
        });

        const rawData = JSON.parse(completion.choices[0].message.content);
        
        // 3. HẬU KIỂM VÀ LÀM SẠCH DỮ LIỆU
        if (!rawData.questions || !Array.isArray(rawData.questions)) {
            throw new Error("Invalid structure from AI");
        }

        const finalizedQuestions = rawData.questions.map(q => {
            const hasPassage = q.passage && q.passage.length > 10 && q.passage !== "null";
            
            return {
                text: safeStr(q.text || q.question),
                question: safeStr(q.text || q.question),
                // Ép buộc hiện passage cho Reading/Writing nếu AI quên
                passage: (subject !== 'math' && !hasPassage) 
                         ? "Please read the provided text to answer the question below." 
                         : (hasPassage ? safeStr(q.passage) : null),
                options: Array.isArray(q.options) ? q.options.map(safeStr) : ["A","B","C","D"],
                correct: isNaN(parseInt(q.correct)) ? 0 : parseInt(q.correct),
                explanation: safeStr(q.explanation),
                answer: String.fromCharCode(65 + (parseInt(q.correct) || 0))
            };
        });

        res.json({ questions: finalizedQuestions });
    } catch (error) {
        console.error("QUIZ GENERATION ERROR:", error);
        res.status(500).json({ error: "Server không thể tạo bộ đề. Vui lòng thử lại sau 5 giây." });
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