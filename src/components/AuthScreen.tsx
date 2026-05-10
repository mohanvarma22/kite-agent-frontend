import { useState } from "react";
import { LogIn } from "lucide-react";
import { supabase } from "../api/supabase";

type Props = { onMessage: (message: string) => void };

export function AuthScreen({ onMessage }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    onMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) onMessage(error.message);
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Kite Agent</p>
          <h1>Sign in to your trading copilot</h1>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>
          <button type="submit" disabled={loading}><LogIn size={18} />{loading ? "Signing in" : "Sign in"}</button>
        </form>
      </section>
    </main>
  );
}
