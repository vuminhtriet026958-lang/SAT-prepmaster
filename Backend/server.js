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
  // Tách chuỗi key thành mảng, bỏ khoảng trắng
  const keys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
  
  // Nếu không có danh sách keys, dùng key đơn lẻ cũ làm dự phòng
  const selectedKey = keys.length > 0 
    ? keys[Math.floor(Math.random() * keys.length)] 
    : process.env.GROQ_API_KEY;

  console.log(`Using Key: ${selectedKey.substring(0, 10)}...`); // Log để Triết theo dõi
  
  return new Groq({ apiKey: selectedKey });
}

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// --- 1. API Tạo câu hỏi đơn lẻ (Cho trang Practice) ---
app.get('/api/sat-question', async (req, res) => {
  const category = req.query.category || 'math';
  const mathSubTopics = [
    "Linear equations with two variables", 
    "Quadratic functions and graphs", 
    "Ratios and Proportions", 
    "Right triangle trigonometry", 
    "Circle equations in XY-plane",
    "Exponential growth and decay"
  ];
  const randomTopic = mathSubTopics[Math.floor(Math.random() * mathSubTopics.length)];
  const randomSeed = Math.floor(Math.random() * 10000);
  let topicInstruction = "";
  
  if (category === 'math') {
    topicInstruction = `Generate a UNIQUE SAT Math question...`; // Giữ nguyên prompt của Triết
  } else if (category === 'writing') {
    topicInstruction = `Generate an SAT WRITING & LANGUAGE question...`;
  } else {
    topicInstruction = `Generate an SAT READING question...`;
  }

  const prompt = `Role: SAT Expert. Task: ${topicInstruction}...`;

  try {
    // THAY THẾ: Gọi hàm getGroqClient() để lấy client mới với key ngẫu nhiên
    const groqClient = getGroqClient(); 
    
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', 
      temperature: 0, // Chỉnh về 0 để AI phản hồi chính xác và nhanh nhất
      max_tokens: 800
    });
    
    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      res.json({
        passage: parsedData.passage || null,
        question: parsedData.question || "No question content.",
        options: parsedData.options || ["A) ", "B) ", "C) ", "D) "],
        answer: parsedData.answer || "A",
        step_by_step_explanation: parsedData.step_by_step_explanation || parsedData.explanation || "Không có giải thích."
      });
    } else {
      throw new Error("No JSON found");
    }
  } catch (error) {
    console.error("SAT Question Error:", error);
    res.status(500).json({ 
      question: "AI Tutor đang bận, vui lòng nhấn 'Next Question' để thử lại.",
      options: ["A) Thử lại", "B) Thử lại", "C) Thử lại", "D) Thử lại"],
      answer: "A",
      step_by_step_explanation: "Lỗi kết nối hoặc hết hạn API. Vui lòng thử lại."
    });
  }
});

// --- 2. API Tạo trọn bộ Quiz (Cho trang Create Quiz) ---
app.post('/api/generate-quiz', async (req, res) => {
  const { subject, difficulty, count } = req.body;
  let subjectName = subject === 'math' ? "SAT Math" : "SAT Verbal";

  // Nâng cấp Prompt: Ép AI suy luận từng bước (Chain of Thought)
  const prompt = `
    Task: Create a ${count}-question SAT quiz on ${subjectName}. 
    Difficulty Level: ${difficulty}.

    STRICT LOGIC RULES:
    1. For Math: Solve the problem step-by-step internally before providing the answer. Double check all calculations.
    2. For Verbal: Ensure the context is academic and the options are distinct.
    3. The 'correct' field MUST be the exact index (0, 1, 2, or 3) of the correct answer in the 'options' array.
    4. Format: Questions/Options in English. 'explanation' in Vietnamese.

    Return ONLY a strictly valid JSON object:
    {
      "questions": [
        {
          "text": "Question content here",
          "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          "correct": 0,
          "explanation": "Giải thích chi tiết các bước giải bằng tiếng Việt."
        }
      ]
    }
  `;

  try {
    const groqClient = getGroqClient(); 
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are an elite SAT Professor. You provide perfectly accurate questions and double-check every calculation.' 
        },
        { role: 'user', content: prompt }
      ],
      // Dùng model 70b để thông minh hơn, hoặc giữ 8b nếu muốn tốc độ tối đa
      model: 'llama-3.3-70b-versatile', 
      temperature: 0, // Quan trọng: Đưa về 0 để triệt tiêu sự "sáng tạo" sai lệch
    });

    const content = chatCompletion.choices[0]?.message?.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI không trả về đúng định dạng JSON");
    
    const quizData = JSON.parse(jsonMatch[0]);
    res.json(quizData);

  } catch (error) {
    console.error("Quiz Generation Error:", error);
    res.status(500).json({ 
      error: "Không thể tạo Quiz lúc này. Vui lòng thử lại sau giây lát.",
      details: error.message 
    });
  }
});

// --- 3. API AI Tutor Chat ---
app.post('/api/ai-tutor/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const groqClient = getGroqClient(); // THAY THẾ TẠI ĐÂY
    const completion = await groqClient.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are a friendly SAT Tutor. Help with Math, Reading, Writing. Answer in Vietnamese.' 
        },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
    });

    const aiResponse = completion.choices[0].message.content;
    const isJson = /\{[\s\S]*\}/.test(aiResponse);
    
    res.json({ reply: aiResponse, isQuiz: isJson });
  } catch (error) {
    res.status(500).json({ error: "AI Tutor đang bận suy nghĩ!" });
  }
});

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => { 
    console.log(`Server running on port ${PORT}`); 
});
server.timeout = 30000;