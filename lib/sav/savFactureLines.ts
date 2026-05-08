import { formatNumberWithSpaces } from "@/lib/utils";

export const TVA_RATE_SAV = 18;

export type CatergorieDiagnostic = {
  id: string;
  nom: string;
};

export type DetailDiagnosticRow = {
  id: string;
  nom: string;
  description: string | null;
  prix_unitaire: string | number | { toString(): string } | null;
  catergorieDiagnosticId: string;
  catergorieDiagnostic: CatergorieDiagnostic;
};

export type PieceSAVRow = {
  id: string;
  nom: string;
  part_code: string | null;
  prix_vente: string | number | { toString(): string } | null;
  quantiteSortieDetail: number;
  detailDiagnosticId: string | null;
  reparationId: string | null;
};

export type ReparationRow = {
  id: string;
  statut?: string;
  categorie_reparation: string;
  detail_reparation: string | null;
  horaire_travail_prix: string | number | { toString(): string } | null;
  horaire_travail_duration: string | null;
  createdAt: string | Date;
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

export type MaintenanceHoraire = {
  prix_maintenance: string | number | { toString(): string } | null | undefined;
  duree_maintenance: string | null | undefined;
};

/** Maintenance terminée (même réparation) pour une ligne MO par catégorie diagnostic */
export type MaintenanceSAVFactureRow = {
  id?: string;
  catergorieDiagnosticId: string | null;
  duree_maintenance: string | null | undefined;
  prix_maintenance: string | number | { toString(): string } | null | undefined;
};

export function toNum(
  v: string | number | { toString(): string } | null | undefined,
): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type LineRow = {
  key: string;
  label: string;
  sublabel?: string;
  qty: number;
  unitHt: number;
  totalHt: number;
  kind: "detail" | "piece" | "horaire";
};

export function buildLineRows(rep: ReparationRow): LineRow[] {
  const lines: LineRow[] = [];
  const byCat = new Map<
    string,
    { nom: string; details: DetailDiagnosticRow[] }
  >();

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
        .sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }),
        );
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
      sublabel: piece.part_code
        ? `Réf. ${piece.part_code}`
        : "Pièce (hors ligne diagnostic)",
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

/**
 * Facture finale : diagnostics + pièces comme le proforma, puis une ligne
 * « Main d'œuvre » par catégorie diagnostic (montant HT = horaire total / nb de catégories).
 * Les prix horaires enregistrés par maintenance sont alignés sur la réparation ; le total MO reste celui de la réparation.
 */
export function buildLineRowsFactureTerminee(
  rep: ReparationRow,
  maintenancesTerminees: MaintenanceSAVFactureRow[],
): LineRow[] {
  const lines: LineRow[] = [];
  const byCat = new Map<
    string,
    { nom: string; details: DetailDiagnosticRow[] }
  >();

  for (const d of rep.DetailDiagnostic ?? []) {
    const cid = d.catergorieDiagnostic?.id ?? "unknown";
    const nom = d.catergorieDiagnostic?.nom ?? "Catégorie";
    if (!byCat.has(cid)) {
      byCat.set(cid, { nom, details: [] });
    }
    byCat.get(cid)!.details.push(d);
  }

  const categories = Array.from(byCat.entries());
  const totalMo = toNum(rep.horaire_travail_prix);
  const moAmounts = splitMainOeuvreParCategorie(totalMo, categories.length);

  const maintByCat = new Map<string | null, MaintenanceSAVFactureRow>();
  for (const m of maintenancesTerminees ?? []) {
    maintByCat.set(m.catergorieDiagnosticId ?? null, m);
  }

  let catIdx = 0;
  for (const [cid, { nom: catNom, details }] of categories) {
    const moHtPerCat = moAmounts[catIdx] ?? 0;
    catIdx += 1;
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
        .sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }),
        );
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

    const m = maintByCat.get(cid === "unknown" ? null : cid);
    const dureeStr =
      rep.horaire_travail_duration?.trim() ||
      m?.duree_maintenance?.trim() ||
      "";
    if (moHtPerCat > 0 || dureeStr) {
      const { qty, puHt, totalHt } = computeMainOeuvrePuQtyTotal(
        moHtPerCat,
        dureeStr || null,
      );
      lines.push({
        key: `mo-cat-${cid}`,
        label: `Main d'œuvre — ${catNom}`,
        sublabel: dureeStr || "Main d'œuvre / horaire atelier",
        qty,
        unitHt: puHt,
        totalHt,
        kind: "horaire",
      });
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
      sublabel: piece.part_code
        ? `Réf. ${piece.part_code}`
        : "Pièce (hors ligne diagnostic)",
      qty: q,
      unitHt: pv,
      totalHt: pv * q,
      kind: "piece",
    });
  }

  return lines;
}

