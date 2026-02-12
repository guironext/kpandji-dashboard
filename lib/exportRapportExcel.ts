import * as XLSX from "xlsx";

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
}

export interface ReportsByUserForExcel {
  conseiller_commercial: string;
  totalReports: number;
  reports: ReportForExcel[];
}

const HEADERS = [
  "Conseiller Commercial",
  "Date Rendez-vous",
  "Heure",
  "Durée",
  "Client",
  "Téléphone",
  "Email",
  "Type Client",
  "Lieu",
  "Lieu autre",
  "Profession/Société",
  "Degré d'intérêt",
  "Motivations",
  "Points Positifs",
  "Objections",
  "Décision attendue",
  "Commentaire",
];

function reportToRow(report: ReportForExcel, conseillerCommercial: string): (string | number)[] {
  const dateVal = report.date_rendez_vous instanceof Date
    ? report.date_rendez_vous
    : new Date(report.date_rendez_vous);
  return [
    conseillerCommercial,
    dateVal.toLocaleDateString("fr-FR"),
    report.heure_rendez_vous ?? "",
    report.duree_rendez_vous ?? "",
    report.nom_prenom_client ?? "",
    report.telephone_client ?? "",
    report.email_client ?? "",
    report.type_client ?? "",
    report.lieu_rendez_vous ?? "",
    report.lieu_autre ?? "",
    report.profession_societe ?? "",
    report.degre_interet ?? "",
    report.motivations_achat ?? "",
    report.points_positifs ?? "",
    report.objections_freins ?? "",
    report.decision_attendue ?? "",
    report.commentaire_global ?? "",
  ];
}

/** Build and download Excel for one commercial's reports */
export function downloadExcelForUser(userGroup: ReportsByUserForExcel): void {
  const excelData: (string | number)[][] = [HEADERS];
  for (const report of userGroup.reports) {
    excelData.push(reportToRow(report, userGroup.conseiller_commercial));
  }
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const colWidths = HEADERS.map((_, i) =>
    i === 0 ? { wch: 22 } : i === 4 ? { wch: 28 } : i >= 11 ? { wch: 35 } : { wch: 14 }
  );
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  const sheetName = (userGroup.conseiller_commercial || "Rapports").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const safeName = userGroup.conseiller_commercial.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").slice(0, 50);
  const filename = `Rapports_${safeName}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/** Build and download Excel for all commercials (one sheet, first column = Conseiller) */
export function downloadExcelForAll(reportsByUser: ReportsByUserForExcel[]): void {
  const excelData: (string | number)[][] = [HEADERS];
  for (const userGroup of reportsByUser) {
    for (const report of userGroup.reports) {
      excelData.push(reportToRow(report, userGroup.conseiller_commercial));
    }
  }
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const colWidths = HEADERS.map((_, i) =>
    i === 0 ? { wch: 22 } : i === 4 ? { wch: 28 } : i >= 11 ? { wch: 35 } : { wch: 14 }
  );
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rapports");
  const filename = `Rapports_RendezVous_Tous_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
