"use client";

import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumberWithSpaces } from "@/lib/utils";
import {
  computeMainOeuvrePuQtyTotal,
  formatMontantFactureSAV,
  formatQtyFactureSAV,
  getOrphanPieces,
  splitMainOeuvreParCategorie,
  toNum,
  TVA_RATE_SAV,
  type MaintenanceSAVFactureRow,
  type ReparationRow,
} from "@/lib/sav/savFactureLines";

export type FactureSavDocumentViewProps = {
  rep: ReparationRow;
  documentTitle: string;
  servicesSubtitle: string;
  totalHt: number;
  montantTva: number;
  totalTtc: number;
  tvaRate?: number;
  note?: ReactNode;
  showProformaNote?: boolean;
  /** Une ligne Main d'œuvre par catégorie diagnostic (facture maintenance terminée). */
  factureMainOeuvreParCategorie?: boolean;
  maintenancesMo?: MaintenanceSAVFactureRow[];
};

export default function FactureSavDocumentView({
  rep,
  documentTitle,
  servicesSubtitle,
  totalHt,
  montantTva,
  totalTtc,
  tvaRate = TVA_RATE_SAV,
  note,
  showProformaNote = false,
  factureMainOeuvreParCategorie = false,
  maintenancesMo,
}: FactureSavDocumentViewProps) {
  return (
    <div>
      <div className="flex w-full justify-between border-b-4 border-emerald-600 pb-4 mb-4">
        <div>
          <Image src="/logo.png" alt="Logo" width={100} height={50} priority />
        </div>
        <div className="flex flex-col justify-center -mb-10">
          <h1 className="text-2xl font-bold text-black">KPANDJI AUTOMOBILES</h1>
          <p className="text-sm text-black">{servicesSubtitle}</p>
        </div>
      </div>

      <div className="flex items-end mt-8 justify-between w-full text-sm text-slate-600">
        <div />
        <div className="flex gap-2 text-black">
          <span>Date:</span>
          <span>
            {new Date(rep.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="flex w-full justify-center my-4">
        <h2 className="text-xl font-bold border border-black px-4 py-2 rounded-lg">
          {documentTitle}
        </h2>
      </div>

      <div className="flex w-full justify-between mb-8 flex-wrap gap-4">
        <div className="text-black space-y-1 text-sm">
          <div className="flex gap-2 font-bold">
            <span>Réf. réparation:</span>
            <span className="uppercase">{rep.id.slice(-7)}</span>
          </div>
          <div>
            <span className="font-semibold">Intitulé: </span>
            {rep.categorie_reparation}
          </div>
        </div>
        <div className="text-black space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold">Client:</span>
            <span>
              {rep.voitureSAV.ClientSAV.prenom} {rep.voitureSAV.ClientSAV.nom}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">Contact:</span>
            <span>{rep.voitureSAV.ClientSAV.contact}</span>
          </div>
          {rep.voitureSAV.ClientSAV.entreprise && (
            <div className="flex gap-2">
              <span className="font-semibold">Entreprise:</span>
              <span>{rep.voitureSAV.ClientSAV.entreprise}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-700 mb-4">
        <span className="font-semibold">Véhicule: </span>
        {rep.voitureSAV.model} — {rep.voitureSAV.immatriculation} —{" "}
        {rep.voitureSAV.couleur} ({rep.voitureSAV.motorisation},{" "}
        {rep.voitureSAV.transmission})
      </p>

      {(() => {
        const byCat = new Map<
          string,
          {
            nom: string;
            details: (typeof rep.DetailDiagnostic)[number][];
          }
        >();
        for (const d of rep.DetailDiagnostic ?? []) {
          const cid = d.catergorieDiagnostic?.id ?? "unknown";
          const nom = d.catergorieDiagnostic?.nom ?? "Catégorie";
          if (!byCat.has(cid)) byCat.set(cid, { nom, details: [] });
          byCat.get(cid)!.details.push(d);
        }
        const blocks = Array.from(byCat.entries());
        const orphanPieces = getOrphanPieces(rep);
        let rowNum = 0;
        const moParts = splitMainOeuvreParCategorie(
          toNum(rep.horaire_travail_prix),
          blocks.length,
        );
        const maintByCat = new Map<string | null, MaintenanceSAVFactureRow>();
        for (const m of maintenancesMo ?? []) {
          maintByCat.set(m.catergorieDiagnosticId ?? null, m);
        }
        return (
          <div className="space-y-6 mb-6">
            {blocks.map(([cid, block], blockIdx) => (
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
                      <TableHead className="text-center text-black font-bold w-24">
                        Qté
                      </TableHead>
                      <TableHead className="text-right text-black font-bold w-32">
                        PU HT
                      </TableHead>
                      <TableHead className="text-right text-black font-bold w-36">
                        Total HT
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {block.details.map((det) => {
                      const piecesForDet = (rep.PieceSAV ?? [])
                        .filter((p) => p.detailDiagnosticId === det.id)
                        .sort((a, b) =>
                          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }),
                        );
                      const puDet = toNum(det.prix_unitaire);
                      const rows: ReactNode[] = [];

                      rowNum += 1;
                      rows.push(
                        <TableRow
                          key={`d-${det.id}`}
                          className="bg-amber-50/50 border-b border-orange-100"
                        >
                          <TableCell className="align-top text-xs text-slate-500">
                            {rowNum}
                          </TableCell>
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
                        </TableRow>,
                      );

                      for (const piece of piecesForDet) {
                        const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
                        const pv = toNum(piece.prix_vente);
                        const lineTot = pv * q;
                        rowNum += 1;
                        rows.push(
                          <TableRow
                            key={`p-${piece.id}`}
                            className="bg-white border-b border-orange-100"
                          >
                            <TableCell className="align-top text-xs text-slate-500">
                              {rowNum}
                            </TableCell>
                            <TableCell className="text-slate-800">
                              <span className="text-emerald-800 font-medium">
                                Pièce —{" "}
                              </span>
                              {piece.nom}
                              {piece.part_code && (
                                <span className="text-xs text-slate-500">
                                  {" "}
                                  ({piece.part_code})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">{q}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatNumberWithSpaces(pv)}
                            </TableCell>
                            <TableCell className="text-right text-sm pr-4">
                              {formatNumberWithSpaces(lineTot)}
                            </TableCell>
                          </TableRow>,
                        );
                      }

                      return <Fragment key={det.id}>{rows}</Fragment>;
                    })}
                  </TableBody>
                  {factureMainOeuvreParCategorie &&
                    (() => {
                      const moHt = moParts[blockIdx] ?? 0;
                      const m = maintByCat.get(cid === "unknown" ? null : cid);
                      const dureeStr =
                        rep.horaire_travail_duration?.trim() ||
                        (m?.duree_maintenance != null
                          ? String(m.duree_maintenance).trim()
                          : "") ||
                        "";
                      const hasMoLine = moHt > 0 || dureeStr;
                      if (!hasMoLine) return null;
                      const { qty, puHt, totalHt } = computeMainOeuvrePuQtyTotal(
                        moHt,
                        dureeStr || null,
                      );
                      rowNum += 1;
                      return (
                        <TableFooter
                          key={`mo-foot-${cid}`}
                          className="border-t-2 border-emerald-500 bg-slate-100/95 [&_tr]:border-0"
                        >
                          <TableRow className="hover:bg-slate-100/95">
                            <TableCell className="align-top text-xs text-slate-500 py-3">
                              {rowNum}
                            </TableCell>
                            <TableCell className="font-bold text-slate-900 py-3">
                              Main d&apos;œuvre — {block.nom}
                            </TableCell>
                            <TableCell className="text-center text-sm py-3 tabular-nums">
                              {formatQtyFactureSAV(qty)}
                            </TableCell>
                            <TableCell className="text-right text-sm py-3 tabular-nums">
                              {formatMontantFactureSAV(puHt)}
                            </TableCell>
                            <TableCell className="text-right text-sm pr-4 py-3 tabular-nums">
                              {formatMontantFactureSAV(totalHt)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      );
                    })()}
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
                      <TableHead className="text-center text-black font-bold w-24">
                        Qté
                      </TableHead>
                      <TableHead className="text-right text-black font-bold w-32">
                        PU HT
                      </TableHead>
                      <TableHead className="text-right text-black font-bold w-36">
                        Total HT
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orphanPieces.map((piece) => {
                      rowNum += 1;
                      const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
                      const pv = toNum(piece.prix_vente);
                      return (
                        <TableRow key={piece.id} className="border-b border-orange-100">
                          <TableCell className="align-top text-xs text-slate-500">
                            {rowNum}
                          </TableCell>
                          <TableCell className="text-slate-800">
                            {piece.nom}
                            {piece.part_code && (
                              <span className="text-xs text-slate-500">
                                {" "}
                                ({piece.part_code})
                              </span>
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

            {!factureMainOeuvreParCategorie &&
              (toNum(rep.horaire_travail_prix) > 0 ||
                (rep.horaire_travail_duration?.trim() ?? "")) && (
              <div className="rounded-xl border border-slate-300 bg-slate-50/90 overflow-hidden">
                <div className="px-4 py-2 bg-slate-700 text-white text-sm font-semibold">
                  Main d&apos;œuvre (réparation : {rep.categorie_reparation})
                </div>
                <div className="px-4 py-4 flex flex-wrap justify-between gap-3 items-center text-sm">
                  <span className="font-medium text-slate-900">
                    {rep.horaire_travail_duration?.trim() || "Durée / horaire atelier"}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {formatNumberWithSpaces(toNum(rep.horaire_travail_prix))} FCFA
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
          <span className="font-medium tabular-nums">
            {formatNumberWithSpaces(totalHt)} FCFA
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-2 bg-white border-b border-slate-200">
          <span className="text-black">TVA ({tvaRate}%)</span>
          <span className="font-medium tabular-nums">
            {formatNumberWithSpaces(montantTva)} FCFA
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 font-semibold uppercase">
          <span className="text-black">Total TTC</span>
          <span className="tabular-nums">{formatNumberWithSpaces(totalTtc)} FCFA</span>
        </div>
      </div>

      {note}

      {showProformaNote && (
        <div className="flex flex-col items-start p-4 rounded-3xl border border-slate-300 w-1/2 mt-4">
          <span className="font-bold text-black">Note:</span>
          <br />
          <span className="font-normal text-black">
            Sur la facture finale, il vous sera ajouter les frais des horaires-travail.
          </span>
        </div>
      )}

      <div className="flex justify-between w-full mb-52">
        <div />
        <div className="flex flex-col items-center justify-center p-4 w-1/2">
          <span className="font-bold text-black items-center justify-center">
            Responsable SAV:
          </span>
          <br />
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-600 text-center space-y-1">
        <p>
          Abidjan, Cocody – Riviéra Palmerais – 06 BP 1255 Abidjan 06 / Tel : 00225 01 01 04
          77 03
        </p>
        <p>Email: info@kpandji.com — www.kpandji.com</p>
      </div>
    </div>
  );
}
