import { NextResponse, type NextRequest } from "next/server";
import { clearSession } from "@/lib/auth/session";

async function handle(
  request: NextRequest,
  tenantSlug: string
): Promise<NextResponse> {
  await clearSession();
  return NextResponse.redirect(new URL(`/${tenantSlug}/catalog`, request.url));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  return handle(request, params.tenantSlug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  return handle(request, params.tenantSlug);
}