export function totalHtFromLines(lines: LineRow[]): number {
  return lines.reduce((s, l) => s + l.totalHt, 0);
}

export function getOrphanPieces(rep: ReparationRow): PieceSAVRow[] {
  const used = new Set<string>();
  for (const det of rep.DetailDiagnostic ?? []) {
    for (const p of rep.PieceSAV ?? []) {
      if (p.detailDiagnosticId === det.id) used.add(p.id);
    }
  }
  return (rep.PieceSAV ?? []).filter((p) => !used.has(p.id));
}

/** Pour la facturation maintenance : lignes identiques au proforma avec horaires issus de la maintenance. */
export function mergeReparationWithMaintenanceHoraire(
  rep: ReparationRow,
  m: MaintenanceHoraire,
): ReparationRow {
  return {
    ...rep,
    horaire_travail_prix: m.prix_maintenance ?? rep.horaire_travail_prix,
    horaire_travail_duration:
      m.duree_maintenance ?? rep.horaire_travail_duration,
  };
}

export function escapeHtmlSav(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const escapeAttr = (value?: string | null) => escapeHtmlSav(value);

/** Sections HTML (diagnostics, pièces, main d’œuvre) pour impression. */
export function buildPrintFactureSectionsHtml(rep: ReparationRow): string {
  const byCat = new Map<
    string,
    { nom: string; details: DetailDiagnosticRow[] }
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

  const theadBlock = (title: string, headerBg: string) => `
            <thead>
              <tr>
                <th colspan="5" style="background:${headerBg};color:#fff;font-weight:600;padding:8px 10px;text-align:left;font-size:13px;">${escapeHtmlSav(title)}</th>
              </tr>
              <tr style="background:#ecfdf5;border-bottom:1px solid #000;">
                <th style="padding:6px;width:36px;">#</th>
                <th style="padding:6px;text-align:left;">Détail / Pièce</th>
                <th style="padding:6px;text-align:center;width:48px;">Qté</th>
                <th style="padding:6px;text-align:right;width:88px;">PU HT</th>
                <th style="padding:6px;text-align:right;width:96px;">Total HT</th>
              </tr>
            </thead>`;

  const sections: string[] = [];

  for (const [, block] of blocks) {
    const rows: string[] = [];
    for (const det of block.details) {
      const piecesForDet = (rep.PieceSAV ?? [])
        .filter((p) => p.detailDiagnosticId === det.id)
        .sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }),
        );
      const puDet = toNum(det.prix_unitaire);
      rowNum += 1;
      const dash = "—";
      rows.push(`
            <tr style="border-bottom:1px solid #fed7aa;background:#fffbeb;">
              <td style="padding:6px;text-align:center;vertical-align:top;font-size:11px;color:#64748b;">${rowNum}</td>
              <td style="padding:6px;font-weight:600;font-size:12px;">
                ${escapeHtmlSav(det.nom)}
                ${det.description ? `<div style="font-size:9px;color:#64748b;font-weight:400;margin-top:2px;">${escapeHtmlSav(det.description)}</div>` : ""}
              </td>
              <td style="padding:6px;text-align:center;font-size:12px;">${puDet > 0 ? 1 : dash}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${puDet > 0 ? formatNumberWithSpaces(puDet) : dash}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${puDet > 0 ? formatNumberWithSpaces(puDet) : dash}</td>
            </tr>`);
      for (const piece of piecesForDet) {
        const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
        const pv = toNum(piece.prix_vente);
        const lineTot = pv * q;
        rowNum += 1;
        rows.push(`
            <tr style="border-bottom:1px solid #fed7aa;background:#fff;">
              <td style="padding:6px;text-align:center;vertical-align:top;font-size:11px;color:#64748b;">${rowNum}</td>
              <td style="padding:6px;font-size:12px;">
                <span style="color:#065f46;font-weight:600;">Pièce — </span>${escapeHtmlSav(piece.nom)}${piece.part_code ? ` <span style="font-size:10px;color:#64748b;">(${escapeHtmlSav(piece.part_code)})</span>` : ""}
              </td>
              <td style="padding:6px;text-align:center;font-size:12px;">${q}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(pv)}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(lineTot)}</td>
            </tr>`);
      }
    }
    sections.push(`
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
            ${theadBlock(block.nom, "#059669")}
            <tbody>${rows.join("")}</tbody>
          </table>`);
  }

  if (orphanPieces.length > 0) {
    const rows: string[] = [];
    for (const piece of orphanPieces) {
      const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
      const pv = toNum(piece.prix_vente);
      rowNum += 1;
      rows.push(`
            <tr style="border-bottom:1px solid #fed7aa;">
              <td style="padding:6px;text-align:center;vertical-align:top;font-size:11px;color:#64748b;">${rowNum}</td>
              <td style="padding:6px;font-size:12px;">
                ${escapeHtmlSav(piece.nom)}${piece.part_code ? ` <span style="font-size:10px;color:#64748b;">(${escapeHtmlSav(piece.part_code)})</span>` : ""}
              </td>
              <td style="padding:6px;text-align:center;font-size:12px;">${q}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(pv)}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(pv * q)}</td>
            </tr>`);
    }
    sections.push(`
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
            ${theadBlock("Autres pièces (hors ligne diagnostic)", "#b45309")}
            <tbody>${rows.join("")}</tbody>
          </table>`);
  }

  const hp = toNum(rep.horaire_travail_prix);
  const hd = rep.horaire_travail_duration?.trim();
  if (hd || hp > 0) {
    sections.push(`
          <div style="border:1px solid #cbd5e1;border-radius:6px;margin-bottom:14px;overflow:hidden;background:#f8fafc;">
            <div style="background:#334155;color:#fff;padding:8px 10px;font-size:13px;font-weight:600;">
              Main d&apos;œuvre (réparation : ${escapeHtmlSav(rep.categorie_reparation)})
            </div>
            <div style="padding:12px 14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;">
              <span style="font-weight:600;color:#0f172a;">${escapeHtmlSav(hd || "Durée / horaire atelier")}</span>
              <span style="font-weight:700;white-space:nowrap;">${formatNumberWithSpaces(hp)} FCFA</span>
            </div>
          </div>`);
  }

  return sections.join("");
}

