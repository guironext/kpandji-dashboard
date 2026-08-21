import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeLibelle(value: string) {
  return value.trim().toLowerCase();
}

function garantieNameTokens(nom_garantie?: string | null): string[] {
  if (!nom_garantie?.trim()) return [];
  const keys = new Set<string>();
  for (const line of nom_garantie.split(/[\n;]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    keys.add(normalizeLibelle(trimmed));
    for (const part of trimmed.split(/\s+[—–\-]\s+/)) {
      const token = normalizeLibelle(part);
      if (token) keys.add(token);
    }
  }
  return [...keys];
}

function catalogQuotaForNom(
  nom: string,
  catalogs: {
    nom_garantie: string | null;
    quantite_garantie_offert: number | null;
  }[],
): number | null {
  const key = normalizeLibelle(nom);
  if (!key) return null;
  const match =
    catalogs.find((g) => normalizeLibelle(g.nom_garantie ?? "") === key) ??
    catalogs.find((g) => garantieNameTokens(g.nom_garantie).includes(key));
  if (match?.quantite_garantie_offert == null) return null;
  const q = Math.trunc(Number(match.quantite_garantie_offert));
  return Number.isFinite(q) ? q : null;
}

/** GET vehicles ready for dispatch (diagnostic finished) */
export async function GET() {
  try {
    const voitures = await prisma.voitureSAV.findMany({
      where: { statut: "DIAGNOSTIC_FINI" },
      include: {
        ClientSAV: true,
        diagnosticArrivee: {
          orderBy: { createdAt: "asc" },
          include: {
            catergorieDiagnostic: true,
            DetailDiagnostic: { orderBy: { createdAt: "asc" } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const groupes = await prisma.groupePersonnelSAV.findMany({
      orderBy: { nom: "asc" },
      select: {
        id: true,
        nom: true,
        chefGroupeId: true,
        chefGroupe: { select: { nom: true, prenom: true } },
        _count: { select: { personnelSAVs: true } },
      },
    });

    return NextResponse.json({ success: true, data: { voitures, groupes } });
  } catch (error) {
    console.error("API dispatching GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 },
    );
  }
}

/**
 * POST: assign a personnel group to a DIAGNOSTIC_FINI vehicle.
 * mode=normal  → Reparation + voitureSAV.statut EN_TRAITEMENT
 * mode=garantie → GarantieSAV + voitureSAV.statut GARANTIESAV_EN_COURS
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const voitureSAVId =
      typeof body.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";
    const groupePersonnelSAVId =
      typeof body.groupePersonnelSAVId === "string"
        ? body.groupePersonnelSAVId.trim()
        : "";
    const modeRaw = typeof body.mode === "string" ? body.mode.trim() : "normal";
    const mode = modeRaw === "garantie" ? "garantie" : "normal";

    if (!voitureSAVId || !groupePersonnelSAVId) {
      return NextResponse.json(
        {
          success: false,
          error: "voitureSAVId et groupePersonnelSAVId sont requis",
        },
        { status: 400 },
      );
    }

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      include: {
        diagnosticArrivee: {
          include: {
            catergorieDiagnostic: true,
            DetailDiagnostic: true,
          },
        },
      },
    });

    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }

    if (voiture.statut !== "DIAGNOSTIC_FINI") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Seuls les véhicules au statut « diagnostic fini » peuvent être dispatchés",
        },
        { status: 400 },
      );
    }

    const groupe = await prisma.groupePersonnelSAV.findUnique({
      where: { id: groupePersonnelSAVId },
      select: { id: true, nom: true },
    });
    if (!groupe) {
      return NextResponse.json(
        { success: false, error: "Groupe personnel introuvable" },
        { status: 404 },
      );
    }

    const allDetails = voiture.diagnosticArrivee.flatMap(
      (da) => da.DetailDiagnostic,
    );
    if (allDetails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun détail de diagnostic à dispatcher pour ce véhicule",
        },
        { status: 400 },
      );
    }

    const alreadyLinked = allDetails.some(
      (d) => d.reparationId != null || d.garantieSAVId != null,
    );
    if (alreadyLinked) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Certaines lignes de diagnostic sont déjà liées à une réparation ou une garantie",
        },
        { status: 409 },
      );
    }

    const categories = [
      ...new Set(
        voiture.diagnosticArrivee
          .map((da) => da.catergorieDiagnostic?.nom)
          .filter(Boolean),
      ),
    ] as string[];
    const categorie =
      categories.length > 0
        ? categories.join(" · ")
        : mode === "garantie"
          ? "Garantie SAV"
          : "Réparation atelier";

    const detailLines = voiture.diagnosticArrivee
      .flatMap((da) =>
        (da.DetailDiagnostic ?? []).map((dd) => {
          const cat = da.catergorieDiagnostic?.nom ?? "";
          return cat ? `${cat} — ${dd.nom}` : dd.nom;
        }),
      )
      .join("\n");

    let prixSum = new Decimal(0);
    for (const dd of allDetails) {
      const q = dd.prix_unitaire != null ? Number(dd.prix_unitaire) : 0;
      if (Number.isFinite(q)) prixSum = prixSum.add(new Decimal(q));
    }

    const voitureStatut =
      mode === "garantie" ? "GARANTIESAV_EN_COURS" : "EN_TRAITEMENT";
    const detailIds = allDetails.map((d) => d.id);

    let copiedQuota: number | null = null;
    if (mode === "garantie") {
      const catalogs = await prisma.garantieSAV.findMany({
        where: { voitureSAVId: null, statut: { not: "ANNULE" } },
        select: { nom_garantie: true, quantite_garantie_offert: true },
      });
      const quotas = [
        ...new Set(
          allDetails
            .map((d) => catalogQuotaForNom(d.nom, catalogs))
            .filter((q): q is number => q != null),
        ),
      ];
      copiedQuota = quotas.length === 1 ? quotas[0] : null;
    }

    const result = await prisma.$transaction(async (tx) => {
      if (mode === "garantie") {
        const garantie = await tx.garantieSAV.create({
          data: {
            categorie_garantie: categorie,
            nom_garantie: detailLines || null,
            prix_unitaire: prixSum.gt(0) ? prixSum : null,
            statut: "EN_TRAITEMENT",
            ...(copiedQuota != null
              ? { quantite_garantie_offert: copiedQuota }
              : {}),
            voitureSAV: { connect: { id: voitureSAVId } },
            groupePersonnelSAV: { connect: { id: groupe.id } },
          },
        });

        await tx.detailDiagnostic.updateMany({
          where: { id: { in: detailIds } },
          data: { garantieSAVId: garantie.id },
        });

        const updatedVoiture = await tx.voitureSAV.update({
          where: { id: voitureSAVId },
          data: { statut: voitureStatut },
        });

        return { garantieId: garantie.id, reparationId: null, updatedVoiture };
      }

      const reparation = await tx.reparation.create({
        data: {
          voitureSAVId,
          categorie_reparation: categorie,
          detail_reparation: detailLines || null,
          quantite: allDetails.length,
          prix_unitaire: prixSum.gt(0) ? prixSum : null,
          statut: "EN_TRAITEMENT",
          groupePersonnelSAVId: groupe.id,
        },
      });

      await tx.detailDiagnostic.updateMany({
        where: { id: { in: detailIds } },
        data: { reparationId: reparation.id },
      });

      const updatedVoiture = await tx.voitureSAV.update({
        where: { id: voitureSAVId },
        data: { statut: voitureStatut },
      });

      return { garantieId: null, reparationId: reparation.id, updatedVoiture };
    });

    return NextResponse.json({
      success: true,
      data: {
        reparationId: result.reparationId,
        garantieId: result.garantieId,
        voitureSAVId,
        statut: result.updatedVoiture.statut,
        mode,
        groupe: groupe.nom,
      },
    });
  } catch (error) {
    console.error("API dispatching POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du dispatching",
      },
      { status: 500 },
    );
  }
}
