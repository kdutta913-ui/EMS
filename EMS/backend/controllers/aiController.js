const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `You are an intelligent HR AI Assistant for an Employee Management System (EMS).
Your role is to help employees with questions about:
- Leave policies (types of leave, how to apply, balances, approval process)
- Attendance (check-in/out, working hours, late marks, regularization)
- Payroll & salary (salary structure, payslips, deductions, increments, reimbursements)
- Performance (appraisals, reviews, ratings, goals)
- Company policies and guidelines
- Onboarding and offboarding processes
- Training and development
- Benefits and perks
- Grievance and ticket raising
- General HR queries

Keep responses concise, friendly, and professional. If a question is outside HR/employee topics, politely redirect the user to focus on work-related queries. Do not make up specific company policies — if you don't know the exact policy, advise the employee to check with their HR team or refer to official company documents.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert frontend message history to Gemini format (exclude the latest user message)
    const geminiHistory = history
      .filter(m => m.text && m.text.trim())
      .map(m => ({
        role: m.from === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

    const chatSession = model.startChat({ history: geminiHistory });
    const result = await chatSession.sendMessage(message.trim());
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini AI error:", error.message);
    res.status(500).json({ message: "AI service error. Please try again." });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
    const response = await fetch(`${AI_URL}/analytics`);
    if (!response.ok) throw new Error(`AI service responded with ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("AI analytics error:", error.message);
    res.status(503).json({ message: "AI analytics service unavailable." });
  }
};

module.exports = { chat, getAnalytics };
