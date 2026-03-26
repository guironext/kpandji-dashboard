"use client";

import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatNumberWithSpaces } from "@/lib/utils";

const TVA_RATE = 18;

type CatergorieDiagnostic = {
  id: string;
  nom: string;
};

type DetailDiagnosticRow = {
  id: string;
  nom: string;
  description: string | null;
  prix_unitaire: string | number | { toString(): string } | null;
  catergorieDiagnosticId: string;
  catergorieDiagnostic: CatergorieDiagnostic;
};

type PieceSAVRow = {
  id: string;
  nom: string;
  part_code: string | null;
  prix_vente: string | number | { toString(): string } | null;
  quantiteSortieDetail: number;
  detailDiagnosticId: string | null;
  reparationId: string | null;
};

type ReparationRow = {
  id: string;
  categorie_reparation: string;
  detail_reparation: string | null;
  horaire_travail_prix: string | number | { toString(): string } | null;
  horaire_travail_duration: string | null;
  createdAt: string;
  voitureSAV: {
    id: string;
    model: string;
    immatriculation: string;
    couleur: string;
    motorisation: string;
    transmission: string;
    ClientSAV: {
      nom: string;
      prenom: string;
      contact: string;
      email: string | null;
      entreprise: string | null;
      localisation: string | null;
    };
  };
  DetailDiagnostic: DetailDiagnosticRow[];
  PieceSAV: PieceSAVRow[];
};

