"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportReportsProps {
  reportsByUser: any[];
  totalReports: number;
}

export const ExportReports = ({ reportsByUser, totalReports }: ExportReportsProps) => {
  const exportToCSV = () => {
    const headers = [
      "Conseiller Commercial",
      "Date Rendez-vous",
      "Heure",
      "Durée",
      "Client",
      "Téléphone",
      "Email",
      "Type Client",
      "Lieu",
      "Degré d'intérêt",
      "Motivations",
      "Points Positifs",
      "Objections",
      "Commentaire",
    ];

    const rows = reportsByUser.flatMap(userGroup =>
      userGroup.reports.map((report: any) => [
        userGroup.conseiller_commercial,
        new Date(report.date_rendez_vous).toLocaleDateString("fr-FR"),
        report.heure_rendez_vous,
        report.duree_rendez_vous,
        report.nom_prenom_client,
        report.telephone_client,
        report.email_client || "",
        report.type_client,
        report.lieu_rendez_vous,
        report.degre_interet || "",
        report.motivations_achat || "",
        report.points_positifs || "",
        report.objections_freins || "",
        report.commentaire_global || "",
      ])
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
      <DropdownMenuContent align="end" className="w-48">
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