/** Impression facture : une ligne Main d'œuvre par catégorie (pas de bloc MO global). */
export function buildPrintFactureSectionsHtmlFacture(
  rep: ReparationRow,
  maintenancesTerminees: MaintenanceSAVFactureRow[],
): string {
  const byCat = new Map<
    string,
    { nom: string; details: DetailDiagnosticRow[] }
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

  const maintByCat = new Map<string | null, MaintenanceSAVFactureRow>();
  for (const m of maintenancesTerminees ?? []) {
    maintByCat.set(m.catergorieDiagnosticId ?? null, m);
  }

  const totalMo = toNum(rep.horaire_travail_prix);
  const moParts = splitMainOeuvreParCategorie(totalMo, blocks.length);

  const theadBlock = (title: string, headerBg: string) => `
            <thead>
              <tr>
                <th colspan="5" style="background:${headerBg};color:#fff;font-weight:600;padding:8px 10px;text-align:left;font-size:13px;">${escapeHtmlSav(title)}</th>
              </tr>
              <tr style="background:#ecfdf5;border-bottom:1px solid #000;">
                <th style="padding:6px;width:36px;">#</th>
                <th style="padding:6px;text-align:left;">Détail / Pièce</th>
                <th style="padding:6px;text-align:center;width:48px;">Qté</th>
                <th style="padding:6px;text-align:right;width:88px;">PU HT</th>
                <th style="padding:6px;text-align:right;width:96px;">Total HT</th>
              </tr>
            </thead>`;

  const sections: string[] = [];
  let bi = 0;
  for (const [cid, block] of blocks) {
    const rows: string[] = [];
    for (const det of block.details) {
      const piecesForDet = (rep.PieceSAV ?? [])
        .filter((p) => p.detailDiagnosticId === det.id)
        .sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }),
        );
      const puDet = toNum(det.prix_unitaire);
      rowNum += 1;
      const dash = "—";
      rows.push(`
            <tr style="border-bottom:1px solid #fed7aa;background:#fffbeb;">
              <td style="padding:6px;text-align:center;vertical-align:top;font-size:11px;color:#64748b;">${rowNum}</td>
              <td style="padding:6px;font-weight:600;font-size:12px;">
                ${escapeHtmlSav(det.nom)}
                ${det.description ? `<div style="font-size:9px;color:#64748b;font-weight:400;margin-top:2px;">${escapeHtmlSav(det.description)}</div>` : ""}
              </td>
              <td style="padding:6px;text-align:center;font-size:12px;">${puDet > 0 ? 1 : dash}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${puDet > 0 ? formatNumberWithSpaces(puDet) : dash}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${puDet > 0 ? formatNumberWithSpaces(puDet) : dash}</td>
            </tr>`);
      for (const piece of piecesForDet) {
        const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
        const pv = toNum(piece.prix_vente);
        const lineTot = pv * q;
        rowNum += 1;
        rows.push(`
            <tr style="border-bottom:1px solid #fed7aa;background:#fff;">
              <td style="padding:6px;text-align:center;vertical-align:top;font-size:11px;color:#64748b;">${rowNum}</td>
              <td style="padding:6px;font-size:12px;">
                <span style="color:#065f46;font-weight:600;">Pièce — </span>${escapeHtmlSav(piece.nom)}${piece.part_code ? ` <span style="font-size:10px;color:#64748b;">(${escapeHtmlSav(piece.part_code)})</span>` : ""}
              </td>
              <td style="padding:6px;text-align:center;font-size:12px;">${q}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(pv)}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(lineTot)}</td>
            </tr>`);
      }
    }
    const moHt = moParts[bi] ?? 0;
    bi += 1;
    const m = maintByCat.get(cid === "unknown" ? null : cid);
    const dureeStr =
      rep.horaire_travail_duration?.trim() ||
      m?.duree_maintenance?.trim() ||
      "";
    let tfootHtml = "";
    if (moHt > 0 || dureeStr) {
      rowNum += 1;
      const { qty, puHt, totalHt } = computeMainOeuvrePuQtyTotal(
        moHt,
        dureeStr || null,
      );
      const qteCell = escapeHtmlSav(formatQtyFactureSAV(qty));
      tfootHtml = `
            <tfoot>
            <tr style="border-top:2px solid #059669;background:#f1f5f9;">
              <td style="padding:8px 6px;text-align:center;vertical-align:top;font-size:11px;color:#64748b;">${rowNum}</td>
              <td style="padding:8px 6px;font-size:12px;font-weight:700;">
                Main d&apos;œuvre — ${escapeHtmlSav(block.nom)}
              </td>
              <td style="padding:8px 6px;text-align:center;font-size:12px;max-width:10rem;">${qteCell}</td>
              <td style="padding:8px 6px;text-align:right;font-size:12px;">${escapeHtmlSav(formatMontantFactureSAV(puHt))}</td>
              <td style="padding:8px 6px;text-align:right;font-size:12px;">${escapeHtmlSav(formatMontantFactureSAV(totalHt))}</td>
            </tr>
            </tfoot>`;
    }
    sections.push(`
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
            ${theadBlock(block.nom, "#059669")}
            <tbody>${rows.join("")}</tbody>${tfootHtml}
          </table>`);
  }

  if (orphanPieces.length > 0) {
    const rows: string[] = [];
    for (const piece of orphanPieces) {
      const q = Math.max(0, piece.quantiteSortieDetail ?? 0);
      const pv = toNum(piece.prix_vente);
      rowNum += 1;
      rows.push(`
            <tr style="border-bottom:1px solid #fed7aa;">
              <td style="padding:6px;text-align:center;vertical-align:top;font-size:11px;color:#64748b;">${rowNum}</td>
              <td style="padding:6px;font-size:12px;">
                ${escapeHtmlSav(piece.nom)}${piece.part_code ? ` <span style="font-size:10px;color:#64748b;">(${escapeHtmlSav(piece.part_code)})</span>` : ""}
              </td>
              <td style="padding:6px;text-align:center;font-size:12px;">${q}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(pv)}</td>
              <td style="padding:6px;text-align:right;font-size:12px;">${formatNumberWithSpaces(pv * q)}</td>
            </tr>`);
    }
    sections.push(`
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
            ${theadBlock("Autres pièces (hors ligne diagnostic)", "#b45309")}
            <tbody>${rows.join("")}</tbody>
          </table>`);
  }

  return sections.join("");
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Interprète une durée saisie en heures (nombre, ex. "2", "2,5", "2h30", "90min").
 */
