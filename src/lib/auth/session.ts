import "server-only";

import { cookies } from "next/headers";
import {
  signSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type SessionPayload,
} from "./jwt";

export async function createSession(payload: SessionPayload) {
  const token = await signSessionToken(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Computes the role-appropriate landing path for a user. */
export function roleHomePath(
  role: SessionPayload["role"],
  tenantSlug: string
): string {
  switch (role) {
    case "ADMIN":
    case "OWNER":
      return `/${tenantSlug}/admin/courses`;
    case "TRAINER":
      return `/${tenantSlug}/trainer/sessions`;
    case "TRAINEE":
      return `/${tenantSlug}/portal/dashboard`;
    case "CLIENT_HR":
      return `/${tenantSlug}/admin/trainees`;
    default:
      return `/${tenantSlug}/catalog`;
  }
}
