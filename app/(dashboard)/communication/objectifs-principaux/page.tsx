import { getObjectifsPrincipauxPageData } from "@/lib/actions/communication-objectifs";
import ObjectifsPrincipauxPageClient from "./ObjectifsPrincipauxPageClient";

export default async function ObjectifsPrincipauxPage() {
  const result = await getObjectifsPrincipauxPageData();
  const initialData = result.success
    ? result.data
    : { users: [], rubriques: [], cycles: [], objectifs: [], acteurs: [] };

  return <ObjectifsPrincipauxPageClient initialData={initialData} />;
}
