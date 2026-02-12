"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { EtapeConteneur, EtapeCommande } from "@prisma/client";

// Type guard for objects with toNumber method
interface HasToNumber {
  toNumber: () => number;
}

// Type guard for objects with toString method
interface HasToString {
  toString: () => string;
}

// Helper function to safely convert Decimal to number
function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  // Handle Prisma Decimal object - check for Decimal instance
  if (value && typeof value === "object") {
    // Check if it's a Decimal object by checking for toString method and constructor name
    if (
      "constructor" in value &&
      value.constructor &&
      typeof value.constructor === "function" &&
      value.constructor.name === "Decimal"
    ) {
      try {
        const str = String(value);
        return parseFloat(str);
      } catch {
        return null;
      }
    }
    // Also check for Prisma Decimal by checking if it has a toNumber method
    if (
      "toNumber" in value &&
      typeof (value as HasToNumber).toNumber === "function"
    ) {
      try {
        return (value as HasToNumber).toNumber();
      } catch {
        try {
          const str =
            "toString" in value &&
            typeof (value as HasToString).toString === "function"
              ? (value as HasToString).toString()
              : String(value);
          return parseFloat(str);
        } catch {
          return null;
        }
      }
    }
    // Last resort: try to convert via toString
    if (
      "toString" in value &&
      typeof (value as HasToString).toString === "function"
    ) {
      try {
        const str = (value as HasToString).toString();
        const num = parseFloat(str);
        return isNaN(num) ? null : num;
      } catch {
        return null;
      }
    }
  }
  return null;
}

// Helper to check if an object is a Decimal
function isDecimal(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;

  // Check instanceof first
  try {
    if (obj instanceof Decimal) return true;
  } catch {}

  // Check constructor name
  if (
    "constructor" in obj &&
    obj.constructor &&
    typeof obj.constructor === "function" &&
    obj.constructor.name === "Decimal"
  )
    return true;

  // Check if it has Decimal-like methods and properties
  const hasToNumber =
    "toNumber" in obj && typeof (obj as HasToNumber).toNumber === "function";
  const hasToString =
    "toString" in obj && typeof (obj as HasToString).toString === "function";

  if (
    hasToNumber ||
    (hasToString && (obj as HasToString).toString !== Object.prototype.toString)
  ) {
    // Additional check: try to see if toString returns a number
    try {
      const str = String(obj);
      if (/^-?\d*\.?\d+$/.test(str.trim())) {
        return true;
      }
    } catch {}
  }

  return false;
}

// Recursive function to deeply convert all Decimal objects in an object
function deepConvertDecimals(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  // Check if it's a Decimal object - be very aggressive
  if (isDecimal(obj)) {
    const converted = decimalToNumber(obj);
    // If conversion failed, return null instead of the Decimal object
    return converted !== null ? converted : null;
  }

  // If it's an array, map over it
  if (Array.isArray(obj)) {
    return obj.map((item) => deepConvertDecimals(item));
  }

  // If it's a plain object, recursively convert all properties
  if (typeof obj === "object") {
    // Skip Date objects (they're already converted to ISO strings)
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Skip if it's already a primitive wrapper (String, Number, Boolean)
    if (
      obj instanceof String ||
      obj instanceof Number ||
      obj instanceof Boolean
    ) {
      return obj.valueOf();
    }

    const converted: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];
        // Double-check each value before adding
        if (isDecimal(value)) {
          converted[key] = decimalToNumber(value) ?? null;
        } else {
          converted[key] = deepConvertDecimals(value);
        }
      }
    }
    return converted;
  }

  // Return primitive values as-is
  return obj;
}

export async function createConteneur(data: {
  conteneurNumber: string;
  sealNumber: string;
  totalPackages?: string;
  grossWeight?: string;
  netWeight?: string;
  stuffingMap?: string;
  etapeConteneur?: EtapeConteneur;
  dateEmbarquement?: Date;
  dateArriveProbable?: Date;
}) {
  try {
    const conteneur = await prisma.conteneur.create({
      data: {
        conteneurNumber: data.conteneurNumber,
        sealNumber: data.sealNumber,
        totalPackages: data.totalPackages,
        grossWeight: data.grossWeight,
        netWeight: data.netWeight,
        stuffingMap: data.stuffingMap,
        etapeConteneur: data.etapeConteneur ?? EtapeConteneur.EN_ATTENTE,
        dateEmbarquement: data.dateEmbarquement,
        dateArriveProbable: data.dateArriveProbable,
      },
    });

    revalidatePath("/manager/ajouter-conteneur");
    revalidatePath("/manager/listeConteneurs/courriers/nouveau");
    return { success: true, data: conteneur };
  } catch (error) {
    console.error("Error creating conteneur:", error);
    return { success: false, error: "Failed to create conteneur" };
  }
}

export async function getConteneur(id: string) {
  try {
    
    const conteneur = await prisma.conteneur.findUnique({
      where: { id },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Subcase: {
          include: {
            SparePart: true,
            Tool: true,
          },
          orderBy: { createdAt: "desc" },
        },
        VerificationConteneur: true,
        Voiture: true,
      },
    });

    if (!conteneur) {
      return { success: false, error: "Conteneur not found" };
    }

    // Serialize Decimal values and Date objects
    const serializedConteneur = {
      ...conteneur,
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: ((conteneur as { Commande?: unknown[] }).Commande || []).map((commande: unknown) => {
        // Extract all fields and convert Decimal to number
        const cmd = commande as Record<string, unknown>;
        const { prix_unitaire, createdAt, updatedAt, date_livraison, ...rest } = cmd;
        return {
          ...rest,
          prix_unitaire: decimalToNumber(prix_unitaire),
          createdAt: (createdAt as Date).toISOString(),
          updatedAt: (updatedAt as Date).toISOString(),
          date_livraison: (date_livraison as Date | null)?.toISOString() || null,
          // Ensure nested objects are plain objects
          client: cmd.Client
            ? {
                ...(cmd.Client as Record<string, unknown>),
                createdAt:
                  (cmd.Client as { createdAt: Date | string }).createdAt instanceof Date
                    ? (cmd.Client as { createdAt: Date }).createdAt.toISOString()
                    : (cmd.Client as { createdAt: string }).createdAt,
                updatedAt:
                  (cmd.Client as { updatedAt: Date | string }).updatedAt instanceof Date
                    ? (cmd.Client as { updatedAt: Date }).updatedAt.toISOString()
                    : (cmd.Client as { updatedAt: string }).updatedAt,
              }
            : null,
          clientEntreprise: cmd.Client_entreprise
            ? {
                ...(cmd.Client_entreprise as Record<string, unknown>),
                createdAt:
                  (cmd.Client_entreprise as { createdAt: Date | string }).createdAt instanceof Date
                    ? (cmd.Client_entreprise as { createdAt: Date }).createdAt.toISOString()
                    : (cmd.Client_entreprise as { createdAt: string }).createdAt,
                updatedAt:
                  (cmd.Client_entreprise as { updatedAt: Date | string }).updatedAt instanceof Date
                    ? (cmd.Client_entreprise as { updatedAt: Date }).updatedAt.toISOString()
                    : (cmd.Client_entreprise as { updatedAt: string }).updatedAt,
              }
            : null,
          voitureModel: cmd.VoitureModel
            ? {
                ...(cmd.VoitureModel as Record<string, unknown>),
                createdAt:
                  (cmd.VoitureModel as { createdAt: Date | string }).createdAt instanceof Date
                    ? (cmd.VoitureModel as { createdAt: Date }).createdAt.toISOString()
                    : (cmd.VoitureModel as { createdAt: string }).createdAt,
                updatedAt:
                  (cmd.VoitureModel as { updatedAt: Date | string }).updatedAt instanceof Date
                    ? (cmd.VoitureModel as { updatedAt: Date }).updatedAt.toISOString()
                    : (cmd.VoitureModel as { updatedAt: string }).updatedAt,
              }
            : null,
        };
      }),
      subcases: ((conteneur as { Subcase?: unknown[] }).Subcase || []).map((subcase: unknown) => {
        const sc = subcase as Record<string, unknown> & { SparePart?: unknown[] };
        return {
          ...sc,
          createdAt: (sc.createdAt as Date).toISOString(),
          updatedAt: (sc.updatedAt as Date).toISOString(),
          spareParts: (sc.SparePart || []).map((sparePart: unknown) => {
            const sp = sparePart as Record<string, unknown>;
            return {
              ...sp,
              createdAt: (sp.createdAt as Date).toISOString(),
              updatedAt: (sp.updatedAt as Date).toISOString(),
            };
          }),
        };
      }),
      verifications: ((conteneur as { VerificationConteneur?: unknown[] }).VerificationConteneur || []).map(
        (verification: unknown) => {
          const v = verification as Record<string, unknown>;
          return {
            ...v,
            createdAt: (v.createdAt as Date).toISOString(),
            updatedAt: (v.updatedAt as Date).toISOString(),
          };
        }
      ),
      voitures: ((conteneur as { Voiture?: unknown[] }).Voiture || []).map((voiture: unknown) => {
        const v = voiture as Record<string, unknown>;
        return {
          ...v,
          createdAt: (v.createdAt as Date).toISOString(),
          updatedAt: (v.updatedAt as Date).toISOString(),
        };
      }),
    };

    return { success: true, data: serializedConteneur };
  } catch (error) {
    console.error("Error fetching conteneur:", error);
    return { success: false, error: "Failed to fetch conteneur" };
  }
}

export async function getAllConteneurs() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      include: {
        Commande: true,
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values and Date objects
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & { Commande?: unknown[]; Subcase?: unknown[]; VerificationConteneur?: unknown[]; Voiture?: unknown[] };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown>;
          return {
            ...cmd,
            prix_unitaire: cmd.prix_unitaire
              ? Number(cmd.prix_unitaire)
              : null,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown>;
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
          };
        }),
        verifications: (c.VerificationConteneur || []).map(
          (verification: unknown) => {
            const v = verification as Record<string, unknown>;
            return {
              ...v,
              createdAt: (v.createdAt as Date).toISOString(),
              updatedAt: (v.updatedAt as Date).toISOString(),
            };
          }
        ),
        voitures: (c.Voiture || []).map((voiture: unknown) => {
          const v = voiture as Record<string, unknown>;
          return {
            ...v,
            createdAt: (v.createdAt as Date).toISOString(),
            updatedAt: (v.updatedAt as Date).toISOString(),
          };
        }),
      };
    });

    // Use deepConvertDecimals to catch any remaining Decimal objects
    const finalSerialized = deepConvertDecimals(serializedConteneurs);

    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching conteneurs:", error);
    return { success: false, error: "Failed to fetch conteneurs" };
  }
}

