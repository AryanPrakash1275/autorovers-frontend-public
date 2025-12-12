//Centralised HTTP client for the solution. Handles all auth, base URL & common error handling.

import { getToken } from "../features/auth/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

//Attached JWT token to every request.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined.");
  }

  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  //Auth is injected here & avoids duplication of header across.
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    //Makes the error readable for UI layers. plain text or JSON is returned.
    const text = await res.text();
    throw new Error(
      text || `Request failed: ${res.status} ${res.statusText} (${url})`  
    );
  }



  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}


// HTTP verb helpers 
export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<TBody, TResp = unknown>(
  path: string,
  body: TBody
): Promise<TResp> {
  return request<TResp>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut<TBody, TResp = void>(
  path: string,
  body: TBody
): Promise<TResp> {
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