export function parseDurationToHours(input: string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).trim().toLowerCase();
  if (!s) return null;
  const compact = s.replace(/\s/g, "").replace(",", ".");
  if (/^\d+\.?\d*$/.test(compact)) {
    const n = Number(compact);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const hm = s.match(/(\d+)\s*h(?:\s*(\d+))?/i);
  if (hm) {
    const h = parseInt(hm[1], 10);
    const mm = hm[2] != null ? parseInt(hm[2], 10) : 0;
    if (h >= 0 && mm >= 0 && mm < 60) {
      const hours = h + mm / 60;
      return hours > 0 ? hours : null;
    }
  }
  const minOnly = s.match(/^(\d+)\s*(?:min|minutes?)$/i);
  if (minOnly) {
    const mins = parseInt(minOnly[1], 10);
    if (mins > 0) return mins / 60;
  }
  return null;
}

/** Montant avec jusqu'à 2 décimales (FCFA), pour PU / Total MO. */
export function formatMontantFactureSAV(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(roundMoney(n));
}

/** Quantité (heures) pour colonne Qté — main d'œuvre. */
export function formatQtyFactureSAV(qty: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(qty);
}

/**
 * Détail Main d'œuvre : Qté (heures) × PU HT = Total HT (arrondi cohérent).
 */
