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

/**
 * Vérifie qu’une fiche maintenance existe pour chaque catégorie de diagnostic,
 * et que les prix, s’ils sont saisis, sont alignés sur la réparation.
 * Le prix est optionnel : une maintenance peut être enregistrée / terminée sans Prix.
 * Les durées par ligne (duree_maintenance) ne sont pas comparées à horaire_travail_duration.
 */
export function validateTerminerMaintenance(
  rep: ReparationHoraireSlice,
  maintenances: MaintenancePriceSlice[],
  detailCategorieIds: (string | null | undefined)[]
): { ok: true } | { ok: false; error: string } {
  const prixRef = rep.horaire_travail_prix;
  const dureeRef = rep.horaire_travail_duration;
  const hasPrixRef = prixRef != null && prixRef !== "";

  if (dureeRef == null || dureeRef.trim() === "") {
    return {
      ok: false,
      error:
        "La réparation doit avoir une durée horaire (horaire_travail_duration) renseignée.",
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
    const hasLinePrix =
      m.prix_maintenance != null && m.prix_maintenance !== "";
    if (
      hasPrixRef &&
      hasLinePrix &&
      !decimalEq(m.prix_maintenance, prixRef)
    ) {
      return {
        ok: false,
        error:
          "Le prix maintenance de chaque ligne doit être égal au prix horaire de travail de la réparation (horaire_travail_prix = prix_maintenance).",
      };
    }
  }

  return { ok: true };
}
