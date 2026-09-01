import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTerminerMaintenance } from "@/lib/sav/terminerMaintenanceValidation";
import { filterUnlockedDetails } from "@/lib/sav/garantieOffertMatch";
import {
  StatutMaintenance,
  StatutReparation,
  StatutVoitureSAV,
} from "@prisma/client";
import { setVoitureSavStatutSql } from "@/lib/sav/voitureSavStatutSql";
import { withNestedVoitureSavStatutGarantie } from "@/lib/sav/voitureSavStatutGarantieSql";

export const dynamic = "force-dynamic";

/** Données fraîches pour valider prix/durée avant de terminer la maintenance */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Identifiant reparation manquant" },
        { status: 400 }
      );
    }
    const repId = id.trim();
    const rep = await prisma.reparation.findUnique({
      where: { id: repId },
      select: {
        id: true,
        statut: true,
        horaire_travail_prix: true,
        horaire_travail_duration: true,
        voitureSAVId: true,
        Maintenance: true,
        DetailDiagnostic: {
          select: {
            id: true,
            nom: true,
            garantieSAVId: true,
            catergorieDiagnosticId: true,
          },
        },
        voitureSAV: {
          select: {
            id: true,
            GarantieSAV: {
              select: {
                nom_garantie: true,
                statut: true,
                voitureSAVId: true,
              },
            },
          },
        },
      },
    });
    if (!rep) {
      return NextResponse.json(
        { success: false, error: "Réparation introuvable" },
        { status: 404 }
      );
    }
    const [hydrated] = await withNestedVoitureSavStatutGarantie([rep]);
    return NextResponse.json({ success: true, data: hydrated });
  } catch (error) {
    console.error("API reparation GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Identifiant reparation manquant" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const raw = body?.statut as string | undefined;
    const observations =
      typeof body?.observations === "string" ? body.observations.trim() : null;

    if (
      raw !== StatutReparation.EN_MAINTENANCE &&
      raw !== StatutReparation.TESTE &&
      raw !== StatutReparation.TERMINE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Statut non pris en charge (EN_MAINTENANCE, TESTE ou TERMINE uniquement)",
        },
        { status: 400 }
      );
    }
    const repId = id.trim();

    const snapshotRow = await prisma.reparation.findUnique({
      where: { id: repId },
      select: {
        id: true,
        statut: true,
        voitureSAVId: true,
        horaire_travail_prix: true,
        horaire_travail_duration: true,
        Maintenance: true,
        DetailDiagnostic: {
          select: {
            id: true,
            nom: true,
            garantieSAVId: true,
            catergorieDiagnosticId: true,
          },
        },
        voitureSAV: {
          select: {
            id: true,
            GarantieSAV: {
              select: {
                nom_garantie: true,
                statut: true,
                voitureSAVId: true,
              },
            },
          },
        },
      },
    });
    if (!snapshotRow) {
      return NextResponse.json(
        { success: false, error: "Réparation introuvable" },
        { status: 404 }
      );
    }
    const [snapshot] = await withNestedVoitureSavStatutGarantie([snapshotRow]);

    // Fin de maintenance → TESTE (prêt pour le test final)
    if (raw === StatutReparation.TESTE) {
      if (snapshot.statut !== StatutReparation.EN_MAINTENANCE) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Seules les réparations en maintenance peuvent passer au test final",
          },
          { status: 400 }
        );
      }

      const catalog = await prisma.garantieSAV.findMany({
        select: {
          nom_garantie: true,
          statut: true,
          voitureSAVId: true,
        },
      });
      const unlockedDetails = filterUnlockedDetails(
        snapshot.voitureSAV.StatutGarantie,
        snapshot.DetailDiagnostic,
        snapshot.voitureSAV.GarantieSAV,
        catalog
      );

      const check = validateTerminerMaintenance(
        snapshot,
        snapshot.Maintenance,
        unlockedDetails.map((d) => d.catergorieDiagnosticId)
      );
      if (!check.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Impossible de terminer la maintenance : ${check.error}`,
          },
          { status: 400 }
        );
      }

      const catIds = [
        ...new Set(
          unlockedDetails
            .map((d) => d.catergorieDiagnosticId)
            .filter((cid): cid is string => cid != null && cid !== "")
        ),
      ];

      if (catIds.length > 0) {
        await prisma.maintenance.updateMany({
          where: {
            reparationId: repId,
            catergorieDiagnosticId: { in: catIds },
          },
          data: { statut: StatutMaintenance.TERMINEE },
        });
      }

      const [updated] = await prisma.$transaction([
        prisma.reparation.update({
          where: { id: repId },
          data: { statut: StatutReparation.TESTE },
        }),
      ]);
      await setVoitureSavStatutSql(snapshot.voitureSAVId, "TESTE");

      return NextResponse.json({ success: true, data: updated });
    }

    // Test final validé → TERMINE
    if (raw === StatutReparation.TERMINE) {
      if (
        snapshot.statut !== StatutReparation.TESTE &&
        snapshot.statut !== StatutReparation.EN_MAINTENANCE
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Seules les réparations en test ou en maintenance peuvent être terminées",
          },
          { status: 400 }
        );
      }

      // Compatibilité : si encore en maintenance, valider comme avant
      if (snapshot.statut === StatutReparation.EN_MAINTENANCE) {
        const check = validateTerminerMaintenance(
          snapshot,
          snapshot.Maintenance,
          snapshot.DetailDiagnostic.map((d) => d.catergorieDiagnosticId)
        );
        if (!check.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Impossible de terminer : ${check.error}`,
            },
            { status: 400 }
          );
        }

        const catIds = [
          ...new Set(
            snapshot.DetailDiagnostic.map(
              (d) => d.catergorieDiagnosticId
            ).filter((cid): cid is string => cid != null && cid !== "")
          ),
        ];

        if (catIds.length > 0) {
          await prisma.maintenance.updateMany({
            where: {
              reparationId: repId,
              catergorieDiagnosticId: { in: catIds },
            },
            data: { statut: StatutMaintenance.TERMINEE },
          });
        }
      }

      let detail_reparation: string | undefined;
      if (observations) {
        const current = await prisma.reparation.findUnique({
          where: { id: repId },
          select: { detail_reparation: true },
        });
        detail_reparation = [current?.detail_reparation, `Test final : ${observations}`]
          .filter(Boolean)
          .join("\n\n");
      }

      const [updated] = await prisma.$transaction([
        prisma.reparation.update({
          where: { id: repId },
          data: {
            statut: StatutReparation.TERMINE,
            ...(detail_reparation !== undefined ? { detail_reparation } : {}),
          },
        }),
        prisma.voitureSAV.update({
          where: { id: snapshot.voitureSAVId },
          data: { statut: StatutVoitureSAV.TERMINE },
        }),
      ]);

      return NextResponse.json({ success: true, data: updated });
    }

    // EN_MAINTENANCE
    const updated = await prisma.reparation.update({
      where: { id: repId },
      data: { statut: raw },
    });
    if (snapshot.voitureSAVId) {
      await setVoitureSavStatutSql(snapshot.voitureSAVId, "EN_MAINTENANCE");
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Réparation introuvable" },
        { status: 404 }
      );
    }
    console.error("API reparation PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      },
      { status: 500 }
    );
  }
}
