import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  // Inject tenant brand colors as CSS vars for white-label.
  const brandStyle = {
    ...(tenant.primaryColor
      ? ({ "--brand-primary": tenant.primaryColor } as Record<string, string>)
      : {}),
    ...(tenant.accentColor
      ? ({ "--brand-accent": tenant.accentColor } as Record<string, string>)
      : {}),
  };

  return (
    <div
      data-tenant={tenant.slug}
      style={brandStyle}
      className="min-h-screen overflow-x-hidden"
    >
      {children}
    </div>
  );
}
