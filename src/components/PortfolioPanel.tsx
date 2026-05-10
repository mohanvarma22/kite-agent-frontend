import { RefreshCw, Wallet } from "lucide-react";
import type { LoginRequired, Portfolio } from "../api/backend";
import { KiteLoginPrompt } from "./KiteLoginPrompt";

type Props = {
  portfolio: Portfolio | null;
  loginRequired: LoginRequired | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function PortfolioPanel({ portfolio, loginRequired, loading, error, onRefresh }: Props) {
  return (
    <aside className="side-panel">
      <div className="panel-header">
        <div><p className="eyebrow">Portfolio</p><h2>Summary</h2></div>
        <button type="button" className="icon-button" onClick={onRefresh} disabled={loading} title="Refresh portfolio"><RefreshCw size={18} /></button>
      </div>
      {loginRequired && <KiteLoginPrompt login={loginRequired} onRetry={onRefresh} />}
      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Loading portfolio...</p>}
      {portfolio && (
        <div className="portfolio-grid">
          <div className="metric wide"><Wallet size={18} /><span>{portfolio.holdings_count} holdings</span></div>
          <div className="metric"><small>Invested</small><strong>{money.format(portfolio.invested_value)}</strong></div>
          <div className="metric"><small>Current</small><strong>{money.format(portfolio.current_value)}</strong></div>
          <div className={portfolio.total_pnl >= 0 ? "metric profit" : "metric loss"}><small>P&L</small><strong>{money.format(portfolio.total_pnl)}</strong></div>
          <div className={portfolio.total_pnl_percentage >= 0 ? "metric profit" : "metric loss"}><small>P&L %</small><strong>{portfolio.total_pnl_percentage.toFixed(2)}%</strong></div>
          <section className="symbol-list"><h3>Top winners</h3><p>{portfolio.top_winners.length ? portfolio.top_winners.join(", ") : "None"}</p></section>
          <section className="symbol-list"><h3>Top losers</h3><p>{portfolio.top_losers.length ? portfolio.top_losers.join(", ") : "None"}</p></section>
        </div>
      )}
    </aside>
  );
}
