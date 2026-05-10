import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./api/supabase";
import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthMessage("");
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

  return <AppShell session={session} />;
}
