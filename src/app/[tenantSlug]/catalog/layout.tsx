import { getTenantBySlug } from "@/lib/tenant";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function CatalogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  const tenantName = tenant?.name ?? "Academia Digital";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader tenantSlug={params.tenantSlug} tenantName={tenantName} />
      <main className="flex-1">{children}</main>
      <SiteFooter tenantSlug={params.tenantSlug} tenantName={tenantName} />
    </div>
  );
}
