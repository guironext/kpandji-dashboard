import StatistiquesSavClient from "./StatistiquesSavClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistiques & Analytics | SAV",
  description: "Rapports d'activité, performances atelier, chiffre d'affaires et indicateurs clés SAV.",
};

export default function StatistiquesSavPage() {
  return <StatistiquesSavClient />;
}
