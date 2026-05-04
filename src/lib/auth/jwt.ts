/**
 * Edge-compatible JWT helpers.
 *
 * Used by middleware (Edge runtime) AND server components/actions (Node).
 * No `next/headers` import — pure jose so it works everywhere.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { UserRole } from "@prisma/client";

const ALG = "HS256";
const SESSION_AUDIENCE = "academia.session";
const MAGIC_LINK_AUDIENCE = "academia.magic-link";
const SESSION_TTL = "7d";
const MAGIC_LINK_TTL = "1h";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set and at least 32 characters long. See .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

// ─── Session JWT ──────────────────────────────────────────────────────────

export type SessionPayload = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
  role: UserRole;
  fullName: string;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .setAudience(SESSION_AUDIENCE)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      audience: SESSION_AUDIENCE,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Magic-Link JWT ───────────────────────────────────────────────────────

export type MagicLinkPayload = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  email: string;
};

export async function signMagicLinkToken(payload: MagicLinkPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(MAGIC_LINK_TTL)
    .setAudience(MAGIC_LINK_AUDIENCE)
    .sign(getSecret());
}

export async function verifyMagicLinkToken(
  token: string
): Promise<MagicLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      audience: MAGIC_LINK_AUDIENCE,
    });
    return payload as unknown as MagicLinkPayload;
  } catch {
    return null;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "academia_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