export async function getAllConteneursWithTransiteCommandes() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        Commande: {
          some: {
            etapeCommande: "TRANSITE",
          },
        },
      },
      include: {
        Commande: {
          where: {
            etapeCommande: "TRANSITE",
          },
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values and Date objects
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & { Commande?: unknown[]; Subcase?: unknown[]; VerificationConteneur?: unknown[]; Voiture?: unknown[] };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & { VoitureModel?: unknown; Client?: unknown; Client_entreprise?: unknown };
          let prixUnitaireFinal: number | null = null;
          const prixRaw = cmd.prix_unitaire;

          if (prixRaw === null || prixRaw === undefined) {
            prixUnitaireFinal = null;
          } else {
            try {
              if (typeof prixRaw === "number") {
                prixUnitaireFinal = prixRaw;
              } else if (typeof prixRaw === "string") {
                prixUnitaireFinal = parseFloat(prixRaw);
              } else if (prixRaw && typeof prixRaw === "object") {
                if (
                  "constructor" in prixRaw &&
                  prixRaw.constructor &&
                  typeof prixRaw.constructor === "function" &&
                  prixRaw.constructor.name === "Decimal"
                ) {
                  try {
                    const str = String(prixRaw);
                    prixUnitaireFinal = parseFloat(str);
                  } catch {
                    prixUnitaireFinal = null;
                  }
                } else if (
                  "toNumber" in (prixRaw as { toNumber?: () => number }) &&
                  typeof (prixRaw as { toNumber: () => number }).toNumber === "function"
                ) {
                  prixUnitaireFinal = (prixRaw as { toNumber: () => number }).toNumber();
                } else if (
                  "toString" in (prixRaw as { toString?: () => string }) &&
                  typeof (prixRaw as { toString: () => string }).toString === "function"
                ) {
                  const str = (prixRaw as { toString: () => string }).toString();
                  prixUnitaireFinal = parseFloat(str);
                }
              }
            } catch {
              prixUnitaireFinal = null;
            }
          }

          return {
            ...cmd,
            prix_unitaire: prixUnitaireFinal,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            voitureModel: cmd.VoitureModel
              ? {
                  ...(cmd.VoitureModel as Record<string, unknown>),
                  createdAt:
                    (cmd.VoitureModel as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.VoitureModel as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.VoitureModel as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.VoitureModel as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.VoitureModel as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.VoitureModel as { updatedAt: string }).updatedAt),
                }
              : null,
            client: cmd.Client
              ? {
                  ...(cmd.Client as Record<string, unknown>),
                  createdAt:
                    (cmd.Client as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client as { updatedAt: string }).updatedAt),
                }
              : null,
            clientEntreprise: cmd.Client_entreprise
              ? {
                  ...(cmd.Client_entreprise as Record<string, unknown>),
                  createdAt:
                    (cmd.Client_entreprise as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client_entreprise as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client_entreprise as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client_entreprise as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client_entreprise as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client_entreprise as { updatedAt: string }).updatedAt),
                }
              : null,
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown>;
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
          };
        }),
        verifications: (c.VerificationConteneur || []).map(
          (verification: unknown) => {
            const v = verification as Record<string, unknown>;
            return {
              ...v,
              createdAt: (v.createdAt as Date).toISOString(),
              updatedAt: (v.updatedAt as Date).toISOString(),
            };
          }
        ),
        voitures: (c.Voiture || []).map((voiture: unknown) => {
          const v = voiture as Record<string, unknown>;
          return {
            ...v,
            createdAt: (v.createdAt as Date).toISOString(),
            updatedAt: (v.updatedAt as Date).toISOString(),
          };
        }),
      };
    });

    // Use deepConvertDecimals to catch any remaining Decimal objects
    const finalSerialized = deepConvertDecimals(serializedConteneurs);

    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching conteneurs with TRANSITE commandes:", error);
    return {
      success: false,
      error: "Failed to fetch conteneurs with TRANSITE commandes",
    };
  }
}

export async function getConteneursChargeWithTransiteCommandes() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "CHARGE",
        Commande: {
          some: {
            etapeCommande: "TRANSITE",
          },
        },
      },
      include: {
        Commande: {
          where: {
            etapeCommande: "TRANSITE",
          },
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values and Date objects
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => ({
      ...(conteneur as Record<string, unknown>),
      id: (conteneur as Record<string, unknown>).id,
      conteneurNumber: (conteneur as Record<string, unknown>).conteneurNumber,
      sealNumber: (conteneur as Record<string, unknown>).sealNumber,
      totalPackages: (conteneur as Record<string, unknown>).totalPackages,
      grossWeight: (conteneur as Record<string, unknown>).grossWeight,
      netWeight: (conteneur as Record<string, unknown>).netWeight,
      stuffingMap: (conteneur as Record<string, unknown>).stuffingMap,
      etapeConteneur: String((conteneur as Record<string, unknown>).etapeConteneur),
      createdAt: ((conteneur as Record<string, unknown>).createdAt as Date).toISOString(),
      updatedAt: ((conteneur as Record<string, unknown>).updatedAt as Date).toISOString(),
      dateEmbarquement: ((conteneur as Record<string, unknown>).dateEmbarquement as Date | null)?.toISOString() || null,
      dateArriveProbable: ((conteneur as Record<string, unknown>).dateArriveProbable as Date | null)?.toISOString() || null,
      commandes: ((conteneur as { Commande?: unknown[] }).Commande || []).map((commande: unknown) => {
        let prixUnitaireFinal: number | null = null;
        const prixRaw = (commande as { prix_unitaire?: unknown }).prix_unitaire;

        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          try {
            if (typeof prixRaw === "number") {
              prixUnitaireFinal = prixRaw;
            } else if (typeof prixRaw === "string") {
              prixUnitaireFinal = parseFloat(prixRaw);
            } else if (prixRaw && typeof prixRaw === "object") {
              if (
                "constructor" in prixRaw &&
                prixRaw.constructor &&
                typeof prixRaw.constructor === "function" &&
                prixRaw.constructor.name === "Decimal"
              ) {
                try {
                  const str = String(prixRaw);
                  prixUnitaireFinal = parseFloat(str);
                } catch {
                  prixUnitaireFinal = null;
                }
              } else if (
                "toNumber" in prixRaw &&
                typeof (prixRaw as { toNumber?: () => number }).toNumber === "function"
              ) {
                prixUnitaireFinal = (prixRaw as { toNumber: () => number }).toNumber();
              } else if (
                "toString" in prixRaw &&
                typeof (prixRaw as { toString?: () => string }).toString === "function"
              ) {
                const str = (prixRaw as { toString: () => string }).toString();
                prixUnitaireFinal = parseFloat(str);
              }
            }
          } catch {
            prixUnitaireFinal = null;
          }
        }

        return {
          ...(commande as Record<string, unknown>),
          prix_unitaire: prixUnitaireFinal,
          date_livraison: (commande as { date_livraison?: Date }).date_livraison
            ? (commande as { date_livraison: Date }).date_livraison.toISOString()
            : null,
          createdAt: ((commande as { createdAt: Date }).createdAt).toISOString(),
          updatedAt: ((commande as { updatedAt: Date }).updatedAt).toISOString(),
          voitureModel: (commande as { VoitureModel?: unknown }).VoitureModel
            ? {
                ...(commande as { VoitureModel: Record<string, unknown> }).VoitureModel,
                createdAt:
                  (commande as { VoitureModel: { createdAt: Date | string } }).VoitureModel.createdAt instanceof Date
                    ? ((commande as { VoitureModel: { createdAt: Date } }).VoitureModel.createdAt).toISOString()
                    : ((commande as { VoitureModel: { createdAt: string } }).VoitureModel.createdAt),
                updatedAt:
                  (commande as { VoitureModel: { updatedAt: Date | string } }).VoitureModel.updatedAt instanceof Date
                    ? ((commande as { VoitureModel: { updatedAt: Date } }).VoitureModel.updatedAt).toISOString()
                    : ((commande as { VoitureModel: { updatedAt: string } }).VoitureModel.updatedAt),
              }
            : null,
          client: (commande as { Client?: unknown }).Client
            ? {
                ...(commande as { Client: Record<string, unknown> }).Client,
                createdAt:
                  (commande as { Client: { createdAt: Date | string } }).Client.createdAt instanceof Date
                    ? ((commande as { Client: { createdAt: Date } }).Client.createdAt).toISOString()
                    : ((commande as { Client: { createdAt: string } }).Client.createdAt),
                updatedAt:
                  (commande as { Client: { updatedAt: Date | string } }).Client.updatedAt instanceof Date
                    ? ((commande as { Client: { updatedAt: Date } }).Client.updatedAt).toISOString()
                    : ((commande as { Client: { updatedAt: string } }).Client.updatedAt),
              }
            : null,
          clientEntreprise: (commande as { Client_entreprise?: unknown }).Client_entreprise
            ? {
                ...(commande as { Client_entreprise: Record<string, unknown> }).Client_entreprise,
                createdAt:
                  (commande as { Client_entreprise: { createdAt: Date | string } }).Client_entreprise.createdAt instanceof Date
                    ? ((commande as { Client_entreprise: { createdAt: Date } }).Client_entreprise.createdAt).toISOString()
                    : ((commande as { Client_entreprise: { createdAt: string } }).Client_entreprise.createdAt),
                updatedAt:
                  (commande as { Client_entreprise: { updatedAt: Date | string } }).Client_entreprise.updatedAt instanceof Date
                    ? ((commande as { Client_entreprise: { updatedAt: Date } }).Client_entreprise.updatedAt).toISOString()
                    : ((commande as { Client_entreprise: { updatedAt: string } }).Client_entreprise.updatedAt),
              }
            : null,
        };
      }),
      subcases: ((conteneur as { Subcase?: unknown[] }).Subcase || []).map((subcase: unknown) => ({
        ...(subcase as Record<string, unknown>),
        createdAt: ((subcase as { createdAt: Date }).createdAt).toISOString(),
        updatedAt: ((subcase as { updatedAt: Date }).updatedAt).toISOString(),
      })),
      verifications: ((conteneur as { VerificationConteneur?: unknown[] }).VerificationConteneur || []).map(
        (verification: unknown) => ({
          ...(verification as Record<string, unknown>),
          createdAt: ((verification as { createdAt: Date }).createdAt).toISOString(),
          updatedAt: ((verification as { updatedAt: Date }).updatedAt).toISOString(),
        })
      ),
      voitures: ((conteneur as { Voiture?: unknown[] }).Voiture || []).map((voiture: unknown) => ({
        ...(voiture as Record<string, unknown>),
        createdAt: ((voiture as { createdAt: Date }).createdAt).toISOString(),
        updatedAt: ((voiture as { updatedAt: Date }).updatedAt).toISOString(),
      })),
    }));

    // Use deepConvertDecimals to catch any remaining Decimal objects
    const finalSerialized = deepConvertDecimals(serializedConteneurs);

    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error(
      "Error fetching conteneurs CHARGE with TRANSITE commandes:",
      error,
    );
    return {
      success: false,
      error: "Failed to fetch conteneurs CHARGE with TRANSITE commandes",
    };
  }
}

