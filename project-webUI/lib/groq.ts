// lib/groq.ts
export function getGroqApiKey() {
  const keysString = process.env.GROQ_API_KEYS || "";
  const keys = keysString.split(",").map(k => k.trim()).filter(k => k !== "");
  
  if (keys.length === 0) {
    return process.env.GROQ_API_KEY; // Fallback nếu chỉ có 1 key cũ
  }

  // Chọn ngẫu nhiên 1 key trong danh sách để phân phối tải
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}