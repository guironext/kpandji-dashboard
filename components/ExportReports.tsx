"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildRapportRendezVousExportRow,
  downloadExcelForAll,
  downloadExcelForUser,
  RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS,
  type ReportsByUserForExcel,
} from "@/lib/exportRapportExcel";

interface ExportReportsProps {
  reportsByUser: ReportsByUserForExcel[];
}

export const ExportReports = ({ reportsByUser }: ExportReportsProps) => {
  const exportToCSV = () => {
    const headers = [...RAPPORT_RENDEZ_VOUS_EXPORT_HEADERS];

    const rows = reportsByUser.flatMap((userGroup) =>
      userGroup.reports.map((report) =>
        buildRapportRendezVousExportRow(report, userGroup.conseiller_commercial)
      )
    );

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `rapports-rendezvous-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(reportsByUser, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `rapports-rendezvous-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllToExcel = () => {
    downloadExcelForAll(reportsByUser);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={exportAllToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span>Exporter tout en Excel</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <span>Exporter par conseiller (Excel)</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-[320px] overflow-y-auto">
            {reportsByUser.map((userGroup) => (
              <DropdownMenuItem
                key={userGroup.conseiller_commercial}
                onClick={() => downloadExcelForUser(userGroup)}
                className="gap-2 cursor-pointer"
              >
                <span className="truncate">
                  {userGroup.conseiller_commercial} ({userGroup.reports.length})
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span>Exporter en CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Exporter en JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