export async function getConteneursTransiteNonRenseigne() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "TRANSITE_NON_RENSEIGNE",
      },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Subcase: {
          include: {
            SparePart: true,
          },
        },
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & { Commande?: unknown[]; Subcase?: unknown[]; VerificationConteneur?: unknown[]; Voiture?: unknown[] };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & { VoitureModel?: unknown; Client?: unknown; Client_entreprise?: unknown };
          let prixUnitaireFinal: number | null = null;
          const prixRaw = cmd.prix_unitaire;

          if (prixRaw === null || prixRaw === undefined) {
            prixUnitaireFinal = null;
          } else {
            try {
              if (typeof prixRaw === "number") {
                prixUnitaireFinal = prixRaw;
              } else if (typeof prixRaw === "string") {
                prixUnitaireFinal = parseFloat(prixRaw);
              } else if (prixRaw && typeof prixRaw === "object") {
                if (
                  "constructor" in prixRaw &&
                  prixRaw.constructor &&
                  typeof prixRaw.constructor === "function" &&
                  prixRaw.constructor.name === "Decimal"
                ) {
                  try {
                    const str = String(prixRaw);
                    prixUnitaireFinal = parseFloat(str);
                  } catch {
                    prixUnitaireFinal = null;
                  }
                } else if (
                  "toNumber" in (prixRaw as { toNumber?: () => number }) &&
                  typeof (prixRaw as { toNumber: () => number }).toNumber === "function"
                ) {
                  prixUnitaireFinal = (prixRaw as { toNumber: () => number }).toNumber();
                } else if (
                  "toString" in (prixRaw as { toString?: () => string }) &&
                  typeof (prixRaw as { toString: () => string }).toString === "function"
                ) {
                  const str = (prixRaw as { toString: () => string }).toString();
                  prixUnitaireFinal = parseFloat(str);
                }
              }
            } catch {
              prixUnitaireFinal = null;
            }
          }

          return {
            ...cmd,
            prix_unitaire: prixUnitaireFinal,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            voitureModel: cmd.VoitureModel
              ? {
                  ...(cmd.VoitureModel as Record<string, unknown>),
                  createdAt:
                    (cmd.VoitureModel as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.VoitureModel as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.VoitureModel as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.VoitureModel as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.VoitureModel as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.VoitureModel as { updatedAt: string }).updatedAt),
                }
              : null,
            client: cmd.Client
              ? {
                  ...(cmd.Client as Record<string, unknown>),
                  createdAt:
                    (cmd.Client as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client as { updatedAt: string }).updatedAt),
                }
              : null,
            clientEntreprise: cmd.Client_entreprise
              ? {
                  ...(cmd.Client_entreprise as Record<string, unknown>),
                  createdAt:
                    (cmd.Client_entreprise as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client_entreprise as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client_entreprise as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client_entreprise as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client_entreprise as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client_entreprise as { updatedAt: string }).updatedAt),
                }
              : null,
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown> & { SparePart?: unknown[] };
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
            spareParts: (sc.SparePart || []).map((sparePart: unknown) => {
              const sp = sparePart as Record<string, unknown>;
              return {
                ...sp,
                createdAt: (sp.createdAt as Date).toISOString(),
                updatedAt: (sp.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
        verifications: (c.VerificationConteneur || []).map(
          (verification: unknown) => {
            const v = verification as Record<string, unknown>;
            return {
              ...v,
              createdAt: (v.createdAt as Date).toISOString(),
              updatedAt: (v.updatedAt as Date).toISOString(),
            };
          }
        ),
        voitures: (c.Voiture || []).map((voiture: unknown) => {
          const v = voiture as Record<string, unknown>;
          return {
            ...v,
            createdAt: (v.createdAt as Date).toISOString(),
            updatedAt: (v.updatedAt as Date).toISOString(),
          };
        }),
      };
    });

    const finalSerialized = deepConvertDecimals(serializedConteneurs);

    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching conteneurs TRANSITE_NON_RENSEIGNE:", error);
    return {
      success: false,
      error: "Failed to fetch conteneurs TRANSITE_NON_RENSEIGNE",
    };
  }
}

export async function getConteneursTransiteDejaRenseigne() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "TRANSITE_DEJA_RENSEIGNE",
      },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Subcase: {
          include: {
            SparePart: true,
            Tool: true,
          },
        },
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & { Commande?: unknown[]; Subcase?: unknown[]; VerificationConteneur?: unknown[]; Voiture?: unknown[] };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & { VoitureModel?: unknown; Client?: unknown; Client_entreprise?: unknown };
          let prixUnitaireFinal: number | null = null;
          const prixRaw = cmd.prix_unitaire;

          if (prixRaw === null || prixRaw === undefined) {
            prixUnitaireFinal = null;
          } else {
            try {
              if (typeof prixRaw === "number") {
                prixUnitaireFinal = prixRaw;
              } else if (typeof prixRaw === "string") {
                prixUnitaireFinal = parseFloat(prixRaw);
              } else if (prixRaw && typeof prixRaw === "object") {
                if (
                  "constructor" in prixRaw &&
                  prixRaw.constructor &&
                  typeof prixRaw.constructor === "function" &&
                  prixRaw.constructor.name === "Decimal"
                ) {
                  try {
                    const str = String(prixRaw);
                    prixUnitaireFinal = parseFloat(str);
                  } catch {
                    prixUnitaireFinal = null;
                  }
                } else if (
                  "toNumber" in (prixRaw as { toNumber?: () => number }) &&
                  typeof (prixRaw as { toNumber: () => number }).toNumber === "function"
                ) {
                  prixUnitaireFinal = (prixRaw as { toNumber: () => number }).toNumber();
                } else if (
                  "toString" in (prixRaw as { toString?: () => string }) &&
                  typeof (prixRaw as { toString: () => string }).toString === "function"
                ) {
                  const str = (prixRaw as { toString: () => string }).toString();
                  prixUnitaireFinal = parseFloat(str);
                }
              }
            } catch {
              prixUnitaireFinal = null;
            }
          }

          return {
            ...cmd,
            prix_unitaire: prixUnitaireFinal,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            voitureModel: cmd.VoitureModel
              ? {
                  ...(cmd.VoitureModel as Record<string, unknown>),
                  createdAt:
                    (cmd.VoitureModel as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.VoitureModel as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.VoitureModel as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.VoitureModel as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.VoitureModel as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.VoitureModel as { updatedAt: string }).updatedAt),
                }
              : null,
            client: cmd.Client
              ? {
                  ...(cmd.Client as Record<string, unknown>),
                  createdAt:
                    (cmd.Client as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client as { updatedAt: string }).updatedAt),
                }
              : null,
            clientEntreprise: cmd.Client_entreprise
              ? {
                  ...(cmd.Client_entreprise as Record<string, unknown>),
                  createdAt:
                    (cmd.Client_entreprise as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client_entreprise as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client_entreprise as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client_entreprise as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client_entreprise as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client_entreprise as { updatedAt: string }).updatedAt),
                }
              : null,
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown> & { SparePart?: unknown[]; Tool?: unknown[] };
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
            spareParts: (sc.SparePart || []).map((sparePart: unknown) => {
              const sp = sparePart as Record<string, unknown>;
              return {
                ...sp,
                createdAt: (sp.createdAt as Date).toISOString(),
                updatedAt: (sp.updatedAt as Date).toISOString(),
              };
            }),
            tools: (sc.Tool || []).map((tool: unknown) => {
              const t = tool as Record<string, unknown>;
              return {
                ...t,
                createdAt: (t.createdAt as Date).toISOString(),
                updatedAt: (t.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
        verifications: (c.VerificationConteneur || []).map(
          (verification: unknown) => {
            const v = verification as Record<string, unknown>;
            return {
              ...v,
              createdAt: (v.createdAt as Date).toISOString(),
              updatedAt: (v.updatedAt as Date).toISOString(),
            };
          }
        ),
        voitures: (c.Voiture || []).map((voiture: unknown) => {
          const v = voiture as Record<string, unknown>;
          return {
            ...v,
            createdAt: (v.createdAt as Date).toISOString(),
            updatedAt: (v.updatedAt as Date).toISOString(),
          };
        }),
      };
    });

    const finalSerialized = deepConvertDecimals(serializedConteneurs);

    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching conteneurs TRANSITE_DEJA_RENSEIGNE:", error);
    return {
      success: false,
      error: "Failed to fetch conteneurs TRANSITE_DEJA_RENSEIGNE",
    };
  }
}

export async function getAllConteneursCharge() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "CHARGE",
      },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values and Date objects
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & { Commande?: unknown[]; Subcase?: unknown[]; VerificationConteneur?: unknown[]; Voiture?: unknown[] };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & { VoitureModel?: unknown; Client?: unknown; Client_entreprise?: unknown };
          let prixUnitaireFinal: number | null = null;
          const prixRaw = cmd.prix_unitaire;

          if (prixRaw === null || prixRaw === undefined) {
            prixUnitaireFinal = null;
          } else {
            try {
              if (typeof prixRaw === "number") {
                prixUnitaireFinal = prixRaw;
              } else if (typeof prixRaw === "string") {
                prixUnitaireFinal = parseFloat(prixRaw);
              } else if (prixRaw && typeof prixRaw === "object") {
                if (
                  "constructor" in prixRaw &&
                  prixRaw.constructor &&
                  typeof prixRaw.constructor === "function" &&
                  prixRaw.constructor.name === "Decimal"
                ) {
                  try {
                    const str = String(prixRaw);
                    prixUnitaireFinal = parseFloat(str);
                  } catch {
                    prixUnitaireFinal = null;
                  }
                } else if (
                  "toNumber" in (prixRaw as { toNumber?: () => number }) &&
                  typeof (prixRaw as { toNumber: () => number }).toNumber === "function"
                ) {
                  prixUnitaireFinal = (prixRaw as { toNumber: () => number }).toNumber();
                } else if (
                  "toString" in (prixRaw as { toString?: () => string }) &&
                  typeof (prixRaw as { toString: () => string }).toString === "function"
                ) {
                  const str = (prixRaw as { toString: () => string }).toString();
                  prixUnitaireFinal = parseFloat(str);
                }
              }
            } catch {
              prixUnitaireFinal = null;
            }
          }

          return {
            ...cmd,
            prix_unitaire: prixUnitaireFinal,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            voitureModel: cmd.VoitureModel
              ? {
                  ...(cmd.VoitureModel as Record<string, unknown>),
                  createdAt:
                    (cmd.VoitureModel as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.VoitureModel as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.VoitureModel as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.VoitureModel as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.VoitureModel as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.VoitureModel as { updatedAt: string }).updatedAt),
                }
              : null,
            client: cmd.Client
              ? {
                  ...(cmd.Client as Record<string, unknown>),
                  createdAt:
                    (cmd.Client as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client as { updatedAt: string }).updatedAt),
                }
              : null,
            clientEntreprise: cmd.Client_entreprise
              ? {
                  ...(cmd.Client_entreprise as Record<string, unknown>),
                  createdAt:
                    (cmd.Client_entreprise as { createdAt: Date | string }).createdAt instanceof Date
                      ? ((cmd.Client_entreprise as { createdAt: Date }).createdAt).toISOString()
                      : ((cmd.Client_entreprise as { createdAt: string }).createdAt),
                  updatedAt:
                    (cmd.Client_entreprise as { updatedAt: Date | string }).updatedAt instanceof Date
                      ? ((cmd.Client_entreprise as { updatedAt: Date }).updatedAt).toISOString()
                      : ((cmd.Client_entreprise as { updatedAt: string }).updatedAt),
                }
              : null,
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown>;
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
          };
        }),
        verifications: (c.VerificationConteneur || []).map(
          (verification: unknown) => {
            const v = verification as Record<string, unknown>;
            return {
              ...v,
              createdAt: (v.createdAt as Date).toISOString(),
              updatedAt: (v.updatedAt as Date).toISOString(),
            };
          }
        ),
        voitures: (c.Voiture || []).map((voiture: unknown) => {
          const v = voiture as Record<string, unknown>;
          return {
            ...v,
            createdAt: (v.createdAt as Date).toISOString(),
            updatedAt: (v.updatedAt as Date).toISOString(),
          };
        }),
      };
    });

    // Use deepConvertDecimals to catch any remaining Decimal objects
    const finalSerialized = deepConvertDecimals(serializedConteneurs);

    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching all conteneurs CHARGE:", error);
    return { success: false, error: "Failed to fetch all conteneurs CHARGE" };
  }
}

export async function updateConteneur(
  id: string,
  data: {
    conteneurNumber?: string;
    sealNumber?: string;
    totalPackages?: string;
    grossWeight?: string;
    netWeight?: string;
    stuffingMap?: string;
    etapeConteneur?: EtapeConteneur;
    dateEmbarquement?: Date;
    dateArriveProbable?: Date;
  },
) {
  try {
    const conteneur = await prisma.conteneur.update({
      where: { id },
      data,
    });

    revalidatePath("/manager/ajouter-conteneur");
    revalidatePath("/manager/liste-conteneurs");
    revalidatePath("/manager/listeConteneurs");
    revalidatePath(`/manager/renseigner-conteneur/${id}`);
    return { success: true, data: conteneur };
  } catch (error) {
    console.error("Error updating conteneur:", error);
    return { success: false, error: "Failed to update conteneur" };
  }
}

