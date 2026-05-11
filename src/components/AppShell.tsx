import { LogOut, RefreshCw } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getPortfolio, LoginRequiredError, type LoginRequired, type Portfolio } from "../api/backend";
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
        <ChatPanel session={session} />
        <PortfolioPanel portfolio={portfolio} loginRequired={loginRequired} loading={portfolioLoading} error={portfolioError} onRefresh={loadPortfolio} />
      </div>
    </main>
  );
}
