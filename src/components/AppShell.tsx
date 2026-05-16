import { LogOut, RefreshCw } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  createChatSession,
  getChatMessages,
  getPortfolio,
  listChatSessions,
  LoginRequiredError,
  type ChatMessage,
  type ChatSession,
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
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState("");

  async function loadPortfolio() {
    setPortfolioLoading(true);
    setPortfolioError("");
    setLoginRequired(null);
    try {
      setPortfolio(await getPortfolio(session));
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
      const activeSession = sessions[0] ?? await createChatSession(session);
      setChatSession(activeSession);
      setChatMessages(await getChatMessages(session, activeSession.id));
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Could not load chat history.");
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialChat();
  }, [session.access_token]);

  async function refreshActiveChat() {
    if (!chatSession) return;
    setChatMessages(await getChatMessages(session, chatSession.id));
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div><p className="eyebrow">Kite Agent</p><h1>Trading Copilot</h1></div>
        <div className="top-actions">
          <span className="user-email">{session.user.email}</span>
          <button type="button" className="secondary" onClick={loadPortfolio} disabled={portfolioLoading}><RefreshCw size={16} />Refresh</button>
          <button type="button" onClick={() => supabase.auth.signOut()}><LogOut size={16} />Logout</button>
        </div>
      </header>
      <div className="dashboard-grid">
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
