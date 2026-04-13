import * as XLSX from "xlsx";

function jsonForExport(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function boolFr(v: boolean | undefined): string {
  return v ? "Oui" : "Non";
}

function dateFr(d: Date | string | undefined): string {
  if (d === null || d === undefined) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("fr-FR");
}

export interface ReportForExcel {
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
  lieu_autre?: string | null;
  profession_societe?: string | null;
  decision_attendue?: string | null;
  Com_Pres?: boolean;
  Com_Drive?: boolean;
  Com_Achat?: boolean;
  Com_Livre?: boolean;
  Com_APV?: boolean;
  Com_Office?: boolean;
  Com_Close?: boolean;
  devis_offre_remise?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  objet_autre?: string | null;
  modeles_discutes?: unknown;
  propositions_faites?: string | null;
  reference_offre?: string | null;
  financement_propose?: string | null;
  assurance_entretien?: boolean;
  reprise_ancien_vehicule?: boolean;
  suivi_actions?: string | null;
  actions_suivi?: unknown;
  voiture?: {
    id: string;
    couleur: string;
    motorisation: string;
    transmission: string;
    voitureModel?: { model: string };
  } | null;
}

export interface ReportsByUserForExcel {
  conseiller_commercial: string;
  totalReports: number;
  reports: ReportForExcel[];
}

/** Column headers aligned with `buildRapportRendezVousExportRow` (CSV / Excel). */
export const RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS = [
  "Conseiller Commercial",
  "ID rapport",
  "Date création",
  "Date mise à jour",
  "Date rendez-vous",
  "Heure",
  "Durée",
  "Client",
  "Téléphone",
  "Email",
  "Type client",
  "Profession/Société",
  "Lieu",
  "Lieu autre",
  "Com Présentation",
  "Com Essai",
  "Com Achat",
  "Com Livraison",
  "Com APV",
  "Com Bureau",
  "Com Clôture",
  "Objet autre",
  "Modèles discutés",
  "Motivations",
  "Points positifs",
  "Objections / freins",
  "Degré d'intérêt",
  "Décision attendue",
  "Devis ou offre remise",
  "Propositions faites",
  "Référence offre",
  "Financement proposé",
  "Assurance entretien",
  "Reprise ancien véhicule",
  "Suivi actions",
  "Actions suivi (JSON)",
  "Commentaire global",
  "Voiture modèle",
  "Voiture couleur",
  "Voiture motorisation",
  "Voiture transmission",
] as const;

/** One CSV / Excel row per report (same order as `RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS`). */
export function buildRapportRendezVousExportRow(
  report: ReportForExcel,
  conseillerCommercial: string
): string[] {
  const dateRv =
    report.date_rendez_vous instanceof Date
      ? report.date_rendez_vous
      : new Date(report.date_rendez_vous);
  return [
    conseillerCommercial,
    report.id ?? "",
    dateFr(report.createdAt),
    dateFr(report.updatedAt),
    Number.isNaN(dateRv.getTime()) ? "" : dateRv.toLocaleDateString("fr-FR"),
    report.heure_rendez_vous ?? "",
    report.duree_rendez_vous ?? "",
    report.nom_prenom_client ?? "",
    report.telephone_client ?? "",
    report.email_client ?? "",
    report.type_client ?? "",
    report.profession_societe ?? "",
    report.lieu_rendez_vous ?? "",
    report.lieu_autre ?? "",
    boolFr(report.Com_Pres),
    boolFr(report.Com_Drive),
    boolFr(report.Com_Achat),
    boolFr(report.Com_Livre),
    boolFr(report.Com_APV),
    boolFr(report.Com_Office),
    boolFr(report.Com_Close),
    report.objet_autre ?? "",
    jsonForExport(report.modeles_discutes),
    report.motivations_achat ?? "",
    report.points_positifs ?? "",
    report.objections_freins ?? "",
    report.degre_interet ?? "",
    report.decision_attendue ?? "",
    boolFr(report.devis_offre_remise),
    report.propositions_faites ?? "",
    report.reference_offre ?? "",
    report.financement_propose ?? "",
    boolFr(report.assurance_entretien),
    boolFr(report.reprise_ancien_vehicule),
    report.suivi_actions ?? "",
    jsonForExport(report.actions_suivi),
    report.commentaire_global ?? "",
    report.voiture?.voitureModel?.model ?? "",
    report.voiture?.couleur ?? "",
    report.voiture?.motorisation != null ? String(report.voiture.motorisation) : "",
    report.voiture?.transmission != null ? String(report.voiture.transmission) : "",
  ];
}

function reportToRow(
  report: ReportForExcel,
  conseillerCommercial: string
): (string | number)[] {
  return buildRapportRendezVousExportRow(report, conseillerCommercial);
}

/** Build and download Excel for one commercial's reports */
export function downloadExcelForUser(userGroup: ReportsByUserForExcel): void {
  const excelData: (string | number)[][] = [[...RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS]];
  for (const report of userGroup.reports) {
    excelData.push(reportToRow(report, userGroup.conseiller_commercial));
  }
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const n = RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS.length;
  ws["!cols"] = Array.from({ length: n }, (_, i) =>
    i === 0 ? { wch: 22 } : i === 1 ? { wch: 14 } : i >= 22 ? { wch: 36 } : { wch: 16 }
  );
  const wb = XLSX.utils.book_new();
  const sheetName = (userGroup.conseiller_commercial || "Rapports").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const safeName = userGroup.conseiller_commercial.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").slice(0, 50);
  const filename = `Rapports_${safeName}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/** Build and download Excel for all commercials (one sheet, first column = Conseiller) */
export function downloadExcelForAll(reportsByUser: ReportsByUserForExcel[]): void {
  const excelData: (string | number)[][] = [[...RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS]];
  for (const userGroup of reportsByUser) {
    for (const report of userGroup.reports) {
      excelData.push(reportToRow(report, userGroup.conseiller_commercial));
    }
  }
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const n = RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS.length;
  ws["!cols"] = Array.from({ length: n }, (_, i) =>
    i === 0 ? { wch: 22 } : i === 1 ? { wch: 14 } : i >= 22 ? { wch: 36 } : { wch: 16 }
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rapports");
  const filename = `Rapports_RendezVous_Tous_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