export function computeMainOeuvrePuQtyTotal(
  moHt: number,
  durationStr: string | null | undefined,
): { qty: number; puHt: number; totalHt: number } {
  const parsed = parseDurationToHours(durationStr);
  const qty =
    parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const totalHt = roundMoney(moHt);
  if (totalHt <= 0) {
    return { qty, puHt: 0, totalHt: 0 };
  }
  const puRaw = totalHt / qty;
  for (let dec = 2; dec <= 8; dec++) {
    const pu = Number(puRaw.toFixed(dec));
    if (Math.abs(roundMoney(qty * pu) - totalHt) < 0.005) {
      return { qty, puHt: pu, totalHt };
    }
  }
  return { qty, puHt: puRaw, totalHt };
}

/** Répartition du total MO sur les catégories (somme = totalMo). */
export function splitMainOeuvreParCategorie(
  totalMo: number,
  nCats: number,
): number[] {
  const n = Math.max(1, nCats);
  const out: number[] = [];
  if (totalMo <= 0) {
    for (let i = 0; i < n; i++) out.push(0);
    return out;
  }
  const base = Math.floor((totalMo * 100) / n) / 100;
  for (let i = 0; i < n - 1; i++) out.push(base);
  out.push(roundMoney(totalMo - base * (n - 1)));
  return out;
}
