require('dotenv').config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

// --- QUẢN LÝ XOAY VÒNG API KEY ---
const keysString = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
const apiKeys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
let currentKeyIndex = 0;

function getGroqClient() {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return new Groq({ apiKey: key });
}

// --- DANH SÁCH CHỦ ĐỀ TOÁN THỰC TẾ (CHỐNG LẶP & TĂNG TƯ DUY) ---
const mathTopics = [
    "Linear function word problems: evaluating cost vs time for two different companies",
    "System of equations: calculating ticket sales with different prices in a real-world scenario",
    "Quadratic models: projectile motion or maximum profit for a business",
    "Percentages and ratios: mixing chemical solutions or population density",
    "Right triangle trigonometry: solving real-world height/distance problems",
    "Data analysis: interpreting scatterplots, line of best fit, and margins of error",
    "Exponential models: compound interest vs simple interest comparison",
    "Unit conversions: multi-step rate conversions in physics or geography contexts",
    "Geometry: calculating surface area or volume of composite 3D objects in construction"
];

// --- BỘ KHUNG PROMPT CHI TIẾT ---

const getMathPrompt = (topic, seed) => `
Role: Senior SAT Math Professor.
Task: Create a BRAND NEW SAT Math question.
TOPIC: ${topic}
UNIQUE ID: ${seed}

STRICT RULES:
1. LOGIC: Internal step-by-step check to ensure the math is 100% correct. Keep arithmetic simple but conceptual logic rigorous.
2. LANGUAGE IS MANDATORY: "question" and "options" MUST BE 100% IN ENGLISH. "step_by_step_explanation" MUST BE IN VIETNAMESE. NEVER use Vietnamese in the question.
3. MATH FORMAT: Use standard text (e.g., x^2). NO LaTeX.
4. RETURN FORMAT: ONLY return a valid JSON object.

JSON Structure:
{
  "passage": null,
  "question": "English text with specific numbers and clear real-world context.",
  "options": ["A) ", "B) ", "C) ", "D) "],
  "answer": "A",
  "step_by_step_explanation": "Giải thích chi tiết các bước giải bằng tiếng Việt."
}`;

const getReadingWritingPrompt = (category, seed) => `
Role: Senior SAT ${category === 'reading' ? 'Reading' : 'Writing'} Professor.
Task: Create a BRAND NEW SAT ${category} question.
UNIQUE ID: ${seed}

STRICT RULES:
1. PASSAGE IS MANDATORY: You MUST write a 100-150 word paragraph in the "passage" field. Do NOT leave it null. The question MUST be based on this passage.
2. LANGUAGE IS MANDATORY: "passage", "question", and "options" MUST BE 100% IN ENGLISH. "step_by_step_explanation" MUST BE IN VIETNAMESE.
3. RETURN FORMAT: ONLY return a valid JSON object.

JSON Structure:
{
  "passage": "Write the English ${category} passage here. DO NOT LEAVE THIS NULL.",
  "question": "English question asking about the main idea, grammar, or vocabulary of the passage.",
  "options": ["A) ", "B) ", "C) ", "D) "],
  "answer": "A",
  "step_by_step_explanation": "Giải thích chi tiết tại sao đáp án này đúng và các đáp án khác sai bằng tiếng Việt."
}`;

// --- 1. API PRACTICE ---
app.get('/api/sat-question', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { category } = req.query; // 'math', 'reading', or 'writing'
    const seed = Math.floor(Math.random() * 1000000); 
    
    let finalPrompt = "";
    if (category === 'math') {
        const randomTopic = mathTopics[Math.floor(Math.random() * mathTopics.length)];
        finalPrompt = getMathPrompt(randomTopic, seed);
    } else if (category === 'reading' || category === 'writing') {
        finalPrompt = getReadingWritingPrompt(category, seed);
    } else {
        return res.status(400).json({ error: "Invalid category" });
    }

    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an SAT Expert JSON generator. You strictly follow language formatting rules.' },
                { role: 'user', content: finalPrompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.65, // Tăng nhẹ để đa dạng câu hỏi nhưng không làm hỏng JSON
            max_tokens: 1200
        });

        const content = completion.choices[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            console.log(`[Generated] Category: ${category} | Question: ${data.question.substring(0, 30)}...`);
            res.json(data);
        } else {
            throw new Error("AI did not return valid JSON");
        }
    } catch (error) {
        console.error("Practice API Error:", error.message);
        res.status(500).json({ error: "Lỗi kết nối AI hoặc lỗi format dữ liệu." });
    }
});

// --- 2. API QUIZ ---
app.post('/api/generate-quiz', async (req, res) => {
    const { subject, difficulty, count } = req.body;
    
    // Tạo prompt cứng cho Quiz để chống lỗi ngôn ngữ và passage
    const prompt = `
    Task: Create a ${count}-question SAT ${subject} quiz (${difficulty} difficulty).
    
    STRICT RULES:
    1. For Reading/Writing, EVERY question MUST have a "passage" (100 words).
    2. LANGUAGE: "passage", "question", and "options" MUST BE IN ENGLISH. "explanation" MUST BE IN VIETNAMESE.
    3. RETURN FORMAT: ONLY JSON. No other text.
    
    Structure:
    {
      "questions": [
        {
          "passage": "English text (or null if math)",
          "question": "English question",
          "options": ["A) ", "B) ", "C) ", "D) "],
          "answer": "A",
          "explanation": "Giải thích tiếng Việt"
        }
      ]
    }`;

    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.5, // Thấp hơn Practice một chút để đảm bảo tính ổn định cho cả mảng dữ liệu
            response_format: { type: "json_object" } // Ép cứng trả về JSON nếu model hỗ trợ
        });
        
        const content = completion.choices[0]?.message?.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
        console.error("Quiz API Error:", error.message);
        res.status(500).json({ error: "Lỗi khởi tạo Quiz." });
    }
});

// --- 3. API CHAT TUTOR (Fix lỗi trả về JSON lộn xộn) ---
app.post('/api/ai-tutor/chat', async (req, res) => {
    try {
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
            messages: [
                { 
                  role: 'system', 
                  content: 'You are a helpful, encouraging SAT Tutor. Converse naturally with the user in Vietnamese. DO NOT output code blocks or JSON objects unless the user explicitly asks you to generate a structured practice question.' 
                },
                { role: 'user', content: req.body.message }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
        });
        
        const reply = completion.choices[0].message.content;
        
        // Kiểm tra xem AI có vô tình trả về JSON block không
        const isQuiz = /\{[\s\S]*"question"[\s\S]*\}/.test(reply); 
        
        res.json({ reply, isQuiz });
    } catch (error) {
        console.error("Chat API Error:", error.message);
        res.status(500).json({ error: "Lỗi AI Tutor." });
    }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));