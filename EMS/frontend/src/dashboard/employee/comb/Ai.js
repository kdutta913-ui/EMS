import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader } from "lucide-react";
import "../comb/EmpPages.css";
import { getSession, api } from "../../../utils/api";

const AIAssistant = () => {
  const { user } = getSession();
  const userName = user?.name?.split(" ")[0] || "there";
  const [messages, setMessages] = useState([
    { from: "bot", text: `Hi ${userName}! I'm your HR AI Assistant. I can answer questions about leave policies, payroll, attendance, and company guidelines. What would you like to know?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { from: "user", text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Send full conversation history (excluding the welcome message) so Gemini has context
      const history = updatedMessages.slice(1, -1); // exclude welcome + current message
      const { reply } = await api.post("/ai/chat", { message: text, history });
      setMessages(prev => [...prev, { from: "bot", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        from: "bot",
        text: "Sorry, I couldn't process your request right now. Please try again or contact your HR team directly."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", maxWidth: 700 }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>AI HR Assistant</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Ask questions about HR policies, leave, payroll, and more</div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "16px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", gap: 10 }}>
            {m.from === "bot" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={16} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: "75%", padding: "10px 14px", borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.from === "user" ? "var(--accent)" : "var(--surface-2)",
              color: m.from === "user" ? "#fff" : "var(--text-primary)", fontSize: 14, lineHeight: 1.5,
              whiteSpace: "pre-wrap"
            }}>{m.text}</div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "var(--surface-2)", display: "flex", alignItems: "center", gap: 6 }}>
              <Loader size={14} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <input
          style={{ flex: 1, padding: "10px 14px", borderRadius: 24, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, outline: "none", opacity: loading ? 0.6 : 1 }}
          placeholder="Ask anything about HR policies..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent)", border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading ? 0.6 : 1 }}
        >
          <Send size={16} color="#fff" />
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AIAssistant;
