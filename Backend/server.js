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

    // 1. MỞ RỘNG TOPIC ĐA DẠNG (Đặc biệt là Math để không bị lặp hình học)
    const categoryConfigs = {
        math: {
            topics: [
                "Systems of linear equations with two variables (Show both equations clearly)", 
                "Quadratic functions and their graphs (Vertex/Factored form)",
                "Statistical inference: Margin of error and Confidence intervals",
                "Ratios, rates, and unit conversion problems",
                "Linear growth vs Exponential growth models",
                "Data analysis: Mean, Median, and Standard Deviation from tables"
            ],
            rules: "FOCUS: Algebra, Data Analysis, and Advanced Math. If equations are used, you MUST write them out in the 'question' field. NO PASSAGES."
        },
        reading: {
            topics: ["US/World Literature", "History/Social Studies", "Science Discoveries", "Global Economic Trends"],
            rules: "FOCUS: Reading Comprehension. You MUST provide an academic passage (70-100 words). The question MUST reference specific lines or ideas from the passage."
        },
        writing: {
            topics: ["Punctuation (Commas, Semicolons, Colons)", "Subject-Verb Agreement", "Sentence structure and transitions"],
            rules: "FOCUS: Grammar and Editing. Provide a short passage (40-60 words) with a clearly identified grammatical error to be corrected."
        }
    };

    const config = categoryConfigs[category] || categoryConfigs.math;
    const selectedTopic = config.topics[Math.floor(Math.random() * config.topics.length)];
    const timestamp = Date.now();

    // 2. PROMPT ÉP LOGIC: Cấm tiếng Việt + Buộc hiện phương trình/đoạn văn
    const prompt = `
    ### TASK: Generate ONE (1) UNIQUE SAT ${category.toUpperCase()} question.
    ### TOPIC: ${selectedTopic}.
    ### UNIQUE ID: ${timestamp}

    ### CONTENT CONSTRAINTS:
    - ${config.rules}
    - MATH RULE: Every system of equations must be explicitly written (e.g., "Given: 2x + 3y = 7 and x - y = 2").
    - VERBAL RULE: The "passage" field MUST NOT be empty or null for Reading/Writing.

    ### LANGUAGE: 100% ENGLISH ONLY. No Vietnamese.

    ### JSON STRUCTURE:
    {
        "passage": "Academic text here (or null for math)",
        "question": "The actual question (including equations if any)",
        "options": ["A) ", "B) ", "C) ", "D) "],
        "answer": "A",
        "step_by_step_explanation": "Detailed English logic"
    }`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: `You are an SAT Expert. Output ONLY raw JSON in English. Focus: ${category.toUpperCase()}.` },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.6, // Tăng nhẹ để tránh lặp câu hỏi cũ
            max_tokens: 3000,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0]?.message?.content || "{}");

        // 3. XỬ LÝ HẬU KỲ (Bảo hiểm dữ liệu)
        res.json({
            // Nếu Reading/Writing mà passage trống -> Điền nội dung mẫu tránh lỗi giao diện
            passage: (category !== 'math' && (!data.passage || data.passage === "null")) 
                     ? "The passage for this question is being updated. Please focus on the question context." 
                     : safeStr(data.passage),
            question: safeStr(data.question || data.text || "Question content missing."),
            options: Array.isArray(data.options) ? data.options.map(safeStr) : ["A","B","C","D"],
            answer: safeStr(data.answer).toUpperCase().charAt(0),
            step_by_step_explanation: safeStr(data.step_by_step_explanation || data.explanation)
        });

    } catch (error) {
        console.error("Practice API Error:", error);
        res.status(500).json({ error: "AI Busy", question: "Lỗi kết nối. Vui lòng bấm 'Next'!" });
    }
});

// --- 4. API QUIZ ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    const client = getGroqClient();
    if (!client) return res.status(500).json({ error: "No API Key" });

    // 1. CHI TIẾT HÓA TOPIC ĐỂ AI KHÔNG "LƯỜI"
    const quizConfigs = {
        math: {
            topics: ["Systems of equations", "Exponential growth", "Data Analysis", "Geometry"],
            instr: "Use numbers/variables. List equations clearly. Passage can be null."
        },
        reading: {
            topics: ["Science", "Literature", "History"],
            instr: "MANDATORY: Generate a 60-100 word academic passage for EACH question. The question must refer to this passage."
        },
        writing: {
            topics: ["Grammar", "Punctuation", "Transitions"],
            instr: "MANDATORY: Provide a 40-60 word passage with a grammatical error. The question asks how to fix it."
        }
    };

    const config = quizConfigs[subject] || quizConfigs.reading;
    const selectedTopic = config.topics[Math.floor(Math.random() * config.topics.length)];

    const prompt = `
    ### TASK: Create a ${count}-question SAT ${subject.toUpperCase()} quiz.
    ### TOPIC: ${selectedTopic}.
    ### INSTRUCTION: ${config.instr}

    ### RULES:
    - PASSAGE: For Reading/Writing, "passage" field MUST contain the story/text. DO NOT LEAVE EMPTY.
    - LANGUAGE: "text", "passage", "options" MUST be English. "explanation" MUST be Vietnamese.
    - NO VIETNAMESE in questions.

    ### JSON FORMAT:
    {
      "questions": [
        {
          "passage": "Full English passage text...",
          "text": "The English question...",
          "options": ["A) ", "B) ", "C) ", "D) "],
          "correct": 0,
          "explanation": "Giải thích chi tiết tiếng Việt..."
        }
      ]
    }`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: `SAT Generator. Mode: ${subject}. English for test, Vietnamese for teaching.` },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: "json_object" }
        });

        const rawData = JSON.parse(completion.choices[0].message.content);
        
        const finalizedQuestions = rawData.questions.map(q => {
            // Cải tiến: Kiểm tra đa dạng các trường hợp AI trả về (passage hoặc context)
            const passageContent = q.passage || q.context || q.content;
            const hasPassage = passageContent && passageContent.length > 5;
            
            return {
                text: safeStr(q.text || q.question),
                question: safeStr(q.text || q.question),
                // Fix: Đảm bảo nếu không phải Math thì luôn trả về string, không trả về null
                passage: (subject !== 'math') 
                         ? safeStr(passageContent || "The passage text is being generated...") 
                         : (hasPassage ? safeStr(passageContent) : null),
                options: Array.isArray(q.options) ? q.options.map(safeStr) : ["A","B","C","D"],
                correct: isNaN(parseInt(q.correct)) ? 0 : parseInt(q.correct),
                explanation: safeStr(q.explanation),
                answer: String.fromCharCode(65 + (parseInt(q.correct) || 0))
            };
        });

        res.json({ questions: finalizedQuestions });
    } catch (error) {
        console.error("QUIZ ERROR:", error);
        res.status(500).json({ error: "Lỗi tạo Quiz." });
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