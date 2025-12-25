// Centralised HTTP client for the solution. Handles auth, base URL & common error handling.

import { getToken } from "../features/auth/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function extractErrorMessage(raw: string, fallback: string): string {
  if (!raw) return fallback;

  // Try JSON (ASP.NET ProblemDetails / validation errors)
  try {
    const data = JSON.parse(raw);

    if (isRecord(data)) {
      const title = typeof data.title === "string" ? data.title : "";
      const detail = typeof data.detail === "string" ? data.detail : "";

      // Validation: { errors: { Field: ["msg"] } }
      if (isRecord(data.errors)) {
        const lines: string[] = [];

        for (const [field, msgs] of Object.entries(data.errors)) {
          if (Array.isArray(msgs)) {
            for (const m of msgs) lines.push(`${field}: ${String(m)}`);
          } else if (msgs !== undefined && msgs !== null) {
            lines.push(`${field}: ${String(msgs)}`);
          }
        }

        if (lines.length) return lines.join("\n");
      }

      // Non-validation problem details
      if (detail) return detail;
      if (title) return title;
    }
  } catch {
    // Not JSON, fall through
  }

  // Plain text
  return raw;
}

// Attached JWT token to every request.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined.");
  }

  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  // Auth is injected here & avoids duplication of header across.
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const raw = await res.text();
    const fallback = `Request failed: ${res.status} ${res.statusText} (${url})`;
    throw new Error(extractErrorMessage(raw, fallback));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// HTTP verb helpers
export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<TBody, TResp = unknown>(path: string, body: TBody): Promise<TResp> {
  return request<TResp>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut<TBody, TResp = void>(path: string, body: TBody): Promise<TResp> {
  return request<TResp>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete<TResp = void>(path: string): Promise<TResp> {
  return request<TResp>(path, {
    method: "DELETE",
  });
}
