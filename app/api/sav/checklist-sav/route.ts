import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StatutCheckListSAV } from "@prisma/client";

export const dynamic = "force-dynamic";

const BOOLEAN_FIELDS = [
  "pareBrise",
  "vitresLaterales",
  "lunetteArriere",
  "capot",
  "pareChocsAvant",
  "pareChocsArriere",
  "ailesAvant",
  "ailesArriere",
  "portes",
  "toit",
  "coffre",
  "retroviseurs",
  "essuieGlaces",
  "eclairageAvantArriere",
  "plaquesImmatriculation",
  "pressionCorrecte",
  "usureReguliere",
  "roueSecoursPresente",
  "cricPresent",
  "cleRouePresente",
  "niveauHuileMoteur",
  "liquideRefroidissement",
  "liquideFrein",
  "liquideDirectionAssistee",
  "liquideLaveGlace",
  "batterie",
  "courroies",
  "absenceFuite",
  "tableauBord",
  "temoinsAllumes",
  "climatisation",
  "chauffage",
  "klaxon",
  "ceinturesSecurite",
  "sieges",
  "leveVitres",
  "verrouillageCentralise",
  "autoradio",
  "feuxPosition",
  "feuxCroisement",
  "feuxRoute",
  "clignotants",
  "feuxStop",
  "feuxRecul",
  "feuxAntibrouillard",
  "controleMoteur",
  "controleEmbrayage",
  "controleBoiteVitesses",
  "controleDirection",
  "controleSuspension",
  "controleFreinage",
  "controleTransmission",
  "demarrageNormal",
  "accelerationCorrecte",
  "freinageEfficace",
  "directionStable",
  "absenceVibrations",
  "absenceBruitAnormal",
  "cle1",
  "cle2",
  "carteGrise",
  "accessoireRoueSecours",
  "accessoireCric",
  "trousseOutils",
  "giletSecurite",
  "triangleSignalisation",
] as const;

const STRING_FIELDS = [
  "titre",
  "numeroOrdreReparation",
  "nomClient",
  "telephone",
  "marque",
  "modele",
  "immatriculation",
  "numeroChassis",
  "niveauCarburant",
  "observations",
] as const;

const STATUTS: StatutCheckListSAV[] = [
  "EN_ATTENTE",
  "EN_COURS",
  "VALIDE",
  "TERMINEE",
  "ECHEC",
  "ANNULE",
];

const TYPES = ["RECEPTION", "PREPARATION", "FINALE"] as const;

function asOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function asOptionalInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

function asOptionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** GET latest checklist for a voitureSAV */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const voitureSAVId = searchParams.get("voitureSAVId");
    const type = searchParams.get("type");
    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 }
      );
    }

    const checklist = await prisma.checkListsSAV.findFirst({
      where: {
        voitureSAVId,
        ...(type && TYPES.includes(type as (typeof TYPES)[number])
          ? { type: type as (typeof TYPES)[number] }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: checklist });
  } catch (error) {
    console.error("API getCheckListsSAV error:", error);
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

/** POST create or update checklist for a voitureSAV */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const voitureSAVId =
      typeof body.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";

    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 }
      );
    }

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      select: { id: true },
    });
    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    for (const key of BOOLEAN_FIELDS) {
      if (typeof body[key] === "boolean") data[key] = body[key];
    }

    for (const key of STRING_FIELDS) {
      const v = asOptionalString(body[key]);
      if (v !== undefined) data[key] = v;
    }

    const kilometrage = asOptionalInt(body.kilometrage);
    if (kilometrage !== undefined) data.kilometrage = kilometrage;

    const date = asOptionalDate(body.date);
    if (date) data.date = date;

    if (
      typeof body.statut === "string" &&
      STATUTS.includes(body.statut as StatutCheckListSAV)
    ) {
      data.statut = body.statut as StatutCheckListSAV;
    }

    const type =
      typeof body.type === "string" &&
      TYPES.includes(body.type as (typeof TYPES)[number])
        ? (body.type as (typeof TYPES)[number])
        : "RECEPTION";
    data.type = type;

    const existing = await prisma.checkListsSAV.findFirst({
      where: { voitureSAVId, type },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.checkListsSAV.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.checkListsSAV.create({
          data: {
            ...data,
            voitureSAVId,
            type,
          },
        });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("API saveCheckListsSAV error:", error);
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
