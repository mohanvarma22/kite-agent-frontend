import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
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
  const currentSessionRef = useRef<Session | null>(null);

  function kiteStepStorageKey(nextSession: Session) {
    return `kite-step-complete:${nextSession.user.id}`;
  }

  function restoreKiteStep(nextSession: Session | null) {
    if (!nextSession) {
      setKiteStepComplete(false);
      setInitialPortfolio(null);
      return;
    }

    setKiteStepComplete(sessionStorage.getItem(kiteStepStorageKey(nextSession)) === "true");
    setInitialPortfolio(null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      currentSessionRef.current = data.session;
      restoreKiteStep(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const previousSession = currentSessionRef.current;
      currentSessionRef.current = nextSession;
      setSession(nextSession);
      setAuthMessage("");
      if (event === "SIGNED_OUT") {
        if (previousSession) sessionStorage.removeItem(kiteStepStorageKey(previousSession));
        restoreKiteStep(null);
      } else {
        restoreKiteStep(nextSession);
      }
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
          sessionStorage.setItem(kiteStepStorageKey(session), "true");
          setInitialPortfolio(portfolio);
          setKiteStepComplete(true);
        }}
      />
    );
  }

  return <AppShell session={session} initialPortfolio={initialPortfolio} />;
}
