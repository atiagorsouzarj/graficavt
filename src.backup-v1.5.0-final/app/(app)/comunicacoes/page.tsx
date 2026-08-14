import { getCommunicationData } from "@/lib/queries";
import { CommunicationCenter } from "@/components/modules/CommunicationCenter";

export const dynamic = "force-dynamic";

export default async function ComunicacoesPage() {
  const data = await getCommunicationData();
  return <CommunicationCenter data={data} />;
}
