"use client";

import { ExportReports } from "@/components/ExportReports";
import type { ReportsByUserForExcel } from "@/lib/exportRapportExcel";

interface ExportReportsWrapperProps {
  reportsByUser: ReportsByUserForExcel[];
}

export function ExportReportsWrapper({ reportsByUser }: ExportReportsWrapperProps) {
  return <ExportReports reportsByUser={reportsByUser} />;
}
