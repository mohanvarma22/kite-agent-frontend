import type { Session } from "@supabase/supabase-js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL.");
}

export type LoginRequired = {
  status: "login_required";
  login_url: string | null;
  warning: string;
  message: string;
};

export type Portfolio = {
  holdings_count: number;
  invested_value: number;
  current_value: number;
  total_pnl: number;
  total_pnl_percentage: number;
  top_winners: string[];
  top_losers: string[];
};

export type ChatResponse = {
  session_id: string;
  answer: string;
  order_draft: Record<string, unknown> | null;
};

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type DraftChatSession = ChatSession & {
  isDraft?: boolean;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  order_draft: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export class LoginRequiredError extends Error {
  details: LoginRequired;

  constructor(details: LoginRequired) {
    super(details.message || "Kite login is required.");
    this.details = details;
  }
}

async function fetchWithAuth<T>(session: Session, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (response.status === 409 && typeof body === "object" && body && "detail" in body) {
    throw new LoginRequiredError((body as { detail: LoginRequired }).detail);
  }

  if (response.status === 401) {
    throw new Error("Your app session expired. Please sign in again.");
  }

  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(message || `Request failed with status ${response.status}.`);
  }

  return body as T;
}

export function getPortfolio(session: Session): Promise<Portfolio> {
  return fetchWithAuth<Portfolio>(session, "/portfolio");
}

export function requestKiteLogin(session: Session): Promise<LoginRequired> {
  return fetchWithAuth<LoginRequired>(session, "/auth/kite/login", { method: "POST" });
}

export function logoutKite(session: Session): Promise<{ status: string; runtime_stopped: boolean }> {
  return fetchWithAuth<{ status: string; runtime_stopped: boolean }>(session, "/auth/kite/logout", { method: "POST" });
}

export function listChatSessions(session: Session): Promise<ChatSession[]> {
  return fetchWithAuth<ChatSession[]>(session, "/chat/sessions");
}

export function createChatSession(session: Session, title = "New chat"): Promise<ChatSession> {
  return fetchWithAuth<ChatSession>(session, "/chat/sessions", {
    method: "POST",
    body: JSON.stringify({ title })
  });
}

export function getChatMessages(session: Session, sessionId: string): Promise<ChatMessage[]> {
  return fetchWithAuth<ChatMessage[]>(session, `/chat/sessions/${sessionId}/messages`);
}

export function sendChatMessage(session: Session, message: string, sessionId: string): Promise<ChatResponse> {
  return fetchWithAuth<ChatResponse>(session, "/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId })
  });
}
