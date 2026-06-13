import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api";

const SUGGESTED = [
  "Why did revenue drop in Alexandria?",
  "Which branch needs attention first?",
  "What is our claim rejection rate?",
  "How are leads converting this month?",
];

export default function ChatPopup({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Good morning. I'm RevyAI. Ask me anything about your network's performance — I'll give you answers backed by real data.",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(question) {
    const q = question || input.trim();
    if (!q) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const { answer } = await sendChatMessage(q);
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Unable to reach the analysis engine. Please check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col"
           style={{ height: 560 }}>

        {/* Header */}
        <div className="bg-forest rounded-t-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Ask RevyAI</p>
            <p className="text-white/60 text-xs">Powered by Gemini · Data-grounded answers</p>
          </div>
          <button onClick={onClose}
                  className="text-white/60 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed
                ${m.role === "user"
                  ? "bg-forest text-white"
                  : "bg-mint text-forest border border-forest/10"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-mint text-forest border border-forest/10 rounded-xl px-4 py-2.5 text-sm">
                <span className="animate-pulse">Analyzing data…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTED.map((q) => (
              <button key={q}
                      onClick={() => handleSend(q)}
                      className="text-xs bg-mint border border-forest/15 text-forest rounded-full px-3 py-1 hover:bg-forest hover:text-white transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-forest/10 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
            placeholder="Ask about revenue, claims, branches…"
            className="flex-1 bg-mint rounded-xl px-4 py-2.5 text-sm text-forest placeholder-forest/40 outline-none border border-transparent focus:border-forest/30"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-forest text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-forest/80 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
