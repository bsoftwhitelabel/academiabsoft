import { redirect } from "next/navigation";
import { getDefaultTenantSlug } from "@/lib/tenant";

export default function RootPage() {
  // Middleware handles "/" → "/<default-tenant>/catalog";
  // this guards direct hits when middleware is bypassed (e.g. RSC fetches).
  redirect(`/${getDefaultTenantSlug()}/catalog`);
}
