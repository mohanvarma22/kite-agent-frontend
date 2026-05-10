import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LoginRequiredError, sendChatMessage, type LoginRequired } from "../api/backend";
import { KiteLoginPrompt } from "./KiteLoginPrompt";

type Props = { session: Session };
type Message = { id: string; role: "user" | "assistant"; text: string; orderDraft?: Record<string, unknown> | null };

function makeSessionId() {
  const existing = sessionStorage.getItem("kite-agent-chat-session-id");
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem("kite-agent-chat-session-id", next);
  return next;
}

export function ChatPanel({ session }: Props) {
  const sessionId = useMemo(makeSessionId, []);
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", role: "assistant", text: "Ask about prices, holdings, or draft-only order ideas." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginRequired, setLoginRequired] = useState<LoginRequired | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    setLoginRequired(null);
    setLoading(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);

    try {
      const response = await sendChatMessage(session, text, sessionId);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: response.answer, orderDraft: response.order_draft }]);
    } catch (err) {
      if (err instanceof LoginRequiredError) setLoginRequired(err.details);
      else setError(err instanceof Error ? err.message : "Chat request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-scroll">
        {messages.map((message) => (
          <article key={message.id} className={`message ${message.role}`}>
            <p>{message.text}</p>
            {message.orderDraft && <pre className="draft-box">{JSON.stringify(message.orderDraft, null, 2)}</pre>}
          </article>
        ))}
        {loading && <article className="message assistant"><p>Thinking...</p></article>}
      </div>
      {loginRequired && <KiteLoginPrompt login={loginRequired} />}
      {error && <p className="error-text inset">{error}</p>}
      <form className="chat-form" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about INFY, portfolio P&L, or draft an order..." />
        <button type="submit" disabled={loading || !input.trim()} title="Send message"><Send size={18} />Send</button>
      </form>
    </section>
  );
}
