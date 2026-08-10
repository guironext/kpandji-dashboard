"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { cn, formatNumberWithSpaces } from "@/lib/utils";
import FactureSavDocumentView from "@/components/sav/FactureSavDocumentView";
import {
  buildLineRowsFactureTerminee,
  buildPrintFactureSectionsHtmlFacture,
  escapeAttr,
  escapeHtmlSav,
  totalHtFromLines,
  TVA_RATE_SAV,
  type MaintenanceSAVFactureRow,
  type ReparationRow,
} from "@/lib/sav/savFactureLines";

const escapeHtml = escapeHtmlSav;
const TVA_RATE = TVA_RATE_SAV;

type FactureLite = {
  id: string;
  numero_facture: string;
  date_facture: string | Date;
};

export type ReparationFacturationRow = ReparationRow & {
  Maintenance?: MaintenanceSAVFactureRow[];
  FactureProformaSAV?: FactureLite[];
};

export default function FacturationSavClient() {
  const [reparations, setReparations] = useState<ReparationFacturationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sav/facturation-reparations");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Chargement impossible");
      }
      setReparations(json.data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(reparations.length / itemsPerPage));
  const currentRep = reparations[(currentPage - 1) * itemsPerPage];

  const maintenancesMo: MaintenanceSAVFactureRow[] = useMemo(() => {
    if (!currentRep?.Maintenance?.length) return [];
    return currentRep.Maintenance;
  }, [currentRep]);

  const lineRows = useMemo(
    () =>
      currentRep
        ? buildLineRowsFactureTerminee(
            currentRep as ReparationRow,
            maintenancesMo,
          )
        : [],
    [currentRep, maintenancesMo],
  );

  const totalHt = useMemo(() => totalHtFromLines(lineRows), [lineRows]);
  const montantTva = useMemo(
    () => Math.round(totalHt * (TVA_RATE / 100) * 100) / 100,
    [totalHt],
  );
  const totalTtc = useMemo(
    () => Math.round((totalHt + montantTva) * 100) / 100,
    [totalHt, montantTva],
  );

  const existingFacture = currentRep?.FactureProformaSAV?.[0];
  const canEnregistrer =
    currentRep &&
    !existingFacture &&
    currentRep.Maintenance &&
    currentRep.Maintenance.length > 0;

  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const handleEnregistrerFacture = async () => {
    if (!currentRep || saving || !canEnregistrer) return;
    const maintenanceId = currentRep.Maintenance?.[0]?.id?.trim();
    if (!maintenanceId) {
      toast.error("Maintenance introuvable pour enregistrer la facture");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sav/facture-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success("Facture enregistrée (FactureProformaSAV)");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!currentRep) {
      toast.error("Aucune réparation à imprimer");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression.");
      return;
    }

    const client = currentRep.voitureSAV.ClientSAV;
    const clientName = escapeHtml(`${client.prenom} ${client.nom}`.trim());
    const rows = buildLineRowsFactureTerminee(
      currentRep as ReparationRow,
      maintenancesMo,
    );
    const ht = totalHtFromLines(rows);
    const tva = Math.round(ht * (TVA_RATE / 100) * 100) / 100;
    const ttc = Math.round((ht + tva) * 100) / 100;

    const factureSectionsHtml = buildPrintFactureSectionsHtmlFacture(
      currentRep as ReparationRow,
      maintenancesMo,
    );

    const repId = escapeHtml(currentRep.id.slice(-7));
    const factureDate = escapeHtml(new Date().toLocaleDateString("fr-FR"));

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture SAV — ${repId}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 8mm; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #059669; padding-bottom: 8px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; }
            thead tr { background-color: #ecfdf5; border-bottom: 1px solid #000; }
            th, td { padding: 8px; font-size: 13px; }
            tfoot tr { background-color: #ecfdf5; }
            .total-row { font-weight: 600; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><img src="${escapeAttr(typeof window !== "undefined" ? window.location.origin : "")}/logo.png" alt="Logo" style="width: 100px; height: 50px; object-fit: contain;" /></div>
            <div>
              <h1 style="margin:0;font-size:22px;">KPANDJI AUTOMOBILES</h1>
              <p style="margin:4px 0 0;font-size:12px;">Services Après-Vente — Facturation</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 12px;">Date: ${factureDate}</div>
          <div style="text-align: center; margin: 16px 0;">
            <h1 style="border: 1px solid #000; padding: 8px 16px; display: inline-block; font-size: 16px; margin: 0;">FACTURE S.A.V.</h1>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px;">
            <div>
              <div><strong>Réf. réparation:</strong> ${repId}</div>
              <div><strong>Intitulé:</strong> ${escapeHtml(currentRep.categorie_reparation)}</div>
            </div>
            <div>
              <div><strong>Client:</strong> ${clientName}</div>
              <div><strong>Contact:</strong> ${escapeHtml(client.contact)}</div>
              ${client.entreprise ? `<div><strong>Entreprise:</strong> ${escapeHtml(client.entreprise)}</div>` : ""}
            </div>
          </div>
          <div style="margin-bottom: 12px; font-size: 12px;">
            <strong>Véhicule:</strong> ${escapeHtml(currentRep.voitureSAV.model)} — ${escapeHtml(currentRep.voitureSAV.immatriculation)} — ${escapeHtml(currentRep.voitureSAV.couleur)}
            (${escapeHtml(currentRep.voitureSAV.motorisation)}, ${escapeHtml(currentRep.voitureSAV.transmission)})
          </div>
          ${factureSectionsHtml}
          <table style="width:100%;border-collapse:collapse;margin-top:8px;">
            <tfoot>
              <tr style="background:#ecfdf5;"><td colspan="3" style="padding:8px;"></td><td style="text-align:right;padding:8px;font-weight:600;">Total HT</td><td style="text-align:right;padding:8px;">${formatNumberWithSpaces(ht)} FCFA</td></tr>
              <tr><td colspan="3" style="padding:8px;"></td><td style="text-align:right;padding:8px;">TVA (${TVA_RATE}%)</td><td style="text-align:right;padding:8px;">${formatNumberWithSpaces(tva)} FCFA</td></tr>
              <tr class="total-row" style="background:#ecfdf5;"><td colspan="3" style="padding:10px;"></td><td style="text-align:right;padding:10px;">Total TTC</td><td style="text-align:right;padding:10px;">${formatNumberWithSpaces(ttc)} FCFA</td></tr>
            </tfoot>
          </table>
          <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#64748b;text-align:center;line-height:1.5;">
            <p style="margin:0;">Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03</p>
            <p style="margin:4px 0 0;">Email: info@kpandji.com — www.kpandji.com</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
      setTimeout(() => printWindow.print(), 400);
    });
  };

  const getVisiblePages = () => {
    const maxVisible = 9;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600 text-sm">
        Chargement des factures SAV…
      </div>
    );
  }

  if (reparations.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
          Aucune réparation avec maintenance terminée. Les factures apparaissent lorsque la
          maintenance est au statut « terminée » pour au moins une catégorie.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 min-h-screen pb-16">
      <div className="bg-white rounded-lg shadow-xl p-4 m-4">
        <div className="flex w-full justify-between items-center mb-6 flex-wrap gap-4 print-hide">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">Réparation:</span>
            <Select
              value={String(currentPage)}
              onValueChange={(v) => setCurrentPage(Number(v))}
            >
              <SelectTrigger className="w-[min(100vw-8rem,380px)] bg-white border-2 border-emerald-500">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {reparations.map((r, i) => (
                  <SelectItem key={r.id} value={String(i + 1)}>
                    {r.categorie_reparation.slice(0, 48)}
                    {r.categorie_reparation.length > 48 ? "…" : ""} —{" "}
                    {r.voitureSAV.immatriculation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold border-2 border-emerald-500"
            >
              IMPRIMER
            </Button>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            {existingFacture ? (
              <span className="text-sm text-slate-600">
                Facture {existingFacture.numero_facture} —{" "}
                {new Date(existingFacture.date_facture).toLocaleDateString("fr-FR")}
              </span>
            ) : null}
            <Button
              type="button"
              disabled={!canEnregistrer || saving}
              onClick={() => void handleEnregistrerFacture()}
              className={cn(
                "font-semibold border-2",
                canEnregistrer
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                  : "bg-slate-300 text-slate-500 border-slate-200 cursor-not-allowed",
              )}
            >
              <FileCheck className="w-4 h-4 mr-2" />
              {saving ? "Enregistrement…" : "Enregistrer la facture"}
            </Button>
          </div>
        </div>

        {currentRep && (
          <div id="printable-facturation-sav">
            <FactureSavDocumentView
              rep={currentRep as ReparationRow}
              documentTitle="FACTURE S.A.V."
              servicesSubtitle="Services Après-Vente — Facturation"
              totalHt={totalHt}
              montantTva={montantTva}
              totalTtc={totalTtc}
              tvaRate={TVA_RATE}
              factureMainOeuvreParCategorie
              maintenancesMo={maintenancesMo}
            />
          </div>
        )}

        <div className="flex justify-center items-center gap-4 mt-8 print-hide">
          <Button
            type="button"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Précédent
          </Button>
          <div className="flex items-center gap-2">
            {getVisiblePages().map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  currentPage === pageNum
                    ? "bg-emerald-600 text-white shadow"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            Suivant
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
