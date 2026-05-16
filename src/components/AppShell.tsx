import { LogOut, MessageSquarePlus, RefreshCw } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  getChatMessages,
  getPortfolio,
  listChatSessions,
  LoginRequiredError,
  logoutKite,
  type ChatMessage,
  type DraftChatSession,
  type LoginRequired,
  type Portfolio
} from "../api/backend";
import { supabase } from "../api/supabase";
import { ChatPanel } from "./ChatPanel";
import { PortfolioPanel } from "./PortfolioPanel";

type Props = {
  session: Session;
  initialPortfolio: Portfolio | null;
};

export function AppShell({ session, initialPortfolio }: Props) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(initialPortfolio);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [loginRequired, setLoginRequired] = useState<LoginRequired | null>(null);
  const [chatSessions, setChatSessions] = useState<DraftChatSession[]>([]);
  const [chatSession, setChatSession] = useState<DraftChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState("");

  async function loadPortfolio() {
    setPortfolioLoading(true);
    setPortfolioError("");
    setLoginRequired(null);
    try {
      const nextPortfolio = await getPortfolio(session);
      setPortfolio(nextPortfolio);
      setLoginRequired(null);
    } catch (err) {
      if (err instanceof LoginRequiredError) setLoginRequired(err.details);
      else setPortfolioError(err instanceof Error ? err.message : "Could not load portfolio.");
    } finally {
      setPortfolioLoading(false);
    }
  }

  useEffect(() => {
    if (!initialPortfolio) void loadPortfolio();
  }, [session.access_token, initialPortfolio]);

  async function loadInitialChat() {
    setChatLoading(true);
    setChatError("");

    try {
      const sessions = await listChatSessions(session);
      setChatSessions(sessions);
      startDraftChat();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Could not load chat history.");
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialChat();
  }, [session.access_token]);

  async function refreshActiveChat() {
    if (!chatSession) return;
    const sessions = await listChatSessions(session);
    setChatSessions(sessions);
    const persistedSession = sessions.find((item) => item.id === chatSession.id);
    if (persistedSession) setChatSession(persistedSession);
    setChatMessages(await getChatMessages(session, chatSession.id));
  }

  async function selectChatSession(nextSession: DraftChatSession) {
    setChatLoading(true);
    setChatError("");

    try {
      setChatSession(nextSession);
      setChatMessages(await getChatMessages(session, nextSession.id));
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Could not load chat messages.");
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  }

  async function startNewChat() {
    setChatError("");
    startDraftChat();
  }

  function startDraftChat() {
    const now = new Date().toISOString();
    setChatSession({
      id: crypto.randomUUID(),
      title: "New chat",
      created_at: now,
      updated_at: now,
      isDraft: true
    });
    setChatMessages([]);
    setChatLoading(false);
  }

  function formatSessionTime(value: string) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }

  async function logout() {
    try {
      await logoutKite(session);
    } finally {
      await supabase.auth.signOut();
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div><p className="eyebrow">Kite Agent</p><h1>Trading Copilot</h1></div>
        <div className="top-actions">
          <span className="user-email">{session.user.email}</span>
          <button type="button" className="secondary" onClick={loadPortfolio} disabled={portfolioLoading}><RefreshCw size={16} />Refresh</button>
          <button type="button" onClick={logout}><LogOut size={16} />Logout</button>
        </div>
      </header>
      <div className="dashboard-grid with-history">
        <aside className="history-panel">
          <div className="panel-header">
            <h2>History</h2>
            <button type="button" className="icon-button" onClick={startNewChat} disabled={chatLoading} title="New chat">
              <MessageSquarePlus size={18} />
            </button>
          </div>
          <div className="history-list">
            {chatSessions.length === 0 && <p className="muted">No saved chats yet.</p>}
            {chatSessions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`history-item${chatSession?.id === item.id ? " active" : ""}`}
                onClick={() => void selectChatSession(item)}
              >
                <span>{item.title}</span>
                <small>{formatSessionTime(item.updated_at)}</small>
              </button>
            ))}
          </div>
        </aside>
        <ChatPanel
          session={session}
          chatSession={chatSession}
          initialMessages={chatMessages}
          loadingHistory={chatLoading}
          historyError={chatError}
          onMessageSaved={refreshActiveChat}
        />
        <PortfolioPanel portfolio={portfolio} loginRequired={loginRequired} loading={portfolioLoading} error={portfolioError} onRefresh={loadPortfolio} />
      </div>
    </main>
  );
}
