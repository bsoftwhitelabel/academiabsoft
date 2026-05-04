import { redirect } from "next/navigation";

export default function TenantHome({
  params,
}: {
  params: { tenantSlug: string };
}) {
  // Tenant root → public catalog
  redirect(`/${params.tenantSlug}/catalog`);
}
