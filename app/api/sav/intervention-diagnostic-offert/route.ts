import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createInterventionOffertRaw,
  ensureInterventionOffertSchema,
  listInterventionsOffertRaw,
  maxInterventionNiveauRaw,
} from "@/lib/interventionDiagnosticOffertSql";

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

async function resolveGarantieQuota(
  voitureSAVId: string,
  detailDiagnosticId: string,
): Promise<{ garantieId: string; quota: number | null } | null> {
  const detail = await prisma.detailDiagnostic.findUnique({
    where: { id: detailDiagnosticId },
    select: { nom: true },
  });
  if (!detail?.nom) return null;

  const key = normalizeLibelle(detail.nom);
  const garanties = await prisma.garantieSAV.findMany({
    where: {
      voitureSAV: { is: { id: voitureSAVId } },
      statut: { not: "ANNULE" },
    },
    select: {
      id: true,
      nom_garantie: true,
      quantite_garantie_offert: true,
      statut: true,
    },
  });

  const match = garanties.find((g) => {
    const exact = normalizeLibelle(g.nom_garantie ?? "") === key;
    return exact || garantieNameTokens(g.nom_garantie).includes(key);
  });
  if (!match) return null;

  let quota =
    match.quantite_garantie_offert == null
      ? null
      : Math.trunc(Number(match.quantite_garantie_offert));

  if (quota == null) {
    const catalogs = await prisma.garantieSAV.findMany({
      where: {
        voitureSAVId: null,
        statut: { not: "ANNULE" },
      },
      select: {
        nom_garantie: true,
        quantite_garantie_offert: true,
      },
    });
    const catalog =
      catalogs.find((g) => normalizeLibelle(g.nom_garantie ?? "") === key) ??
      catalogs.find((g) => garantieNameTokens(g.nom_garantie).includes(key));
    if (catalog?.quantite_garantie_offert != null) {
      quota = Math.trunc(Number(catalog.quantite_garantie_offert));
    }
  }

  return {
    garantieId: match.id,
    quota,
  };
}

async function maybeTerminateGarantie(
  voitureSAVId: string,
  detailDiagnosticId: string,
  interventionCount: number,
) {
  const resolved = await resolveGarantieQuota(voitureSAVId, detailDiagnosticId);
  if (!resolved || resolved.quota == null) return;
  if (interventionCount < resolved.quota) return;

  await prisma.garantieSAV.update({
    where: { id: resolved.garantieId },
    data: { statut: "TERMINE" },
  });
}

