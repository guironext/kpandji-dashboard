import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { isGarantieOffertDetailLocked } from "@/lib/sav/garantieOffertMatch";

export const dynamic = "force-dynamic";

type Body = {
  reparationId?: string;
  catergorieDiagnosticId?: string | null;
  nom?: string;
  description?: string | null;
  duree_maintenance?: string | null;
  prix_maintenance?: string | number | null;
};

function toDecimal(v: string | number | null | undefined): Decimal | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return new Decimal(n);
}

/** Crée ou met à jour une maintenance pour une réparation + catégorie diagnostic */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const reparationId = body.reparationId?.trim();
    if (!reparationId) {
      return NextResponse.json(
        { success: false, error: "reparationId requis" },
        { status: 400 }
      );
    }
    const nom = body.nom?.trim();
    if (!nom) {
      return NextResponse.json(
        { success: false, error: "nom requis" },
        { status: 400 }
      );
    }

    const catergorieDiagnosticId =
      body.catergorieDiagnosticId?.trim() || null;

    if (catergorieDiagnosticId) {
      const [rep, catalogGaranties] = await Promise.all([
        prisma.reparation.findUnique({
          where: { id: reparationId },
          select: {
            voitureSAV: {
              select: {
                StatutGarantie: true,
                GarantieSAV: {
                  select: {
                    nom_garantie: true,
                    statut: true,
                    voitureSAVId: true,
                  },
                },
              },
            },
            DetailDiagnostic: {
              select: {
                nom: true,
                garantieSAVId: true,
                catergorieDiagnosticId: true,
              },
            },
          },
        }),
        prisma.garantieSAV.findMany({
          select: {
            nom_garantie: true,
            statut: true,
            voitureSAVId: true,
          },
        }),
      ]);
      if (rep) {
        const details = rep.DetailDiagnostic.filter(
          (d) => d.catergorieDiagnosticId === catergorieDiagnosticId
        );
        if (
          details.length > 0 &&
          details.every((d) =>
            isGarantieOffertDetailLocked(
              rep.voitureSAV.StatutGarantie,
              d,
              rep.voitureSAV.GarantieSAV,
              catalogGaranties
            )
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "La saisie maintenance est désactivée pour cette catégorie : les lignes sont couvertes par une garantie offerte tant que la garantie n'est pas terminée.",
            },
            { status: 400 }
          );
        }
      }
    }

    const existing = await prisma.maintenance.findFirst({
      where: {
        reparationId,
        ...(catergorieDiagnosticId
          ? { catergorieDiagnosticId }
          : { catergorieDiagnosticId: null }),
      },
    });

    const data = {
      nom,
      description: body.description?.trim() || null,
      duree_maintenance: body.duree_maintenance?.trim() || null,
      /** Prix is optional — empty / missing values are stored as null. */
      prix_maintenance: toDecimal(body.prix_maintenance ?? null),
      reparationId,
      catergorieDiagnosticId,
    };

    const updateData = {
      nom: data.nom,
      description: data.description,
      duree_maintenance: data.duree_maintenance,
      prix_maintenance: data.prix_maintenance,
      catergorieDiagnosticId: data.catergorieDiagnosticId,
    } as unknown as Prisma.MaintenanceUncheckedUpdateInput;

    const saved = existing
      ? await prisma.maintenance.update({
          where: { id: existing.id },
          data: updateData,
        })
      : await prisma.maintenance.create({
          data,
        });

    /** Aligne la réparation sur le prix / durée saisis. Le prix est optionnel. */
    const dureeTrim = data.duree_maintenance?.trim() || null;
    const horairePatch: {
      horaire_travail_prix?: InstanceType<typeof Decimal> | null;
      horaire_travail_duration?: string | null;
    } = {};
    if (data.prix_maintenance != null) {
      horairePatch.horaire_travail_prix = data.prix_maintenance;
    }
    if (dureeTrim) {
      horairePatch.horaire_travail_duration = dureeTrim;
    }

    let reparationHoraire: {
      horaire_travail_prix: InstanceType<typeof Decimal> | null;
      horaire_travail_duration: string | null;
    } | null = null;
    if (Object.keys(horairePatch).length > 0) {
      reparationHoraire = await prisma.reparation.update({
        where: { id: reparationId },
        data: horairePatch,
        select: {
          horaire_travail_prix: true,
          horaire_travail_duration: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: saved,
      reparation: reparationHoraire,
    });
  } catch (error) {
    console.error("API maintenance POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'enregistrement",
      },
      { status: 500 }
    );
  }
}
