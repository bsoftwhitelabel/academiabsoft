import { redirect } from "next/navigation";

export default function PortalIndex({
  params,
}: {
  params: { tenantSlug: string };
}) {
  redirect(`/${params.tenantSlug}/portal/dashboard`);
}