export async function deleteConteneur(id: string) {
  try {
    await prisma.conteneur.delete({
      where: { id },
    });

    revalidatePath("/manager/ajouter-conteneur");
    return { success: true };
  } catch (error) {
    console.error("Error deleting conteneur:", error);
    return { success: false, error: "Failed to delete conteneur" };
  }
}

export async function updateConteneurToTransiteNonRenseigne(
  conteneurId: string,
) {
  try {
    // Update conteneur status to TRANSITE_NON_RENSEIGNE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: EtapeConteneur.TRANSITE_NON_RENSEIGNE,
      },
    });

    // Update all commandes in this conteneur to TRANSITE_NON_RENSEIGNE
    await prisma.commande.updateMany({
      where: { conteneurId: conteneurId },
      data: {
        etapeCommande: EtapeCommande.TRANSITE_NON_RENSEIGNE,
      },
    });

    revalidatePath("/manager/listeConteneurs");
    return { success: true };
  } catch (error) {
    console.error("Error updating conteneur to transite_non_renseigne:", error);
    return { success: false, error: "Failed to update conteneur" };
  }
}

export async function updateConteneurToTransiteDejaRenseigne(
  conteneurId: string,
) {
  try {
    // Update conteneur status to TRANSITE_DEJA_RENSEIGNE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: EtapeConteneur.TRANSITE_DEJA_RENSEIGNE,
      },
    });

    // Update all commandes in this conteneur to TRANSITE_DEJA_RENSEIGNE
    await prisma.commande.updateMany({
      where: { conteneurId: conteneurId },
      data: {
        etapeCommande: EtapeCommande.TRANSITE_DEJA_RENSEIGNE,
      },
    });

    revalidatePath("/manager/listeConteneurs");
    revalidatePath("/magasinier/Conteneurs-renseigner");
    return { success: true };
  } catch (error) {
    console.error(
      "Error updating conteneur to transite_deja_renseigne:",
      error,
    );
    return { success: false, error: "Failed to update conteneur" };
  }
}

export async function getConteneursRenseignes() {
  try {
    
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "RENSEIGNE",
      },
      include: {
        Commande: {
          include: {
            Client: true,
            VoitureModel: true,
            CommandeToFournisseur: {
              include: {
                Fournisseur: true,
              },
            },
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values and Date objects in commandes
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & { Commande?: unknown[]; Subcase?: unknown[]; VerificationConteneur?: unknown[]; Voiture?: unknown[] };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & { VoitureModel?: unknown; Client?: unknown; Client_entreprise?: unknown; CommandeToFournisseur?: Array<{ Fournisseur: unknown }> };
          // CRITICAL: Convert prix_unitaire using the most aggressive method possible
          let prixUnitaireFinal: number | null = null;
          const prixRaw = cmd.prix_unitaire;

          if (prixRaw === null || prixRaw === undefined) {
            prixUnitaireFinal = null;
          } else {
            // Try every possible conversion method
            try {
              // Method 1: Direct number
              if (typeof prixRaw === "number") {
                prixUnitaireFinal = prixRaw;
              }
              // Method 2: String to number
              else if (typeof prixRaw === "string") {
                prixUnitaireFinal = parseFloat(prixRaw) || null;
              }
              // Method 3: Decimal object - force conversion
              else if (typeof prixRaw === "object" && prixRaw !== null) {
                // Try toNumber() first
                if (
                  "toNumber" in prixRaw &&
                  typeof (prixRaw as HasToNumber).toNumber === "function"
                ) {
                  try {
                    prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
                  } catch {}
                }
                // Try toString() then parseFloat
                if (
                  prixUnitaireFinal === null &&
                  "toString" in prixRaw &&
                  typeof (prixRaw as HasToString).toString === "function"
                ) {
                  try {
                    const str = (prixRaw as HasToString).toString();
                    prixUnitaireFinal = parseFloat(str) || null;
                  } catch {}
                }
                // Last resort: String coercion
                if (prixUnitaireFinal === null) {
                  try {
                    prixUnitaireFinal = parseFloat(String(prixRaw)) || null;
                  } catch {
                    prixUnitaireFinal = null;
                  }
                }
              }
            } catch {
              prixUnitaireFinal = null;
            }
          }

          // Build the commande object - prix_unitaire MUST be number or null
          const commandeObj = {
            ...cmd,
            id: String(cmd.id),
            etapeCommande: String(cmd.etapeCommande),
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            clientId: cmd.clientId ? String(cmd.clientId) : null,
            conteneurId: cmd.conteneurId
              ? String(cmd.conteneurId)
              : null,
            commandeLocalId: cmd.commandeLocalId
              ? String(cmd.commandeLocalId)
              : null,
            couleur: String(cmd.couleur),
            montageId: cmd.montageId ? String(cmd.montageId) : null,
            motorisation: String(cmd.motorisation),
            nbr_portes: String(cmd.nbr_portes),
            transmission: String(cmd.transmission),
            voitureModelId: cmd.voitureModelId
              ? String(cmd.voitureModelId)
              : null,
            clientEntrepriseId: cmd.clientEntrepriseId
              ? String(cmd.clientEntrepriseId)
              : null,
            factureId: cmd.factureId ? String(cmd.factureId) : null,
            prix_unitaire:
              typeof prixUnitaireFinal === "number" ? prixUnitaireFinal : null,
            commandeFlag: String(cmd.commandeFlag),
            commandeGroupeeId: cmd.commandeGroupeeId
              ? String(cmd.commandeGroupeeId)
              : null,
            client: cmd.Client,
            voitureModel: cmd.VoitureModel,
            fournisseurs: (cmd.CommandeToFournisseur || []).map((ctf) => ctf.Fournisseur),
          };

          return commandeObj;
        }),
        subcases: c.Subcase,
        verifications: c.VerificationConteneur,
        voitures: c.Voiture,
      };
    });

    // Final pass: Deeply convert all Decimal objects recursively
    let finalSerialized = deepConvertDecimals(serializedConteneurs);

    // Type guard: ensure finalSerialized is an array
    if (!Array.isArray(finalSerialized)) {
      return { success: false, error: "Serialization failed" };
    }

    // CRITICAL: One more explicit pass to ensure prix_unitaire is NEVER a Decimal
    const processedSerialized = finalSerialized.map(
      (conteneur: Record<string, unknown>) => {
        const conteneurObj = conteneur as Record<string, unknown>;
        const commandes = Array.isArray(conteneurObj.commandes)
          ? conteneurObj.commandes
          : [];

        return {
          ...conteneurObj,
          commandes: commandes.map((commande: unknown) => {
            const commandeObj = commande as Record<string, unknown>;
            // Force prix_unitaire to be number or null - NO EXCEPTIONS
            let prixFinal: number | null = null;
            const prixUnitaire = commandeObj.prix_unitaire;

            if (prixUnitaire !== null && prixUnitaire !== undefined) {
              if (typeof prixUnitaire === "number") {
                prixFinal = prixUnitaire;
              } else if (typeof prixUnitaire === "string") {
                prixFinal = parseFloat(prixUnitaire) || null;
              } else if (
                typeof prixUnitaire === "object" &&
                prixUnitaire !== null
              ) {
                // It's still an object - force convert it
                try {
                  if (
                    "toNumber" in prixUnitaire &&
                    typeof (prixUnitaire as HasToNumber).toNumber === "function"
                  ) {
                    prixFinal = (prixUnitaire as HasToNumber).toNumber();
                  } else {
                    prixFinal = parseFloat(String(prixUnitaire)) || null;
                  }
                } catch {
                  prixFinal = null;
                }
              }
            }

            return {
              ...commandeObj,
              prix_unitaire: prixFinal,
            };
          }),
        };
      },
    );

    let finalProcessed = processedSerialized;

    // Ultimate safety: Use JSON.stringify with custom replacer to catch ANY Decimal objects
    try {
      const jsonStringified = JSON.stringify(finalProcessed, (key, value) => {
        // Catch Decimal objects that might have slipped through
        if (value && typeof value === "object") {
          // Check if it's a Decimal by trying to convert it
          if (isDecimal(value)) {
            const converted = decimalToNumber(value);
            return converted !== null ? converted : null;
          }
          // Check constructor name
          if (
            "constructor" in value &&
            value.constructor &&
            typeof value.constructor === "function" &&
            value.constructor.name === "Decimal"
          ) {
            const converted = decimalToNumber(value);
            return converted !== null ? converted : null;
          }
        }
        return value;
      });
      finalProcessed = JSON.parse(
        jsonStringified,
      ) as typeof processedSerialized;
    } catch (jsonError) {
      // If JSON serialization fails, it means there are non-serializable objects
      console.error("JSON serialization failed:", jsonError);
      // Return null for prix_unitaire if we can't serialize
      if (Array.isArray(finalProcessed)) {
        finalProcessed = finalProcessed.map(
          (conteneur: Record<string, unknown>) => {
            const conteneurObj = conteneur as Record<string, unknown>;
            const commandes = Array.isArray(conteneurObj.commandes)
              ? conteneurObj.commandes
              : [];
            return {
              ...conteneurObj,
              commandes: commandes.map((commande: unknown) => {
                const commandeObj = commande as Record<string, unknown>;
                return {
                  ...commandeObj,
                  prix_unitaire:
                    typeof commandeObj.prix_unitaire === "number"
                      ? commandeObj.prix_unitaire
                      : null,
                };
              }),
            };
          },
        );
      }
    }

    finalSerialized = finalProcessed;

    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching conteneurs renseignes:", error);
    return { success: false, error: "Failed to fetch conteneurs renseignes" };
  }
}

export async function markConteneurAsArrive(conteneurId: string) {
  try {
    // Update all spare parts in subcases of this conteneur
    await prisma.sparePart.updateMany({
      where: {
        Subcase: {
          conteneurId: conteneurId,
        },
      },
      data: {
        etapeSparePart: "ARRIVE",
      },
    });

    // Update conteneur status to ARRIVE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: "ARRIVE",
      },
    });

    // Update all commandes in this conteneur to ARRIVE
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId,
      },
      data: {
        etapeCommande: "ARRIVE",
      },
    });

    revalidatePath("/manager/commandes-transites-renseignees");
    revalidatePath("/manager/conteneur-transit");
    return { success: true };
  } catch (error) {
    console.error("Error marking conteneur as arrive:", error);
    return { success: false, error: "Failed to mark conteneur as arrive" };
  }
}

export async function getConteneursArrives() {
  try {
   
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "ARRIVE",
      },
      include: {
        Commande: {
          include: {
            Client: true,
            VoitureModel: true,
            CommandeToFournisseur: {
              include: {
                Fournisseur: true,
              },
            },
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        Commande?: unknown[];
        Subcase?: unknown[];
        VerificationConteneur?: unknown[];
        Voiture?: unknown[];
      };
      return {
        ...c,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            prix_unitaire?: unknown;
            date_livraison?: unknown;
            createdAt: Date;
            updatedAt: Date;
            Client?: unknown;
            VoitureModel?: unknown;
            CommandeToFournisseur?: Array<{ Fournisseur: unknown }>;
          };
          return {
            ...cmd,
            prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
            date_livraison: cmd.date_livraison ? (cmd.date_livraison as Date).toISOString() : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            client: cmd.Client,
            voitureModel: cmd.VoitureModel,
            fournisseurs: (cmd.CommandeToFournisseur || []).map((ctf) => ctf.Fournisseur),
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const s = subcase as Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
          };
          return {
            ...s,
            createdAt: (s.createdAt as Date).toISOString(),
            updatedAt: (s.updatedAt as Date).toISOString(),
          };
        }),
        verifications: c.VerificationConteneur,
        voitures: (c.Voiture || []).map((v: unknown) => {
          const voiture = v as Record<string, unknown> & {
            VoitureModel?: unknown;
          };
          return {
            ...voiture,
            voitureModel: voiture.VoitureModel,
          };
        }),
      };
    });

    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs arrives:", error);
    return { success: false, error: "Failed to fetch conteneurs arrives" };
  }
}

