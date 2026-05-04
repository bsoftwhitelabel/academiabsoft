import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMagicLinkToken } from "@/lib/auth/jwt";
import { createSession, roleHomePath } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirectWithError(request, params.tenantSlug, "missing-token");
  }

  const payload = await verifyMagicLinkToken(token);
  if (!payload) {
    return redirectWithError(request, params.tenantSlug, "invalid-or-expired");
  }

  if (payload.tenantSlug !== params.tenantSlug) {
    return redirectWithError(request, params.tenantSlug, "tenant-mismatch");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    return redirectWithError(request, params.tenantSlug, "user-not-found");
  }

  await createSession({
    userId: user.id,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const dest = roleHomePath(user.role, params.tenantSlug);
  return NextResponse.redirect(new URL(dest, request.url));
}

function redirectWithError(
  request: NextRequest,
  tenantSlug: string,
  code: string
) {
  const url = new URL(`/${tenantSlug}/auth/magic-link`, request.url);
  url.searchParams.set("err", code);
  return NextResponse.redirect(url);
}