/** List interventions for a vehicle (optionally one diagnostic line). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const voitureSAVId = searchParams.get("voitureSAVId")?.trim() || "";
    const detailDiagnosticId =
      searchParams.get("detailDiagnosticId")?.trim() || "";

    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId est requis" },
        { status: 400 },
      );
    }

    const rows = await listInterventionsOffertRaw(
      voitureSAVId,
      detailDiagnosticId || null,
    );
    const ids = rows.map((r) => r.id);
    const pieces =
      ids.length > 0
        ? await prisma.pieceSAV.findMany({
            where: { interventionDiagnosticOffertId: { in: ids } },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              nom: true,
              quantite_sortie: true,
              quantite_restante: true,
              part_code: true,
              interventionDiagnosticOffertId: true,
            },
          })
        : [];

    const items = rows.map((row) => ({
      ...row,
      PieceSAV: pieces.filter(
        (p) => p.interventionDiagnosticOffertId === row.id,
      ),
    }));

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("API intervention-diagnostic-offert GET error:", error);
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
 * Create an intervention (niveau_Intervention) and deduct spare-part stock.
 * pieceSAVId + quantite_sortie: increment PieceSAV.quantite_sortie,
 * decrement PieceSAV.quantite_restante, and attach a usage line to the intervention.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const voitureSAVId =
      typeof body.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";
    const pieceSAVId =
      typeof body.pieceSAVId === "string" ? body.pieceSAVId.trim() : "";
    const diagnosticOffertId =
      typeof body.diagnosticOffertId === "string"
        ? body.diagnosticOffertId.trim()
        : "";
    const typeProduitUtilise =
      typeof body.typeProduitUtilise === "string" && body.typeProduitUtilise.trim()
        ? body.typeProduitUtilise.trim()
        : "Intervention garantie offert";
    const groupePersonnelSAVId =
      typeof body.groupePersonnelSAVId === "string" &&
      body.groupePersonnelSAVId.trim()
        ? body.groupePersonnelSAVId.trim()
        : null;
    const diagnosticArriveeId =
      typeof body.diagnosticArriveeId === "string" &&
      body.diagnosticArriveeId.trim()
        ? body.diagnosticArriveeId.trim()
        : null;
    const detailDiagnosticId =
      typeof body.detailDiagnosticId === "string" &&
      body.detailDiagnosticId.trim()
        ? body.detailDiagnosticId.trim()
        : null;

    const quantiteRaw =
      typeof body.quantite_sortie === "string"
        ? parseInt(body.quantite_sortie, 10)
        : Number(body.quantite_sortie);
    const quantite_sortie = Number.isFinite(quantiteRaw)
      ? Math.trunc(quantiteRaw)
      : NaN;

    const niveauRaw =
      typeof body.niveau_Intervention === "string"
        ? parseInt(body.niveau_Intervention, 10)
        : Number(body.niveau_Intervention);

    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId est requis" },
        { status: 400 },
      );
    }
    if (!pieceSAVId) {
      return NextResponse.json(
        { success: false, error: "La pièce SAV est requise" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(quantite_sortie) || quantite_sortie <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La quantité sortie doit être un entier strictement positif",
        },
        { status: 400 },
      );
    }

    const [voiture, stockPiece, offert] = await Promise.all([
      prisma.voitureSAV.findUnique({
        where: { id: voitureSAVId },
        select: { id: true },
      }),
      prisma.pieceSAV.findUnique({ where: { id: pieceSAVId } }),
      diagnosticOffertId
        ? prisma.diagnosticOffert.findUnique({
            where: { id: diagnosticOffertId },
          })
        : Promise.resolve(null),
    ]);

    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }
    if (!stockPiece) {
      return NextResponse.json(
        { success: false, error: "Pièce SAV introuvable" },
        { status: 404 },
      );
    }
    if (stockPiece.quantite_restante < quantite_sortie) {
      return NextResponse.json(
        {
          success: false,
          error: `Stock insuffisant (restant : ${stockPiece.quantite_restante})`,
        },
        { status: 400 },
      );
    }
    if (diagnosticOffertId && !offert) {
      return NextResponse.json(
        { success: false, error: "Diagnostic offert introuvable" },
        { status: 404 },
      );
    }
    if (offert?.voitureSAVId && offert.voitureSAVId !== voitureSAVId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cette offre n'est pas applicable à ce véhicule",
        },
        { status: 400 },
      );
    }

    const now = new Date();
    if (offert && (offert.date_activation > now || offert.date_fin < now)) {
      return NextResponse.json(
        { success: false, error: "Cette offre n'est pas active actuellement" },
        { status: 400 },
      );
    }

    await ensureInterventionOffertSchema();

    const existingCount = (
      await listInterventionsOffertRaw(voitureSAVId, detailDiagnosticId)
    ).length;

    if (detailDiagnosticId) {
      const quotaCheck = await resolveGarantieQuota(
        voitureSAVId,
        detailDiagnosticId,
      );
      if (
        quotaCheck &&
        quotaCheck.quota != null &&
        existingCount >= quotaCheck.quota
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Quantité de garantie atteinte (${quotaCheck.quota})`,
          },
          { status: 400 },
        );
      }
    }

    const intervention = await prisma.$transaction(async (tx) => {
      const maxNiveau = await maxInterventionNiveauRaw(
        voitureSAVId,
        detailDiagnosticId,
        tx,
      );
      const niveau_Intervention =
        Number.isFinite(niveauRaw) && Math.trunc(niveauRaw) > 0
          ? Math.trunc(niveauRaw)
          : maxNiveau + 1;

      const created = await createInterventionOffertRaw(
        {
          typeProduitUtilise,
          niveau_Intervention,
          voitureSAVId,
          detailDiagnosticId,
          groupePersonnelSAVId,
        },
        tx,
      );

      await tx.pieceSAV.update({
        where: { id: pieceSAVId },
        data: {
          quantite_sortie: { increment: quantite_sortie },
          quantite_restante: { decrement: quantite_sortie },
        },
      });

      await tx.pieceSAV.create({
        data: {
          nom: stockPiece.nom,
          model_voiture: stockPiece.model_voiture,
          marque_piece: stockPiece.marque_piece,
          part_code: stockPiece.part_code,
          description: stockPiece.description,
          prix_achat: stockPiece.prix_achat,
          prix_vente: stockPiece.prix_vente,
          quantite_sortie,
          quantite_restante: 0,
          interventionDiagnosticOffert: { connect: { id: created.id } },
          ...(diagnosticArriveeId
            ? { diagnosticArrivee: { connect: { id: diagnosticArriveeId } } }
            : {}),
        },
      });

      if (offert) {
        await tx.diagnosticOffert.update({
          where: { id: offert.id },
          data: {
            interventionDiagnosticOffert: { connect: { id: created.id } },
            ...(diagnosticArriveeId
              ? { diagnosticArrivee: { connect: { id: diagnosticArriveeId } } }
              : {}),
            ...(offert.voitureSAVId
              ? {}
              : { voitureSAV: { connect: { id: voitureSAVId } } }),
          },
        });
      }

      const usagePieces = await tx.pieceSAV.findMany({
        where: { interventionDiagnosticOffertId: created.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          nom: true,
          quantite_sortie: true,
          quantite_restante: true,
          part_code: true,
        },
      });

      return { ...created, PieceSAV: usagePieces };
    });

    if (detailDiagnosticId) {
      const countAfter = (
        await listInterventionsOffertRaw(voitureSAVId, detailDiagnosticId)
      ).length;
      await maybeTerminateGarantie(voitureSAVId, detailDiagnosticId, countAfter);
    }

    return NextResponse.json({ success: true, data: intervention });
  } catch (error) {
    console.error("API intervention-diagnostic-offert POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de l'intervention",
      },
      { status: 500 },
    );
  }
}