export async function getConteneursArrivesWithAllArriveStatuses() {
  try {
    
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "ARRIVE",
        Commande: {
          some: {
            etapeCommande: "ARRIVE",
          },
        },
      },
      include: {
        Commande: {
          where: {
            etapeCommande: "ARRIVE",
          },
          include: {
            Client: true,
            VoitureModel: true,
            Client_entreprise: true,
            CommandeToFournisseur: {
              include: {
                Fournisseur: true,
              },
            },
            SparePart: {
              where: {
                etapeSparePart: "ARRIVE",
              },
            },
          },
        },
        Subcase: {
          include: {
            SparePart: {
              where: {
                etapeSparePart: "ARRIVE",
              },
            },
            Tool: true,
          },
        },
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter to only include conteneurs that have at least one commande with ARRIVE status
    // and filter commandes to only show those with ARRIVE status
    // Also filter spareParts to only show those with ARRIVE status
    const filteredConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        Commande?: unknown[];
        Subcase?: unknown[];
        VerificationConteneur?: unknown[];
        Voiture?: unknown[];
      };
      return {
        ...c,
        commandes: (c.Commande || [])
          .filter(
            (commande: unknown) =>
              (commande as { etapeCommande?: string }).etapeCommande ===
              "ARRIVE",
          )
          .map((commande: unknown) => {
            const cmd = commande as Record<string, unknown> & {
              prix_unitaire?: unknown;
              SparePart?: unknown[];
              Client?: unknown;
              Client_entreprise?: unknown;
              VoitureModel?: unknown;
              CommandeToFournisseur?: Array<{ Fournisseur: unknown }>;
            };
            return {
              ...cmd,
              prix_unitaire: cmd.prix_unitaire
                ? decimalToNumber(cmd.prix_unitaire)
                : null,
              spareParts: (cmd.SparePart || []).filter(
                (sp: unknown) =>
                  (sp as { etapeSparePart?: string }).etapeSparePart ===
                  "ARRIVE",
              ),
              client: cmd.Client,
              clientEntreprise: cmd.Client_entreprise,
              voitureModel: cmd.VoitureModel,
              fournisseurs: (cmd.CommandeToFournisseur || []).map(
                (ctf: unknown) => (ctf as { Fournisseur: unknown }).Fournisseur,
              ),
            };
          }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown> & {
            SparePart?: unknown[];
            Tool?: unknown[];
          };
          return {
            ...sc,
            spareParts: (sc.SparePart || []).filter(
              (sp: unknown) =>
                (sp as { etapeSparePart?: string }).etapeSparePart === "ARRIVE",
            ),
            tools: sc.Tool,
          };
        }),
        verifications: c.VerificationConteneur,
        voitures: (c.Voiture || []).map((v: unknown) => {
          const voiture = v as Record<string, unknown> & {
            VoitureModel?: unknown;
          };
          return {
            ...voiture,
            voitureModel: voiture.VoitureModel,
          };
        }),
      };
    })
    .filter((conteneur: unknown) => (conteneur as { commandes: unknown[] }).commandes.length > 0);

    // Serialize Date objects
    const serializedConteneurs = (filteredConteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
        dateEmbarquement: Date | null;
        dateArriveProbable: Date | null;
        commandes: unknown[];
        subcases: unknown[];
      };
      return {
        ...c,
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.commandes || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            date_livraison: Date | null;
            createdAt: Date;
            updatedAt: Date;
            spareParts: unknown[];
          };
          return {
            ...cmd,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            spareParts: (cmd.spareParts || []).map((sp: unknown) => {
              const s = sp as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...s,
                createdAt: (s.createdAt as Date).toISOString(),
                updatedAt: (s.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
        subcases: (c.subcases || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
            spareParts: unknown[];
            tools: unknown[];
          };
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
            spareParts: (sc.spareParts || []).map((sp: unknown) => {
              const s = sp as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...s,
                createdAt: (s.createdAt as Date).toISOString(),
                updatedAt: (s.updatedAt as Date).toISOString(),
              };
            }),
            tools: (sc.tools || []).map((tool: unknown) => {
              const t = tool as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...t,
                createdAt: (t.createdAt as Date).toISOString(),
                updatedAt: (t.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
      };
    });

    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error(
      "Error fetching conteneurs arrives with all ARRIVE statuses:",
      error,
    );
    return {
      success: false,
      error: "Failed to fetch conteneurs arrives with all ARRIVE statuses",
    };
  }
}

export async function orderDepotageForConteneur(conteneurId: string) {
  try {
    // Update all spare parts in subcases of this conteneur from ARRIVE to DEPOTAGE_EN_COURS
    await prisma.sparePart.updateMany({
      where: {
        Subcase: {
          conteneurId: conteneurId,
        },
        etapeSparePart: "ARRIVE",
      },
      data: {
        etapeSparePart: "DEPOTAGE_EN_COURS",
      },
    });

    // Update all spare parts in commandes of this conteneur from ARRIVE to DEPOTAGE_EN_COURS
    await prisma.sparePart.updateMany({
      where: {
        Commande: {
          conteneurId: conteneurId,
          etapeCommande: "ARRIVE",
        },
        etapeSparePart: "ARRIVE",
      },
      data: {
        etapeSparePart: "DEPOTAGE_EN_COURS",
      },
    });

    // Update conteneur from ARRIVE to DEPOTAGE_EN_COURS
    const conteneurUpdateResult = await prisma.conteneur.updateMany({
      where: {
        id: conteneurId,
        etapeConteneur: "ARRIVE",
      },
      data: {
        etapeConteneur: "DEPOTAGE_EN_COURS",
      },
    });

    // Check if conteneur was updated (if not, it might not be in ARRIVE status)
    if (conteneurUpdateResult.count === 0) {
      // Verify conteneur exists
      const conteneur = await prisma.conteneur.findUnique({
        where: { id: conteneurId },
        select: { id: true, etapeConteneur: true },
      });

      if (!conteneur) {
        return { success: false, error: "Conteneur introuvable" };
      }

      if (conteneur.etapeConteneur !== "ARRIVE") {
        return {
          success: false,
          error: `Le conteneur n'est pas en statut ARRIVE (statut actuel: ${conteneur.etapeConteneur})`,
        };
      }
    }

    // Update all commandes with ARRIVE status to DEPOTAGE_EN_COURS
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId,
        etapeCommande: "ARRIVE",
      },
      data: {
        etapeCommande: "DEPOTAGE_EN_COURS",
      },
    });

    revalidatePath("/manager/conteneur-arrives");
    return { success: true, message: "Dépotage ordonné avec succès" };
  } catch (error) {
    console.error("Error ordering depotage for conteneur:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      error: `Échec de l'ordonnancement du dépotage: ${errorMessage}`,
    };
  }
}

