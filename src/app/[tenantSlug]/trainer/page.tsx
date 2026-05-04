import { redirect } from "next/navigation";

export default function TrainerIndex({
  params,
}: {
  params: { tenantSlug: string };
}) {
  redirect(`/${params.tenantSlug}/trainer/sessions`);
}
