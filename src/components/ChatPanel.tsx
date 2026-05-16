import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LoginRequiredError, sendChatMessage, type ChatMessage, type ChatSession, type LoginRequired } from "../api/backend";
import { KiteLoginPrompt } from "./KiteLoginPrompt";

type Props = {
  session: Session;
  chatSession: ChatSession | null;
  initialMessages: ChatMessage[];
  loadingHistory: boolean;
  historyError: string;
  onMessageSaved: () => Promise<void>;
};
type Message = { id: string; role: "user" | "assistant"; text: string; orderDraft?: Record<string, unknown> | null };

function fromStoredMessage(message: ChatMessage): Message {
  return {
    id: message.id,
    role: message.role,
    text: message.content,
    orderDraft: message.order_draft
  };
}

export function ChatPanel({ session, chatSession, initialMessages, loadingHistory, historyError, onMessageSaved }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginRequired, setLoginRequired] = useState<LoginRequired | null>(null);

  useEffect(() => {
    setMessages(initialMessages.map(fromStoredMessage));
  }, [chatSession?.id, initialMessages]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading || !chatSession) return;
    setInput("");
    setError("");
    setLoginRequired(null);
    setLoading(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);

    try {
      const response = await sendChatMessage(session, text, chatSession.id);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: response.answer, orderDraft: response.order_draft }]);
      await onMessageSaved();
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
        {loadingHistory && <article className="message assistant"><p>Loading chat history...</p></article>}
        {!loadingHistory && historyError && <article className="message assistant"><p>{historyError}</p></article>}
        {!loadingHistory && !historyError && messages.length === 0 && (
          <article className="message assistant"><p>Ask about prices, holdings, or draft-only order ideas.</p></article>
        )}
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
        <button type="submit" disabled={loading || loadingHistory || !chatSession || !input.trim()} title="Send message"><Send size={18} />Send</button>
      </form>
    </section>
  );
}
