import { LogOut, MoveRight, RefreshCw } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useState } from "react";
import { getPortfolio, LoginRequiredError, logoutKite, type LoginRequired, type Portfolio } from "../api/backend";
import { supabase } from "../api/supabase";
import { KiteLoginPrompt } from "./KiteLoginPrompt";

type Props = {
  session: Session;
  onProceed: (portfolio: Portfolio) => void;
};

export function KiteConnectScreen({ session, onProceed }: Props) {
  const [login, setLogin] = useState<LoginRequired | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkKiteAndPortfolio() {
    setLoading(true);
    setError("");
    setLogin(null);

    try {
      setPortfolio(await getPortfolio(session));
    } catch (err) {
      if (err instanceof LoginRequiredError) setLogin(err.details);
      else setError(err instanceof Error ? err.message : "Could not verify Kite login.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await logoutKite(session);
    } finally {
      await supabase.auth.signOut();
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel kite-step">
        <div>
          <p className="eyebrow">Step 2</p>
          <h1>Connect Kite before opening the dashboard</h1>
          <p className="muted">Your app session is active as {session.user.email}. We will verify Kite access and prepare your portfolio before opening the dashboard.</p>
        </div>

        {login ? (
          <KiteLoginPrompt login={login} onRetry={checkKiteAndPortfolio} />
        ) : portfolio ? (
          <div className="kite-prompt">
            <p className="warning-text">Kite is connected and your portfolio is ready.</p>
            <p>{portfolio.holdings_count} holdings loaded. You can proceed to the dashboard now.</p>
          </div>
        ) : (
          <div className="kite-prompt">
            <p className="warning-text">Kite authorization is mandatory for this session.</p>
            <p>Click the check button. If Kite needs login, we will show the same Kite login link used by the portfolio flow.</p>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="button-row">
          <button type="button" onClick={checkKiteAndPortfolio} disabled={loading}>
            <RefreshCw size={16} />
            {loading ? "Checking Kite" : portfolio ? "Refresh portfolio" : "Check Kite access"}
          </button>
          <button type="button" className="secondary" onClick={() => portfolio && onProceed(portfolio)} disabled={!portfolio}>
            <MoveRight size={16} />
            Proceed to dashboard
          </button>
          <button type="button" className="secondary" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