function toNum(v: string | number | { toString(): string } | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type LineRow = {
  key: string;
  label: string;
  sublabel?: string;
  qty: number;
  unitHt: number;
  totalHt: number;
  kind: "detail" | "piece" | "horaire";
};

function buildLineRows(rep: ReparationRow): LineRow[] {
  const lines: LineRow[] = [];
  const byCat = new Map<string, { nom: string; details: DetailDiagnosticRow[] }>();

  for (const d of rep.DetailDiagnostic ?? []) {
    const cid = d.catergorieDiagnostic?.id ?? "unknown";
    const nom = d.catergorieDiagnostic?.nom ?? "Catégorie";
    if (!byCat.has(cid)) {
      byCat.set(cid, { nom, details: [] });
    }
    byCat.get(cid)!.details.push(d);
  }

  const categories = Array.from(byCat.entries());

  for (const [, { nom: catNom, details }] of categories) {
    for (const det of details) {
      const pu = toNum(det.prix_unitaire);
      if (pu > 0) {
        lines.push({
          key: `det-${det.id}`,
          label: `${catNom} — ${det.nom}`,
          sublabel: det.description ?? undefined,
          qty: 1,
          unitHt: pu,
          totalHt: pu,
          kind: "detail",
        });
      } else {
        lines.push({
          key: `det-${det.id}-hdr`,
          label: `${catNom} — ${det.nom}`,
          sublabel: det.description ?? undefined,
          qty: 0,
          unitHt: 0,
          totalHt: 0,
          kind: "detail",
        });
      }

      const piecesForDet = (rep.PieceSAV ?? [])
        .filter((p) => p.detailDiagnosticId === det.id)
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
      for (const piece of piecesForDet) {
        const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
        const pv = toNum(piece.prix_vente);
        const total = pv * q;
        lines.push({
          key: `piece-${piece.id}`,
          label: piece.nom,
          sublabel: piece.part_code ? `Réf. ${piece.part_code}` : undefined,
          qty: q,
          unitHt: pv,
          totalHt: total,
          kind: "piece",
        });
      }
    }
  }

  const usedPieceIds = new Set<string>();
  for (const det of rep.DetailDiagnostic ?? []) {
    for (const p of rep.PieceSAV ?? []) {
      if (p.detailDiagnosticId === det.id) usedPieceIds.add(p.id);
    }
  }
  const orphanPieces = (rep.PieceSAV ?? []).filter((p) => !usedPieceIds.has(p.id));

  for (const piece of orphanPieces) {
    const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
    const pv = toNum(piece.prix_vente);
    lines.push({
      key: `piece-orphan-${piece.id}`,
      label: piece.nom,
      sublabel: piece.part_code ? `Réf. ${piece.part_code}` : "Pièce (hors ligne diagnostic)",
      qty: q,
      unitHt: pv,
      totalHt: pv * q,
      kind: "piece",
    });
  }

  const hp = toNum(rep.horaire_travail_prix);
  const hd = rep.horaire_travail_duration?.trim();
  if (hd || hp > 0) {
    lines.push({
      key: `horaire-${rep.id}`,
      label: hd || "Main d'œuvre (durée)",
      sublabel: "Main d'œuvre / horaire atelier",
      qty: 1,
      unitHt: hp,
      totalHt: hp,
      kind: "horaire",
    });
  }

  return lines;
}

function totalHtFromLines(lines: LineRow[]): number {
  return lines.reduce((s, l) => s + l.totalHt, 0);
}

function getOrphanPieces(rep: ReparationRow): PieceSAVRow[] {
  const used = new Set<string>();
  for (const det of rep.DetailDiagnostic ?? []) {
    for (const p of rep.PieceSAV ?? []) {
      if (p.detailDiagnosticId === det.id) used.add(p.id);
    }
  }
  return (rep.PieceSAV ?? []).filter((p) => !used.has(p.id));
}

const escapeHtml = (value?: string | null) => {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const escapeAttr = (value?: string | null) => escapeHtml(value);

export default function ProformaSavClient() {
  const [reparations, setReparations] = useState<ReparationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sav/proforma-reparations");
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

  const lineRows = useMemo(
    () => (currentRep ? buildLineRows(currentRep) : []),
    [currentRep]
  );

  const totalHt = useMemo(() => totalHtFromLines(lineRows), [lineRows]);
  const montantTva = useMemo(() => Math.round(totalHt * (TVA_RATE / 100) * 100) / 100, [totalHt]);
  const totalTtc = useMemo(() => Math.round((totalHt + montantTva) * 100) / 100, [totalHt, montantTva]);

  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const getVisiblePages = () => {
    const maxVisible = 9;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
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
    const rows = buildLineRows(currentRep);
    const ht = totalHtFromLines(rows);
    const tva = Math.round(ht * (TVA_RATE / 100) * 100) / 100;
    const ttc = Math.round((ht + tva) * 100) / 100;

    let idx = 0;
    const bodyRows = rows
      .map((r) => {
        if (r.kind === "detail" && r.qty === 0 && r.totalHt === 0) {
          return `
          <tr style="border-bottom: 1px solid #fed7aa; background: #fffbeb;">
            <td style="padding: 6px; font-weight: 600;" colspan="5">${escapeHtml(r.label)}</td>
          </tr>`;
        }
        idx += 1;
        return `
          <tr style="border-bottom: 1px solid #fed7aa;">
            <td style="padding: 6px; text-align: center;">${idx}</td>
            <td style="padding: 6px; font-size: 12px;">${escapeHtml(r.label)}${r.sublabel ? `<div style="font-size: 9px; color: #64748b;">${escapeHtml(r.sublabel)}</div>` : ""}</td>
            <td style="padding: 6px; text-align: center;">${r.qty}</td>
            <td style="padding: 6px; text-align: right;">${formatNumberWithSpaces(r.unitHt)}</td>
            <td style="padding: 6px; text-align: right;">${formatNumberWithSpaces(r.totalHt)}</td>
          </tr>`;
      })
      .join("");

    const repId = escapeHtml(currentRep.id.slice(-7));
    const factureDate = escapeHtml(new Date(currentRep.createdAt).toLocaleDateString());

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma SAV — ${repId}</title>
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
              <p style="margin:4px 0 0;font-size:12px;">Services Après-Vente — Proforma</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 12px;">Date: ${factureDate}</div>
          <div style="text-align: center; margin: 16px 0;">
            <h1 style="border: 1px solid #000; padding: 8px 16px; display: inline-block; font-size: 16px; margin: 0;">FACTURE PROFORMA SAV</h1>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px;">
            <div>
              <div><strong>Réparation:</strong> ${escapeHtml(currentRep.categorie_reparation)}</div>
              <div><strong>Réf.:</strong> ${repId}</div>
            </div>
            <div>
              <div><strong>Client:</strong> ${clientName}</div>
              <div><strong>Contact:</strong> ${escapeHtml(client.contact)}</div>
              ${client.entreprise ? `<div><strong>Entreprise:</strong> ${escapeHtml(client.entreprise)}</div>` : ""}
            </div>
          </div>
          <div style="margin-bottom: 8px; font-size: 12px;">
            <strong>Véhicule:</strong> ${escapeHtml(currentRep.voitureSAV.model)} — ${escapeHtml(currentRep.voitureSAV.immatriculation)} — ${escapeHtml(currentRep.voitureSAV.couleur)}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th style="text-align:left;">Désignation (catégorie, détail, pièce, main d&apos;œuvre)</th>
                <th>Qté</th>
                <th style="text-align:right;">PU HT</th>
                <th style="text-align:right;">Total HT</th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
            <tfoot>
              <tr><td colspan="3"></td><td style="text-align:right;">Total HT</td><td style="text-align:right;">${formatNumberWithSpaces(ht)}</td></tr>
              <tr><td colspan="3"></td><td style="text-align:right;">TVA (${TVA_RATE}%)</td><td style="text-align:right;">${formatNumberWithSpaces(tva)}</td></tr>
              <tr class="total-row"><td colspan="3"></td><td style="text-align:right;">Total TTC</td><td style="text-align:right;">${formatNumberWithSpaces(ttc)}</td></tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
      setTimeout(() => printWindow.print(), 400);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600 text-sm">
        Chargement des proformas SAV…
      </div>
    );
  }

  if (reparations.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
          Aucune réparation enregistrée. Les proformas apparaissent après enregistrement d&apos;une réparation
          depuis &quot;Voiture réparation&quot;.
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
        </div>

        {currentRep && (
          <div id="printable-proforma-sav">
            <div className="flex w-full justify-between border-b-4 border-emerald-600 pb-4 mb-4">
              <div>
                <Image src="/logo.png" alt="Logo" width={100} height={50} priority />
              </div>
              <div className="flex flex-col justify-center -mb-10">
                <h1 className="text-2xl font-bold text-black">KPANDJI AUTOMOBILES</h1>
                <p className="text-sm text-black">Services Après-Vente — Proforma</p>
              </div>
            </div>

            <div className="flex items-end mt-8 justify-between w-full text-sm text-slate-600">
              <div />
              <div className="flex gap-2 text-black">
                <span>Date:</span>
                <span>{new Date(currentRep.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex w-full justify-center my-4">
              <h2 className="text-xl font-bold border border-black px-4 py-2 rounded-lg">
                FACTURE PROFORMA SAV
              </h2>
            </div>

            <div className="flex w-full justify-between mb-8 flex-wrap gap-4">
              <div className="text-black space-y-1 text-sm">
                <div className="flex gap-2 font-bold">
                  <span>Réf. réparation:</span>
                  <span className="uppercase">{currentRep.id.slice(-7)}</span>
                </div>
                <div>
                  <span className="font-semibold">Intitulé: </span>
                  {currentRep.categorie_reparation}
                </div>
              </div>
              <div className="text-black space-y-1 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold">Client:</span>
                  <span>
                    {currentRep.voitureSAV.ClientSAV.prenom} {currentRep.voitureSAV.ClientSAV.nom}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Contact:</span>
                  <span>{currentRep.voitureSAV.ClientSAV.contact}</span>
                </div>
                {currentRep.voitureSAV.ClientSAV.entreprise && (
                  <div className="flex gap-2">
                    <span className="font-semibold">Entreprise:</span>
                    <span>{currentRep.voitureSAV.ClientSAV.entreprise}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-4">
              <span className="font-semibold">Véhicule: </span>
              {currentRep.voitureSAV.model} — {currentRep.voitureSAV.immatriculation} —{" "}
              {currentRep.voitureSAV.couleur} ({currentRep.voitureSAV.motorisation},{" "}
              {currentRep.voitureSAV.transmission})
            </p>

            {(() => {
              const byCat = new Map<string, { nom: string; details: DetailDiagnosticRow[] }>();
              for (const d of currentRep.DetailDiagnostic ?? []) {
                const cid = d.catergorieDiagnostic?.id ?? "unknown";
                const nom = d.catergorieDiagnostic?.nom ?? "Catégorie";
                if (!byCat.has(cid)) byCat.set(cid, { nom, details: [] });
                byCat.get(cid)!.details.push(d);
              }
              const blocks = Array.from(byCat.entries());
              const orphanPieces = getOrphanPieces(currentRep);
              let rowNum = 0;
              return (
                <div className="space-y-6 mb-6">
                  {blocks.map(([cid, block]) => (
                    <div
                      key={cid}
                      className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 overflow-hidden"
                    >
                      <div className="px-4 py-2 bg-emerald-600/90 text-white font-semibold text-sm">
                        {block.nom}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-emerald-50 border-b border-emerald-200">
                            <TableHead className="w-10 text-black font-bold">#</TableHead>
                            <TableHead className="text-black font-bold">Détail / Pièce</TableHead>
                            <TableHead className="text-center text-black font-bold w-24">Qté</TableHead>
                            <TableHead className="text-right text-black font-bold w-32">PU HT</TableHead>
                            <TableHead className="text-right text-black font-bold w-36">Total HT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {block.details.map((det) => {
                            const piecesForDet = (currentRep.PieceSAV ?? [])
                              .filter((p) => p.detailDiagnosticId === det.id)
                              .sort((a, b) =>
                                a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
                              );
                            const puDet = toNum(det.prix_unitaire);
                            const rows: ReactNode[] = [];

                            rowNum += 1;
                            rows.push(
                              <TableRow
                                key={`d-${det.id}`}
                                className="bg-amber-50/50 border-b border-orange-100"
                              >
                                <TableCell className="align-top text-xs text-slate-500">{rowNum}</TableCell>
                                <TableCell className="font-semibold text-slate-900">
                                  {det.nom}
                                  {det.description && (
                                    <p className="text-[10px] font-normal text-slate-600 mt-1 max-w-prose">
                                      {det.description}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  {puDet > 0 ? 1 : "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {puDet > 0 ? formatNumberWithSpaces(puDet) : "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm pr-4">
                                  {puDet > 0 ? formatNumberWithSpaces(puDet) : "—"}
                                </TableCell>
                              </TableRow>
                            );

                            for (const piece of piecesForDet) {
                              const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
                              const pv = toNum(piece.prix_vente);
                              const lineTot = pv * q;
                              rowNum += 1;
                              rows.push(
                                <TableRow key={`p-${piece.id}`} className="bg-white border-b border-orange-100">
                                  <TableCell className="align-top text-xs text-slate-500">{rowNum}</TableCell>
                                  <TableCell className="text-slate-800">
                                    <span className="text-emerald-800 font-medium">Pièce — </span>
                                    {piece.nom}
                                    {piece.part_code && (
                                      <span className="text-xs text-slate-500"> ({piece.part_code})</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center text-sm">{q}</TableCell>
                                  <TableCell className="text-right text-sm">
                                    {formatNumberWithSpaces(pv)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm pr-4">
                                    {formatNumberWithSpaces(lineTot)}
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return <Fragment key={det.id}>{rows}</Fragment>;
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ))}

                  {orphanPieces.length > 0 && (
                    <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
                      <div className="px-4 py-2 bg-amber-700/90 text-white font-semibold text-sm">
                        Autres pièces (hors ligne diagnostic)
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-amber-50 border-b border-amber-200">
                            <TableHead className="w-10 text-black font-bold">#</TableHead>
                            <TableHead className="text-black font-bold">Pièce</TableHead>
                            <TableHead className="text-center text-black font-bold w-24">Qté</TableHead>
                            <TableHead className="text-right text-black font-bold w-32">PU HT</TableHead>
                            <TableHead className="text-right text-black font-bold w-36">Total HT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orphanPieces.map((piece) => {
                            rowNum += 1;
                            const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
                            const pv = toNum(piece.prix_vente);
                            return (
                              <TableRow key={piece.id} className="border-b border-orange-100">
                                <TableCell className="align-top text-xs text-slate-500">{rowNum}</TableCell>
                                <TableCell className="text-slate-800">
                                  {piece.nom}
                                  {piece.part_code && (
                                    <span className="text-xs text-slate-500"> ({piece.part_code})</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-sm">{q}</TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatNumberWithSpaces(pv)}
                                </TableCell>
                                <TableCell className="text-right text-sm pr-4">
                                  {formatNumberWithSpaces(pv * q)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {(toNum(currentRep.horaire_travail_prix) > 0 ||
                    (currentRep.horaire_travail_duration?.trim() ?? "")) && (
                    <div className="rounded-xl border border-slate-300 bg-slate-50/90 overflow-hidden">
                      <div className="px-4 py-2 bg-slate-700 text-white text-sm font-semibold">
                        Main d&apos;œuvre (réparation : {currentRep.categorie_reparation})
                      </div>
                      <div className="px-4 py-4 flex flex-wrap justify-between gap-3 items-center text-sm">
                        <span className="font-medium text-slate-900">
                          {currentRep.horaire_travail_duration?.trim() || "Durée / horaire atelier"}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {formatNumberWithSpaces(toNum(currentRep.horaire_travail_prix))} FCFA
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-4 ml-auto max-w-md rounded-lg overflow-hidden border border-slate-300 bg-white text-sm">
              <div className="flex justify-between items-center px-4 py-2 bg-emerald-50 border-b border-slate-200">
                <span className="font-semibold text-black">Total HT</span>
                <span className="font-medium tabular-nums">{formatNumberWithSpaces(totalHt)} FCFA</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-white border-b border-slate-200">
                <span className="text-black">TVA ({TVA_RATE}%)</span>
                <span className="font-medium tabular-nums">{formatNumberWithSpaces(montantTva)} FCFA</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 font-semibold uppercase">
                <span className="text-black">Total TTC</span>
                <span className="tabular-nums">{formatNumberWithSpaces(totalTtc)} FCFA</span>
              </div>
            </div>
            <div className="flex flex-col  items-start p-4 rounded-3xl border-1 border-slate-300 w-1/2">
             <span className="font-bold text-black">Note:</span> <br/>
             <span className="font-thin text-black">
              Sur la facture finale, il vous sera ajouter les frais des horaires-travail.
             </span>
            </div>
            

            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-600 text-center space-y-1">
              <p>Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04 77 03</p>
              <p>Email: info@kpandji.com — www.kpandji.com</p>
            </div>
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
