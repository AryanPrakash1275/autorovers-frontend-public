import { getToken } from "../features/auth/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ApiErrors = {
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
  traceId?: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatApiErrors(e: ApiErrors): string | null {
  const msg = typeof e.message === "string" && e.message.trim() ? e.message.trim() : "";
  const code = typeof e.code === "string" && e.code.trim() ? e.code.trim() : "";

  const lines: string[] = [];
  if (msg) lines.push(msg);
  else if (code) lines.push(code);

  if (e.errors && typeof e.errors === "object") {
    const fieldLines: string[] = [];
    for (const [field, msgs] of Object.entries(e.errors)) {
      if (!Array.isArray(msgs)) continue;
      for (const m of msgs) {
        const t = String(m ?? "").trim();
        if (t) fieldLines.push(`${field}: ${t}`);
      }
    }
    if (fieldLines.length) lines.push(fieldLines.join("\n"));
  }

  if (lines.length === 0) return null;
  return lines.join("\n");
}

function extractErrorMessage(raw: string, fallback: string): string {
  if (!raw) return fallback;

  const data = tryParseJson(raw);

  // ✅ Autorovers ApiErrors
  if (data && isRecord(data)) {
    const maybeApiErrors: ApiErrors = {
      code: typeof data.code === "string" ? data.code : undefined,
      message: typeof data.message === "string" ? data.message : undefined,
      errors: isRecord(data.errors) ? (data.errors as Record<string, string[]>) : undefined,
      traceId: typeof data.traceId === "string" ? data.traceId : null,
    };

    const formatted = formatApiErrors(maybeApiErrors);
    if (formatted) return formatted;

    // fallback: other json shapes
    const title = typeof data.title === "string" ? data.title : "";
    const detail = typeof data.detail === "string" ? data.detail : "";
    if (detail) return detail;
    if (title) return title;
  }

  return raw;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not defined.");

  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const raw = await res.text();
    const fallback = `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(extractErrorMessage(raw, fallback));
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<TBody, TResp = unknown>(path: string, body: TBody): Promise<TResp> {
  return request<TResp>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPut<TBody, TResp = void>(path: string, body: TBody): Promise<TResp> {
  return request<TResp>(path, { method: "PUT", body: JSON.stringify(body) });
}

export function apiDelete<TResp = void>(path: string): Promise<TResp> {
  return request<TResp>(path, { method: "DELETE" });
}