export async function getConteneursDepotageEnCours() {
  try {
    // Add timeout wrapper for the query
    const queryPromise = prisma.conteneur.findMany({
      where: {
        etapeConteneur: "DEPOTAGE_EN_COURS",
        Commande: {
          some: {
            etapeCommande: "DEPOTAGE_EN_COURS",
          },
        },
      },
      include: {
        Commande: {
          where: {
            etapeCommande: "DEPOTAGE_EN_COURS",
          },
          include: {
            Client: {
              select: {
                id: true,
                nom: true,
                email: true,
                telephone: true,
              },
            },
            VoitureModel: {
              select: {
                id: true,
                model: true,
              },
            },
            Client_entreprise: {
              select: {
                id: true,
                nom_entreprise: true,
                email: true,
                telephone: true,
              },
            },
            CommandeToFournisseur: {
              select: {
                Fournisseur: {
                  select: {
                    id: true,
                    nom: true,
                    email: true,
                  },
                },
              },
            },
            SparePart: {
              where: {
                etapeSparePart: "DEPOTAGE_EN_COURS",
              },
              select: {
                id: true,
                partCode: true,
                partName: true,
                partNameFrench: true,
                verificationName: true,
                quantity: true,
                etapeSparePart: true,
                statusVerification: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        Subcase: {
          include: {
            SparePart: {
              where: {
                etapeSparePart: "DEPOTAGE_EN_COURS",
              },
              select: {
                id: true,
                partCode: true,
                partName: true,
                partNameFrench: true,
                verificationName: true,
                quantity: true,
                etapeSparePart: true,
                statusVerification: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            Tool: {
              select: {
                id: true,
                toolCode: true,
                toolName: true,
                quantity: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        VerificationConteneur: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Voiture: {
          select: {
            id: true,
            nbr_portes: true,
            transmission: true,
            motorisation: true,
            couleur: true,
            createdAt: true,
            updatedAt: true,
            VoitureModel: {
              select: {
                id: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit results to prevent timeout
    });

    // Add timeout (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              "Query timeout: getConteneursDepotageEnCours took longer than 30 seconds",
            ),
          ),
        30000,
      );
    });

    const conteneurs = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as Awaited<typeof queryPromise>;

    // Filter to only include conteneurs that have at least one commande with DEPOTAGE_EN_COURS status
    // and filter commandes to only show those with DEPOTAGE_EN_COURS status
    // Also filter spareParts to only show those with DEPOTAGE_EN_COURS status
    const filteredConteneurs = (conteneurs as unknown[])
      .map((conteneur: unknown) => {
        const c = conteneur as Record<string, unknown> & { Commande?: unknown[]; Subcase?: unknown[]; VerificationConteneur?: unknown[]; Voiture?: unknown[] };
        return {
          ...c,
          commandes: (c.Commande || [])
            .filter(
              (commande: unknown) =>
                (commande as { etapeCommande?: string }).etapeCommande ===
                "DEPOTAGE_EN_COURS",
            )
            .map((commande: unknown) => {
              const cmd = commande as Record<string, unknown> & { Client?: unknown; Client_entreprise?: unknown; VoitureModel?: unknown; SparePart?: unknown[]; CommandeToFournisseur?: Array<{ Fournisseur: unknown }> };
              return {
                ...cmd,
                prix_unitaire: cmd.prix_unitaire
                  ? decimalToNumber(cmd.prix_unitaire)
                  : null,
                spareParts: (cmd.SparePart || []).filter(
                  (sp: unknown) =>
                    (sp as { etapeSparePart?: string }).etapeSparePart ===
                    "DEPOTAGE_EN_COURS",
                ),
                client: cmd.Client,
                clientEntreprise: cmd.Client_entreprise,
                voitureModel: cmd.VoitureModel,
                fournisseurs: (cmd.CommandeToFournisseur || []).map(
                  (ctf: unknown) => (ctf as { Fournisseur: unknown }).Fournisseur,
                ),
              };
            }),
          subcases: (c.Subcase || []).map((subcase: unknown) => {
            const sc = subcase as Record<string, unknown> & { SparePart?: unknown[]; Tool?: unknown[] };
            return {
              ...sc,
              spareParts: (sc.SparePart || []).filter(
                (sp: unknown) =>
                  (sp as { etapeSparePart?: string }).etapeSparePart ===
                  "DEPOTAGE_EN_COURS",
              ),
              tools: sc.Tool,
            };
          }),
          verifications: c.VerificationConteneur,
          voitures: (c.Voiture || []).map((v: unknown) => {
            const voiture = v as Record<string, unknown> & { VoitureModel?: unknown };
            return {
              ...voiture,
              voitureModel: voiture.VoitureModel,
            };
          }),
        };
      })
      .filter((conteneur: unknown) => (conteneur as { commandes: unknown[] }).commandes.length > 0);

    // Serialize Date objects
    const serializedConteneurs = (filteredConteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
        dateEmbarquement: Date | null;
        dateArriveProbable: Date | null;
        commandes: unknown[];
        subcases: unknown[];
      };
      return {
        ...c,
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.commandes || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            date_livraison: Date | null;
            createdAt: Date;
            updatedAt: Date;
            spareParts: unknown[];
          };
          return {
            ...cmd,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            spareParts: (cmd.spareParts || []).map((sp: unknown) => {
              const s = sp as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...s,
                createdAt: (s.createdAt as Date).toISOString(),
                updatedAt: (s.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
        subcases: (c.subcases || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
            spareParts: unknown[];
            tools: unknown[];
          };
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
            spareParts: (sc.spareParts || []).map((sp: unknown) => {
              const s = sp as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...s,
                createdAt: (s.createdAt as Date).toISOString(),
                updatedAt: (s.updatedAt as Date).toISOString(),
              };
            }),
            tools: (sc.tools || []).map((tool: unknown) => {
              const t = tool as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...t,
                createdAt: (t.createdAt as Date).toISOString(),
                updatedAt: (t.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
      };
    });

    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs depotage en cours:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    // Check if it's a timeout error
    const isTimeoutError =
      errorMessage.includes("timeout") || errorMessage.includes("Timeout");

    console.error("Error details:", {
      message: errorMessage,
      errorType: error?.constructor?.name,
      isTimeout: isTimeoutError,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: isTimeoutError
        ? "La requête a pris trop de temps. Veuillez réessayer ou contacter l'administrateur."
        : `Failed to fetch conteneurs depotage en cours: ${errorMessage}`,
    };
  }
}

export async function markConteneurAsDecharge(conteneurId: string) {
  try {
    await prisma.sparePart.updateMany({
      where: { Subcase: { conteneurId } },
      data: { etapeSparePart: "DECHARGE" },
    });

    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: { etapeConteneur: EtapeConteneur.DEPOTAGE_EN_COURS },
    });

    await prisma.commande.updateMany({
      where: { conteneurId },
      data: { etapeCommande: "DECHARGE" },
    });

    revalidatePath("/manager/commandes-arrivees");
    return { success: true };
  } catch (error) {
    console.error("Error marking conteneur as decharge:", error);
    return { success: false, error: "Failed to mark conteneur as decharge" };
  }
}

export async function getConteneursDecharge() {
  try {
    
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: EtapeConteneur.DEPOTAGE_EN_COURS,
      },
      include: {
        Commande: {
          include: {
            Client: true,
            VoitureModel: true,
            CommandeToFournisseur: {
              include: {
                Fournisseur: true,
              },
            },
          },
        },
        Subcase: {
          include: {
            SparePart: true,
            Tool: true,
          },
        },
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        Commande?: unknown[];
        Subcase?: unknown[];
        VerificationConteneur?: unknown[];
        Voiture?: unknown[];
      };
      return {
        ...c,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            prix_unitaire?: unknown;
            date_livraison?: Date;
            createdAt: Date;
            updatedAt: Date;
            Client?: unknown;
            VoitureModel?: unknown;
            CommandeToFournisseur?: Array<{ Fournisseur: unknown }>;
          };
          return {
            ...cmd,
            prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            client: cmd.Client,
            voitureModel: cmd.VoitureModel,
            fournisseurs: (cmd.CommandeToFournisseur || []).map(
              (ctf: unknown) => (ctf as { Fournisseur: unknown }).Fournisseur,
            ),
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const sc = subcase as Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
            SparePart?: unknown[];
            Tool?: unknown[];
          };
          return {
            ...sc,
            createdAt: (sc.createdAt as Date).toISOString(),
            updatedAt: (sc.updatedAt as Date).toISOString(),
            spareParts: (sc.SparePart || []).map((sp: unknown) => {
              const s = sp as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...s,
                createdAt: (s.createdAt as Date).toISOString(),
                updatedAt: (s.updatedAt as Date).toISOString(),
              };
            }),
            tools: (sc.Tool || []).map((t: unknown) => {
              const tool = t as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...tool,
                createdAt: (tool.createdAt as Date).toISOString(),
                updatedAt: (tool.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
        verifications: c.VerificationConteneur,
        voitures: (c.Voiture || []).map((v: unknown) => {
          const voiture = v as Record<string, unknown> & {
            VoitureModel?: unknown;
          };
          return {
            ...voiture,
            voitureModel: voiture.VoitureModel,
          };
        }),
      };
    });

    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs decharge:", error);
    return { success: false, error: "Failed to fetch conteneurs decharge" };
  }
}

export async function markConteneurAsVerifie(conteneurId: string) {
  try {
    // Create VerificationConteneur first
    
    const verificationConteneur = await prisma.verificationConteneur.create({
      data: {
        id: crypto.randomUUID(),
        conteneurId: conteneurId,
        updatedAt: new Date(),
      },
    });

    // Create RapportVerification linked to VerificationConteneur
    
    await prisma.rapportVerification.create({
      data: {
        id: crypto.randomUUID(),
        verificationConteneurId: verificationConteneur.id,
        updatedAt: new Date(),
      },
    });

    // Update all spare parts from subcases
    await prisma.sparePart.updateMany({
      where: { Subcase: { conteneurId } },
      data: {
        etapeSparePart: "VERIFIER",
        verificationConteneurId: verificationConteneur.id,
      },
    });

    // Update all spare parts from commandes
    await prisma.sparePart.updateMany({
      where: { Commande: { conteneurId } },
      data: {
        etapeSparePart: "VERIFIER",
        verificationConteneurId: verificationConteneur.id,
      },
    });

    // Update conteneur
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: "VERIFIER",
        isVerified: true,
      },
    });

    // Update all commandes in the conteneur
    await prisma.commande.updateMany({
      where: { conteneurId },
      data: { etapeCommande: "VERIFIER" },
    });

    revalidatePath("/magasinier/verification");
    return { success: true };
  } catch (error) {
    console.error("Error marking conteneur as verifie:", error);
    return { success: false, error: "Failed to mark conteneur as verifie" };
  }
}

export async function getRapportVerifications() {
  try {
    const rapports = await prisma.rapportVerification.findMany({
      include: {
        VerificationConteneur: {
          include: {
            Conteneur: true,
            _count: {
              select: {
                PieceComplement: true,
                SparePart: true,
                Tool: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedRapports = (rapports as unknown[]).map((rapport: unknown) => {
      const r = rapport as Record<string, unknown> & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        VerificationConteneur?: Record<string, unknown> & {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          Conteneur?: Record<string, unknown> & {
            id: string;
            conteneurNumber: string;
            sealNumber: string | null;
            totalPackages: string | null;
            grossWeight: string | null;
            netWeight: string | null;
            stuffingMap: string | null;
            isVerified: boolean;
            etapeConteneur: string;
            createdAt: Date;
            updatedAt: Date;
            dateEmbarquement: Date | null;
            dateArriveProbable: Date | null;
          };
          _count?: {
            PieceComplement: number;
            SparePart: number;
            Tool: number;
          };
        };
      };
      return {
        id: r.id,
        createdAt: (r.createdAt as Date).toISOString(),
        updatedAt: (r.updatedAt as Date).toISOString(),
        verificationConteneur: r.VerificationConteneur ? {
          id: r.VerificationConteneur.id,
          createdAt: (r.VerificationConteneur.createdAt as Date).toISOString(),
          updatedAt: (r.VerificationConteneur.updatedAt as Date).toISOString(),
          conteneur: r.VerificationConteneur.Conteneur ? {
            id: r.VerificationConteneur.Conteneur.id,
            conteneurNumber:
              r.VerificationConteneur.Conteneur.conteneurNumber,
            sealNumber: r.VerificationConteneur.Conteneur.sealNumber,
            totalPackages: r.VerificationConteneur.Conteneur.totalPackages,
            grossWeight: r.VerificationConteneur.Conteneur.grossWeight,
            netWeight: r.VerificationConteneur.Conteneur.netWeight,
            stuffingMap: r.VerificationConteneur.Conteneur.stuffingMap,
            isVerified: r.VerificationConteneur.Conteneur.isVerified,
            etapeConteneur:
              r.VerificationConteneur.Conteneur.etapeConteneur,
            createdAt:
              (r.VerificationConteneur.Conteneur.createdAt as Date).toISOString(),
            updatedAt:
              (r.VerificationConteneur.Conteneur.updatedAt as Date).toISOString(),
            dateEmbarquement:
              (r.VerificationConteneur.Conteneur.dateEmbarquement as Date | null)?.toISOString() ||
              null,
            dateArriveProbable:
              (r.VerificationConteneur.Conteneur.dateArriveProbable as Date | null)?.toISOString() ||
              null,
          } : null,
          counts: {
            pieceComplements:
              r.VerificationConteneur._count?.PieceComplement || 0,
            spares: r.VerificationConteneur._count?.SparePart || 0,
            tools: r.VerificationConteneur._count?.Tool || 0,
          },
        } : null,
      };
    });

    return { success: true, data: serializedRapports };
  } catch (error) {
    console.error("Error fetching rapport verifications:", error);
    return { success: false, error: "Failed to fetch rapport verifications" };
  }
}

export async function getRapportVerificationDetails(rapportId: string) {
  try {
    
    const rapport = await prisma.rapportVerification.findUnique({
      where: { id: rapportId },
      include: {
        VerificationConteneur: {
          include: {
            Conteneur: true,
            SparePart: {
              include: {
                Commande: true,
                Subcase: true,
              },
              orderBy: { createdAt: "asc" },
            },
            Tool: {
              orderBy: { createdAt: "asc" },
            },
            PieceComplement: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!rapport) {
      return { success: false, error: "Rapport verification not found" };
    }

    const r = rapport as Record<string, unknown> & {
      createdAt: Date;
      updatedAt: Date;
      VerificationConteneur: Record<string, unknown> & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        Conteneur: Record<string, unknown> & {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          dateEmbarquement: Date | null;
          dateArriveProbable: Date | null;
        };
        SparePart: Array<Record<string, unknown> & { createdAt: Date; updatedAt: Date; Subcase?: { subcaseNumber: string } }>;
        Tool: Array<Record<string, unknown> & { createdAt: Date; updatedAt: Date }>;
        PieceComplement: Array<Record<string, unknown> & { createdAt: Date; updatedAt: Date }>;
      };
    };
    const serializedRapport = {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      verificationConteneur: {
        id: r.VerificationConteneur.id,
        createdAt: r.VerificationConteneur.createdAt.toISOString(),
        updatedAt: r.VerificationConteneur.updatedAt.toISOString(),
        conteneur: {
          id: r.VerificationConteneur.Conteneur.id,
          conteneurNumber:
            r.VerificationConteneur.Conteneur.conteneurNumber,
          sealNumber: r.VerificationConteneur.Conteneur.sealNumber,
          totalPackages: r.VerificationConteneur.Conteneur.totalPackages,
          grossWeight: r.VerificationConteneur.Conteneur.grossWeight,
          netWeight: r.VerificationConteneur.Conteneur.netWeight,
          stuffingMap: r.VerificationConteneur.Conteneur.stuffingMap,
          isVerified: r.VerificationConteneur.Conteneur.isVerified,
          etapeConteneur:
            r.VerificationConteneur.Conteneur.etapeConteneur,
          createdAt:
            r.VerificationConteneur.Conteneur.createdAt.toISOString(),
          updatedAt:
            r.VerificationConteneur.Conteneur.updatedAt.toISOString(),
          dateEmbarquement:
            r.VerificationConteneur.Conteneur.dateEmbarquement?.toISOString() ||
            null,
          dateArriveProbable:
            r.VerificationConteneur.Conteneur.dateArriveProbable?.toISOString() ||
            null,
        },
        spares: (r.VerificationConteneur.SparePart || []).map((spare) => ({
          ...spare,
          createdAt: spare.createdAt.toISOString(),
          updatedAt: spare.updatedAt.toISOString(),
          subcaseNumber: spare.Subcase?.subcaseNumber || null,
        })),
        tools: (r.VerificationConteneur.Tool || []).map((tool) => ({
          ...tool,
          createdAt: tool.createdAt.toISOString(),
          updatedAt: tool.updatedAt.toISOString(),
        })),
        pieceComplements: (r.VerificationConteneur.PieceComplement || []).map(
          (piece) => ({
            ...piece,
            createdAt: piece.createdAt.toISOString(),
            updatedAt: piece.updatedAt.toISOString(),
          }),
        ),
      },
    };

    return { success: true, data: serializedRapport };
  } catch (error) {
    console.error("Error fetching rapport verification details:", error);
    return {
      success: false,
      error: "Failed to fetch rapport verification details",
    };
  }
}

export async function getVerificationSparesByConteneur() {
  try {
    
    const verificationConteneurs = await prisma.verificationConteneur.findMany({
      include: {
        Conteneur: true,
        SparePart: {
          where: {
            etapeSparePart: "VERIFIER",
          },
          include: {
            Subcase: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = (verificationConteneurs as unknown[]).map((verification: unknown) => {
      const v = verification as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
        Conteneur: Record<string, unknown> & {
          createdAt: Date;
          updatedAt: Date;
          dateEmbarquement: Date | null;
          dateArriveProbable: Date | null;
        };
        SparePart: Array<Record<string, unknown> & { createdAt: Date; updatedAt: Date; Subcase?: { subcaseNumber: string } }>;
      };
      return {
        id: v.id,
        createdAt: (v.createdAt as Date).toISOString(),
        updatedAt: (v.updatedAt as Date).toISOString(),
        conteneur: {
          id: v.Conteneur.id,
          conteneurNumber: v.Conteneur.conteneurNumber,
          sealNumber: v.Conteneur.sealNumber,
          etapeConteneur: v.Conteneur.etapeConteneur,
          isVerified: v.Conteneur.isVerified,
          createdAt: (v.Conteneur.createdAt as Date).toISOString(),
          updatedAt: (v.Conteneur.updatedAt as Date).toISOString(),
          dateEmbarquement:
            (v.Conteneur.dateEmbarquement as Date | null)?.toISOString() || null,
          dateArriveProbable:
            (v.Conteneur.dateArriveProbable as Date | null)?.toISOString() || null,
        },
        spares: (v.SparePart || []).map((spare) => ({
          ...spare,
          createdAt: spare.createdAt.toISOString(),
          updatedAt: spare.updatedAt.toISOString(),
          statusVerification: spare.statusVerification ?? undefined,
          subcaseNumber: spare.Subcase?.subcaseNumber || null,
        })),
      };
    });

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching verification spares by conteneur:", error);
    return {
      success: false,
      error: "Failed to fetch verification spares by conteneur",
    };
  }
}

export async function getConteneursVerifies() {
  try {
    
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: EtapeConteneur.VERIFIER,
      },
      include: {
        Commande: {
          include: {
            Client: true,
            VoitureModel: true,
            CommandeToFournisseur: {
              include: {
                Fournisseur: true,
              },
            },
          },
        },
        Subcase: {
          include: {
            SparePart: true,
            Tool: true,
          },
        },
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        Commande?: unknown[];
        Subcase?: unknown[];
        VerificationConteneur?: unknown[];
        Voiture?: unknown[];
      };
      return {
        ...c,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            prix_unitaire?: unknown;
            date_livraison?: unknown;
            createdAt: Date;
            updatedAt: Date;
            Client?: unknown;
            VoitureModel?: unknown;
            CommandeToFournisseur?: Array<{ Fournisseur: unknown }>;
          };
          return {
            ...cmd,
            prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
            date_livraison: cmd.date_livraison ? (cmd.date_livraison as Date).toISOString() : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            client: cmd.Client,
            voitureModel: cmd.VoitureModel,
            fournisseurs: (cmd.CommandeToFournisseur || []).map((ctf) => ctf.Fournisseur),
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const s = subcase as Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
            SparePart?: unknown[];
            Tool?: unknown[];
          };
          return {
            ...s,
            createdAt: (s.createdAt as Date).toISOString(),
            updatedAt: (s.updatedAt as Date).toISOString(),
            spareParts: (s.SparePart || []).map((sp: unknown) => {
              const spare = sp as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...spare,
                createdAt: (spare.createdAt as Date).toISOString(),
                updatedAt: (spare.updatedAt as Date).toISOString(),
              };
            }),
            tools: (s.Tool || []).map((t: unknown) => {
              const tool = t as Record<string, unknown> & {
                createdAt: Date;
                updatedAt: Date;
              };
              return {
                ...tool,
                createdAt: (tool.createdAt as Date).toISOString(),
                updatedAt: (tool.updatedAt as Date).toISOString(),
              };
            }),
          };
        }),
        verifications: c.VerificationConteneur,
        voitures: (c.Voiture || []).map((v: unknown) => {
          const voiture = v as Record<string, unknown> & {
            VoitureModel?: unknown;
          };
          return {
            ...voiture,
            voitureModel: voiture.VoitureModel,
          };
        }),
      };
    });

    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs verifies:", error);
    return { success: false, error: "Failed to fetch conteneurs verifies" };
  }
}

export async function getConteneursTransite() {
  try {
    
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "TRANSITE",
      },
      include: {
        Commande: {
          include: {
            Client: true,
            Client_entreprise: true,
            VoitureModel: true,
            CommandeToFournisseur: {
              include: {
                Fournisseur: true,
              },
            },
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values and Date objects in commandes
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        Commande?: unknown[];
        Subcase?: unknown[];
        VerificationConteneur?: unknown[];
        Voiture?: unknown[];
      };
      return {
        ...c,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            prix_unitaire?: unknown;
            date_livraison?: unknown;
            createdAt: Date;
            updatedAt: Date;
            Client?: unknown;
            Client_entreprise?: unknown;
            VoitureModel?: unknown;
            CommandeToFournisseur?: Array<{ Fournisseur: unknown }>;
          };
          let prixUnitaireFinal: number | null = null;
          const prixRaw = cmd.prix_unitaire;

          if (prixRaw === null || prixRaw === undefined) {
            prixUnitaireFinal = null;
          } else {
            try {
              if (typeof prixRaw === "number") {
                prixUnitaireFinal = prixRaw;
              } else if (typeof prixRaw === "string") {
                prixUnitaireFinal = parseFloat(prixRaw);
              } else if (prixRaw && typeof prixRaw === "object") {
                if (
                  "constructor" in prixRaw &&
                  prixRaw.constructor &&
                  typeof prixRaw.constructor === "function" &&
                  prixRaw.constructor.name === "Decimal"
                ) {
                  try {
                    const str = String(prixRaw);
                    prixUnitaireFinal = parseFloat(str);
                  } catch {
                    prixUnitaireFinal = null;
                  }
                } else if (
                  "toNumber" in (prixRaw as { toNumber?: () => number }) &&
                  typeof (prixRaw as { toNumber: () => number }).toNumber === "function"
                ) {
                  prixUnitaireFinal = (prixRaw as { toNumber: () => number }).toNumber();
                } else if (
                  "toString" in (prixRaw as { toString?: () => string }) &&
                  typeof (prixRaw as { toString: () => string }).toString === "function"
                ) {
                  const str = (prixRaw as { toString: () => string }).toString();
                  prixUnitaireFinal = parseFloat(str);
                }
              }
            } catch {
              prixUnitaireFinal = null;
            }
          }

          return {
            ...cmd,
            prix_unitaire: prixUnitaireFinal,
            date_livraison: cmd.date_livraison
              ? (cmd.date_livraison as Date).toISOString()
              : null,
            createdAt: (cmd.createdAt as Date).toISOString(),
            updatedAt: (cmd.updatedAt as Date).toISOString(),
            client: cmd.Client,
            clientEntreprise: cmd.Client_entreprise,
            voitureModel: cmd.VoitureModel,
            fournisseurs: (cmd.CommandeToFournisseur || []).map((ctf) => ctf.Fournisseur),
          };
        }),
        subcases: (c.Subcase || []).map((subcase: unknown) => {
          const s = subcase as Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
          };
          return {
            ...s,
            createdAt: (s.createdAt as Date).toISOString(),
            updatedAt: (s.updatedAt as Date).toISOString(),
          };
        }),
        verifications: c.VerificationConteneur,
        voitures: (c.Voiture || []).map((v: unknown) => {
          const voiture = v as Record<string, unknown> & {
            VoitureModel?: unknown;
          };
          return {
            ...voiture,
            voitureModel: voiture.VoitureModel,
          };
        }),
      };
    });

    return { success: true, data: serializedConteneurs };

    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs transite:", error);
    return { success: false, error: "Failed to fetch conteneurs transite" };
  }
}

export async function markConteneurAsRenseigne(conteneurId: string) {
  try {
    // Update all spare parts in subcases of this conteneur
    await prisma.sparePart.updateMany({
      where: {
        Subcase: {
          conteneurId: conteneurId,
        },
      },
      data: {
        etapeSparePart: "RENSEIGNE",
      },
    });

    // Update conteneur status to RENSEIGNE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: "RENSEIGNE",
      },
    });

    // Update all commandes in this conteneur to RENSEIGNEE
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId,
      },
      data: {
        etapeCommande: "RENSEIGNEE",
      },
    });

    revalidatePath("/magasinier/renseigner-commande");
    return { success: true };
  } catch (error) {
    console.error("Error marking conteneur as renseigne:", error);
    return { success: false, error: "Failed to mark conteneur as renseigne" };
  }
}

export async function getSparePartsRanges() {
  try {
    const spareParts = await prisma.sparePart.findMany({
      where: {
        etapeSparePart: "RANGE",
      },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
          },
        },
        Voiture: {
          include: {
            VoitureModel: true,
            Commande: {
              include: {
                Client: true,
              },
            },
          },
        },
        Storage: true,
        Subcase: {
          include: {
            Conteneur: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: spareParts };
  } catch (error) {
    console.error("Error fetching spare parts ranges:", error);
    return { success: false, error: "Failed to fetch spare parts ranges" };
  }
}

export async function getConteneursValides() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        Commande: {
          some: {
            etapeCommande: "VALIDE",
          },
        },
      },
      include: {
        Commande: {
          where: {
            etapeCommande: "VALIDE",
          },
          include: {
            Client: true,
            VoitureModel: true,
            CommandeToFournisseur: {
              include: {
                Fournisseur: true,
              },
            },
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs with VALIDE commandes:", error);
    return {
      success: false,
      error: "Failed to fetch conteneurs with VALIDE commandes",
    };
  }
}

export async function getConteneursAndCommandesTransiteNonRenseigne() {
  try {
    // Fetch conteneurs with etapeConteneur === "TRANSITE_NON_RENSEIGNE"
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "TRANSITE_NON_RENSEIGNE",
      },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Subcase: {
          include: {
            SparePart: true,
          },
        },
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch standalone commandes with etapeCommande === "TRANSITE_NON_RENSEIGNE" and no conteneur
    const standaloneCommandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "TRANSITE_NON_RENSEIGNE",
        conteneurId: null,
      },
      include: {
        VoitureModel: true,
        Client: true,
        Client_entreprise: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        id: string;
        conteneurNumber: string;
        sealNumber: string | null;
        totalPackages: string | null;
        grossWeight: string | null;
        netWeight: string | null;
        stuffingMap: string | null;
        etapeConteneur: string;
        createdAt: Date;
        updatedAt: Date;
        dateEmbarquement: Date | null;
        dateArriveProbable: Date | null;
        Commande?: unknown[];
      };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            id: string;
            couleur: string;
            motorisation: string;
            transmission: string;
            nbr_portes: number;
            prix_unitaire: unknown;
            date_livraison: Date;
            createdAt: Date;
            updatedAt: Date;
            etapeCommande: string;
            commandeFlag: string;
            VoitureModel?: { model: string };
            Client?: { nom: string };
            Client_entreprise?: { nom_entreprise: string };
          };
          let prixUnitaireFinal: number | null = null;
          const prixRaw = cmd.prix_unitaire;

          if (prixRaw === null || prixRaw === undefined) {
            prixUnitaireFinal = null;
          } else {
            try {
              if (typeof prixRaw === "number") {
                prixUnitaireFinal = prixRaw;
              } else if (typeof prixRaw === "string") {
                prixUnitaireFinal = parseFloat(prixRaw);
              } else if (prixRaw && typeof prixRaw === "object") {
                if (
                  "constructor" in prixRaw &&
                  prixRaw.constructor &&
                  typeof prixRaw.constructor === "function" &&
                  prixRaw.constructor.name === "Decimal"
                ) {
                  try {
                    const str = String(prixRaw);
                    prixUnitaireFinal = parseFloat(str);
                  } catch {
                    prixUnitaireFinal = null;
                  }
                } else if (
                  "toNumber" in prixRaw &&
                  typeof (prixRaw as { toNumber?: () => number }).toNumber ===
                    "function"
                ) {
                  try {
                    prixUnitaireFinal = (
                      prixRaw as { toNumber: () => number }
                    ).toNumber();
                  } catch {
                    prixUnitaireFinal = null;
                  }
                } else {
                  try {
                    prixUnitaireFinal = Number(prixRaw);
                  } catch {
                    prixUnitaireFinal = null;
                  }
                }
              } else {
                try {
                  prixUnitaireFinal = Number(prixRaw);
                } catch {
                  prixUnitaireFinal = null;
                }
              }
            } catch {
              prixUnitaireFinal = null;
            }
          }
          return {
            id: cmd.id,
            couleur: cmd.couleur,
            motorisation: cmd.motorisation,
            transmission: cmd.transmission,
            nbr_portes: cmd.nbr_portes,
            prix_unitaire: prixUnitaireFinal,
            date_livraison: cmd.date_livraison.toISOString(),
            createdAt: cmd.createdAt.toISOString(),
            updatedAt: cmd.updatedAt.toISOString(),
            etapeCommande: String(cmd.etapeCommande),
            commandeFlag: String(cmd.commandeFlag),
            voitureModel: cmd.VoitureModel
              ? { model: cmd.VoitureModel.model }
              : null,
            client: cmd.Client ? { nom: cmd.Client.nom } : null,
            clientEntreprise: cmd.Client_entreprise
              ? { nom_entreprise: cmd.Client_entreprise.nom_entreprise }
              : null,
          };
        }),
      };
    });

    const serializedCommandes = (standaloneCommandes as unknown[]).map((commande: unknown) => {
      const cmd = commande as Record<string, unknown> & {
        id: string;
        couleur: string;
        motorisation: string;
        transmission: string;
        nbr_portes: number;
        prix_unitaire: unknown;
        date_livraison: Date;
        createdAt: Date;
        updatedAt: Date;
        etapeCommande: string;
        commandeFlag: string;
        VoitureModel?: { model: string };
        Client?: { nom: string };
        Client_entreprise?: { nom_entreprise: string };
      };
      let prixUnitaireFinal: number | null = null;
      const prixRaw = cmd.prix_unitaire;

      if (prixRaw === null || prixRaw === undefined) {
        prixUnitaireFinal = null;
      } else {
        try {
          if (typeof prixRaw === "number") {
            prixUnitaireFinal = prixRaw;
          } else if (typeof prixRaw === "string") {
            prixUnitaireFinal = parseFloat(prixRaw);
          } else if (prixRaw && typeof prixRaw === "object") {
            if (
              "constructor" in prixRaw &&
              prixRaw.constructor &&
              typeof prixRaw.constructor === "function" &&
              prixRaw.constructor.name === "Decimal"
            ) {
              try {
                const str = String(prixRaw);
                prixUnitaireFinal = parseFloat(str);
              } catch {
                prixUnitaireFinal = null;
              }
            } else if (
              "toNumber" in prixRaw &&
              typeof (prixRaw as { toNumber?: () => number }).toNumber ===
                "function"
            ) {
              try {
                prixUnitaireFinal = (
                  prixRaw as { toNumber: () => number }
                ).toNumber();
              } catch {
                prixUnitaireFinal = null;
              }
            } else {
              try {
                prixUnitaireFinal = Number(prixRaw);
              } catch {
                prixUnitaireFinal = null;
              }
            }
          } else {
            try {
              prixUnitaireFinal = Number(prixRaw);
            } catch {
              prixUnitaireFinal = null;
            }
          }
        } catch {
          prixUnitaireFinal = null;
        }
      }
      return {
        id: cmd.id,
        couleur: cmd.couleur,
        motorisation: cmd.motorisation,
        transmission: cmd.transmission,
        nbr_portes: cmd.nbr_portes,
        prix_unitaire: prixUnitaireFinal,
        date_livraison: cmd.date_livraison.toISOString(),
        createdAt: cmd.createdAt.toISOString(),
        updatedAt: cmd.updatedAt.toISOString(),
        etapeCommande: String(cmd.etapeCommande),
        commandeFlag: String(cmd.commandeFlag),
        voitureModel: cmd.VoitureModel ? { model: cmd.VoitureModel.model } : null,
        client: cmd.Client ? { nom: cmd.Client.nom } : null,
        clientEntreprise: cmd.Client_entreprise
          ? { nom_entreprise: cmd.Client_entreprise.nom_entreprise }
          : null,
      };
    });

    return {
      success: true,
      data: {
        conteneurs: serializedConteneurs,
        commandes: serializedCommandes,
      },
    };
  } catch (error) {
    console.error(
      "Error fetching conteneurs and commandes TRANSITE_NON_RENSEIGNE:",
      error,
    );
    return {
      success: false,
      error: "Failed to fetch conteneurs and commandes TRANSITE_NON_RENSEIGNE",
    };
  }
}

