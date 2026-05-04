import { redirect } from "next/navigation";

export default function AdminIndex({
  params,
}: {
  params: { tenantSlug: string };
}) {
  redirect(`/${params.tenantSlug}/admin/courses`);
}
