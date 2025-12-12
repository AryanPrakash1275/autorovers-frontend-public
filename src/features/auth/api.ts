// Auth-related API calls.
// Responsible only for talking to auth endpoints and extracting tokens.
// Storage and routing decisions are handled elsewhere.

import { apiPost } from "../../api/client";
import { saveToken } from "./storage";

export type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  access_token?: string;
};

export async function login(req: LoginRequest): Promise<void> {
  const res = await apiPost<LoginRequest, LoginResponse>("/api/auth/login", req);

  // Defensive token extraction to handle different backend response shapes.
  const token: string =
    res.token ?? res.accessToken ?? res.jwt ?? res.access_token ?? "";

  if (!token) {
    throw new Error("Login response did not contain a token");
  }

  saveToken(token);
}
