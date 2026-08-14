import { notFound } from "next/navigation";
import { getClient360 } from "@/lib/queries";
import { Client360 } from "@/components/modules/Client360";

export const dynamic = "force-dynamic";

export default async function Client360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClient360(Number(id));
  if (!data) notFound();
  return <Client360 data={data} />;
}
