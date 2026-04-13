export type ReparationHoraireSlice = {
  horaire_travail_prix: unknown;
  horaire_travail_duration: string | null;
};

export type MaintenancePriceSlice = {
  prix_maintenance: unknown;
  duree_maintenance: string | null;
  catergorieDiagnosticId: string | null;
};

function decimalEq(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const na = Number(a);
  const nb = Number(b);
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}

function strEqNormalized(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return (a ?? "").trim() === (b ?? "").trim();
}

/**
 * Vérifie que chaque ligne maintenance a le même prix / durée que les champs
 * horaire de la réparation, et qu’une maintenance existe pour chaque catégorie
 * de diagnostic concernée.
 */
export function validateTerminerMaintenance(
  rep: ReparationHoraireSlice,
  maintenances: MaintenancePriceSlice[],
  detailCategorieIds: (string | null | undefined)[]
): { ok: true } | { ok: false; error: string } {
  const prixRef = rep.horaire_travail_prix;
  const dureeRef = rep.horaire_travail_duration;

  if (prixRef == null || dureeRef == null || dureeRef.trim() === "") {
    return {
      ok: false,
      error:
        "La réparation doit avoir un prix horaire (horaire_travail_prix) et une durée horaire (horaire_travail_duration) renseignés.",
    };
  }

  if (maintenances.length === 0) {
    return {
      ok: false,
      error:
        "Au moins une fiche maintenance doit être enregistrée avant de terminer.",
    };
  }

  const catIds = [
    ...new Set(
      detailCategorieIds.filter(
        (cid): cid is string => cid != null && String(cid).trim() !== ""
      )
    ),
  ];

  for (const cid of catIds) {
    const has = maintenances.some((m) => m.catergorieDiagnosticId === cid);
    if (!has) {
      return {
        ok: false,
        error:
          "Une maintenance est manquante pour au moins une catégorie de diagnostic.",
      };
    }
  }

  for (const m of maintenances) {
    if (!decimalEq(m.prix_maintenance, prixRef)) {
      return {
        ok: false,
        error:
          "Le prix maintenance de chaque ligne doit être égal au prix horaire de travail de la réparation (horaire_travail_prix = prix_maintenance).",
      };
    }
    if (!strEqNormalized(m.duree_maintenance, dureeRef)) {
      return {
        ok: false,
        error:
          "La durée maintenance de chaque ligne doit être égale à la durée horaire de la réparation (horaire_travail_duration = duree_maintenance).",
      };
    }
  }

  return { ok: true };
}
