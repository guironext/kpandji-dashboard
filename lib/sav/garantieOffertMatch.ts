/** Match diagnostic detail lines against gift-warranty (garantie offerte) records. */

export type GarantieOffertMatch = {
  nom_garantie?: string | null;
  statut?: string | null;
  voitureSAVId?: string | null;
};

export type DetailGarantieMatch = {
  nom: string;
  garantieSAVId?: string | null;
};

export const STATUT_GARANTIE_TERMINEE = "GARANTIESAV_TERMINE";

function normalizeGarantieLibelle(value: string) {
  return value.trim().toLowerCase();
}

function garantieOffertNameTokens(nom_garantie?: string | null): string[] {
  if (!nom_garantie?.trim()) return [];
  const keys = new Set<string>();
  for (const line of nom_garantie.split(/[\n;]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    keys.add(normalizeGarantieLibelle(trimmed));
    for (const part of trimmed.split(/\s+[—–\-]\s+/)) {
      const token = normalizeGarantieLibelle(part);
      if (token) keys.add(token);
    }
  }
  return [...keys];
}

function detailMatchesGarantieOffert(
  nom: string,
  garanties: GarantieOffertMatch[] | undefined
): boolean {
  const key = normalizeGarantieLibelle(nom);
  if (!key) return false;
  const list = (garanties ?? []).filter((g) => g.statut !== "ANNULE");
  return list.some((g) => {
    const exact = normalizeGarantieLibelle(g.nom_garantie ?? "") === key;
    return exact || garantieOffertNameTokens(g.nom_garantie).includes(key);
  });
}

/** True if this diagnostic line is covered by a gift warranty (id, vehicle, or catalog). */
export function isDetailGarantieOffert(
  detail: DetailGarantieMatch,
  vehicleGaranties: GarantieOffertMatch[] | undefined,
  catalogGaranties: GarantieOffertMatch[]
): boolean {
  if (detail.garantieSAVId) return true;
  return (
    detailMatchesGarantieOffert(detail.nom, vehicleGaranties) ||
    detailMatchesGarantieOffert(detail.nom, catalogGaranties)
  );
}

/**
 * Lock gift-warranty diagnostic lines while vehicle warranty is not finished.
 * Unlocked only when StatutGarantie is GARANTIESAV_TERMINE.
 */
export function isGarantieOffertDetailLocked(
  statutGarantie: string | null | undefined,
  detail: DetailGarantieMatch,
  vehicleGaranties: GarantieOffertMatch[] | undefined,
  catalogGaranties: GarantieOffertMatch[]
): boolean {
  if (statutGarantie === STATUT_GARANTIE_TERMINEE) return false;
  return isDetailGarantieOffert(detail, vehicleGaranties, catalogGaranties);
}

/** Drop warranty-locked diagnostic lines (StatutGarantie ≠ GARANTIESAV_TERMINE). */
export function filterUnlockedDetails<T extends DetailGarantieMatch>(
  statutGarantie: string | null | undefined,
  details: T[],
  vehicleGaranties: GarantieOffertMatch[] | undefined,
  catalogGaranties: GarantieOffertMatch[]
): T[] {
  return details.filter(
    (d) =>
      !isGarantieOffertDetailLocked(
        statutGarantie,
        d,
        vehicleGaranties,
        catalogGaranties
      )
  );
}