export async function getConteneursAndCommandesArrives() {
  try {
    // Get conteneurs with ARRIVE status
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "ARRIVE",
      },
      include: {
        Commande: {
          include: {
            Client: true,
            VoitureModel: true,
            Client_entreprise: true,
          },
        },
        Subcase: true,
        VerificationConteneur: true,
        Voiture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get standalone commandes with ARRIVE status (commandes without conteneur)
    const standaloneCommandes = await prisma.commande.findMany({
      where: {
        conteneurId: null,
        etapeCommande: "ARRIVE",
      },
      include: {
        Client: true,
        VoitureModel: true,
        Client_entreprise: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize conteneurs
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & {
        id: string;
        conteneurNumber: string;
        sealNumber: string | null;
        totalPackages: string | null;
        grossWeight: string | null;
        netWeight: string | null;
        stuffingMap: string | null;
        etapeConteneur: string;
        createdAt: Date;
        updatedAt: Date;
        dateEmbarquement: Date | null;
        dateArriveProbable: Date | null;
        Commande?: unknown[];
      };
      return {
        id: c.id,
        conteneurNumber: c.conteneurNumber,
        sealNumber: c.sealNumber,
        totalPackages: c.totalPackages,
        grossWeight: c.grossWeight,
        netWeight: c.netWeight,
        stuffingMap: c.stuffingMap,
        etapeConteneur: String(c.etapeConteneur),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        dateEmbarquement: (c.dateEmbarquement as Date | null)?.toISOString() || null,
        dateArriveProbable: (c.dateArriveProbable as Date | null)?.toISOString() || null,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            id: string;
            couleur: string;
            motorisation: string;
            transmission: string;
            nbr_portes: number;
            prix_unitaire: unknown;
            date_livraison: Date | null;
            createdAt: Date;
            updatedAt: Date;
            etapeCommande: string;
            commandeFlag: string;
            VoitureModel?: { model: string };
            Client?: { nom: string };
            Client_entreprise?: { nom_entreprise: string };
          };
          return {
            id: cmd.id,
            couleur: cmd.couleur,
            motorisation: cmd.motorisation,
            transmission: cmd.transmission,
            nbr_portes: cmd.nbr_portes,
            prix_unitaire: cmd.prix_unitaire
              ? decimalToNumber(cmd.prix_unitaire)
              : null,
            date_livraison: cmd.date_livraison?.toISOString() || null,
            createdAt: cmd.createdAt.toISOString(),
            updatedAt: cmd.updatedAt.toISOString(),
            etapeCommande: String(cmd.etapeCommande),
            commandeFlag: String(cmd.commandeFlag),
            voitureModel: cmd.VoitureModel
              ? { model: cmd.VoitureModel.model }
              : null,
            client: cmd.Client ? { nom: cmd.Client.nom } : null,
            clientEntreprise: cmd.Client_entreprise
              ? { nom_entreprise: cmd.Client_entreprise.nom_entreprise }
              : null,
          };
        }),
      };
    });

    // Serialize standalone commandes
    const serializedCommandes = (standaloneCommandes as unknown[]).map((commande: unknown) => {
      const cmd = commande as Record<string, unknown> & {
        id: string;
        couleur: string;
        motorisation: string;
        transmission: string;
        nbr_portes: number;
        prix_unitaire: unknown;
        date_livraison: Date | null;
        createdAt: Date;
        updatedAt: Date;
        etapeCommande: string;
        commandeFlag: string;
        VoitureModel?: { model: string };
        Client?: { nom: string };
        Client_entreprise?: { nom_entreprise: string };
      };
      return {
        id: cmd.id,
        couleur: cmd.couleur,
        motorisation: cmd.motorisation,
        transmission: cmd.transmission,
        nbr_portes: cmd.nbr_portes,
        prix_unitaire: cmd.prix_unitaire
          ? decimalToNumber(cmd.prix_unitaire)
          : null,
        date_livraison: cmd.date_livraison?.toISOString() || null,
        createdAt: cmd.createdAt.toISOString(),
        updatedAt: cmd.updatedAt.toISOString(),
        etapeCommande: String(cmd.etapeCommande),
        commandeFlag: String(cmd.commandeFlag),
        voitureModel: cmd.VoitureModel
          ? { model: cmd.VoitureModel.model }
          : null,
        client: cmd.Client ? { nom: cmd.Client.nom } : null,
        clientEntreprise: cmd.Client_entreprise
          ? { nom_entreprise: cmd.Client_entreprise.nom_entreprise }
          : null,
      };
    });

    return {
      success: true,
      data: {
        conteneurs: serializedConteneurs,
        commandes: serializedCommandes,
      },
    };
  } catch (error) {
    console.error("Error fetching conteneurs and commandes ARRIVES:", error);
    return {
      success: false,
      error: "Failed to fetch conteneurs and commandes ARRIVES",
    };
  }
}
