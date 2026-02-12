"use client";

import { ExportReports } from "@/components/ExportReports";

interface Report {
  id: string;
  date_rendez_vous: Date | string;
  heure_rendez_vous: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client: string | null;
  type_client: string;
  lieu_rendez_vous: string;
  degre_interet: string | null;
  motivations_achat: string | null;
  points_positifs: string | null;
  objections_freins: string | null;
  commentaire_global: string | null;
}

interface ReportsByUser {
  conseiller_commercial: string;
  totalReports: number;
  reports: Report[];
}

interface ExportReportsWrapperProps {
  reportsByUser: ReportsByUser[];
}

export function ExportReportsWrapper({ reportsByUser }: ExportReportsWrapperProps) {
  return <ExportReports reportsByUser={reportsByUser} />;
}
