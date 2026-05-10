import { ExternalLink, RefreshCw } from "lucide-react";
import type { LoginRequired } from "../api/backend";

type Props = { login: LoginRequired; onRetry?: () => void };

export function KiteLoginPrompt({ login, onRetry }: Props) {
  return (
    <div className="kite-prompt">
      <p className="warning-text">{login.warning}</p>
      <p>{login.message}</p>
      <div className="button-row">
        {login.login_url && <a className="button-link" href={login.login_url} target="_blank" rel="noreferrer"><ExternalLink size={16} />Login to Kite</a>}
        {onRetry && <button type="button" className="secondary" onClick={onRetry}><RefreshCw size={16} />Retry</button>}
      </div>
    </div>
  );
}
