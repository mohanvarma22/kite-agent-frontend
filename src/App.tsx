import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./api/supabase";
import type { Portfolio } from "./api/backend";
import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";
import { KiteConnectScreen } from "./components/KiteConnectScreen";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [kiteStepComplete, setKiteStepComplete] = useState(false);
  const [initialPortfolio, setInitialPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthMessage("");
      setKiteStepComplete(false);
      setInitialPortfolio(null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <main className="loading-page">Loading...</main>;

  if (!session) {
    return (
      <>
        <AuthScreen onMessage={setAuthMessage} />
        {authMessage && <p className="floating-error">{authMessage}</p>}
      </>
    );
  }

  if (!kiteStepComplete) {
    return (
      <KiteConnectScreen
        session={session}
        onProceed={(portfolio) => {
          setInitialPortfolio(portfolio);
          setKiteStepComplete(true);
        }}
      />
    );
  }

  return <AppShell session={session} initialPortfolio={initialPortfolio} />;
}
