"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "../generated/prisma/runtime/library";
import { EtapeConteneur, EtapeCommande } from "../generated/prisma";

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
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  // Handle Prisma Decimal object - check for Decimal instance
  if (value && typeof value === 'object') {
    // Check if it's a Decimal object by checking for toString method and constructor name
    if ('constructor' in value && value.constructor && typeof value.constructor === 'function' && value.constructor.name === 'Decimal') {
      try {
        const str = String(value);
        return parseFloat(str);
      } catch {
        return null;
      }
    }
    // Also check for Prisma Decimal by checking if it has a toNumber method
    if ('toNumber' in value && typeof (value as HasToNumber).toNumber === 'function') {
      try {
        return (value as HasToNumber).toNumber();
      } catch {
        try {
          const str = 'toString' in value && typeof (value as HasToString).toString === 'function' 
            ? (value as HasToString).toString() 
            : String(value);
          return parseFloat(str);
        } catch {
          return null;
        }
      }
    }
    // Last resort: try to convert via toString
    if ('toString' in value && typeof (value as HasToString).toString === 'function') {
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
  if (!obj || typeof obj !== 'object') return false;
  
  // Check instanceof first
  try {
    if (obj instanceof Decimal) return true;
  } catch {}
  
  // Check constructor name
  if ('constructor' in obj && obj.constructor && typeof obj.constructor === 'function' && obj.constructor.name === 'Decimal') return true;
  
  // Check if it has Decimal-like methods and properties
  const hasToNumber = 'toNumber' in obj && typeof (obj as HasToNumber).toNumber === 'function';
  const hasToString = 'toString' in obj && typeof (obj as HasToString).toString === 'function';
  
  if (hasToNumber || (hasToString && (obj as HasToString).toString !== Object.prototype.toString)) {
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
    return obj.map(item => deepConvertDecimals(item));
  }
  
  // If it's a plain object, recursively convert all properties
  if (typeof obj === 'object') {
    // Skip Date objects (they're already converted to ISO strings)
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    // Skip if it's already a primitive wrapper (String, Number, Boolean)
    if (obj instanceof String || obj instanceof Number || obj instanceof Boolean) {
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
        commandes: {
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
          }
        },
        subcases: {
          include: {
            spareParts: true,
            tools: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        verifications: true,
        voitures: true,
      }
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
      commandes: conteneur.commandes.map((commande) => {
        // Extract all fields and convert Decimal to number
        const { prix_unitaire, createdAt, updatedAt, date_livraison, ...rest } = commande;
        return {
          ...rest,
          prix_unitaire: decimalToNumber(prix_unitaire),
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
          date_livraison: date_livraison?.toISOString() || null,
          // Ensure nested objects are plain objects
          client: commande.client ? {
            ...commande.client,
            createdAt: commande.client.createdAt instanceof Date ? commande.client.createdAt.toISOString() : commande.client.createdAt,
            updatedAt: commande.client.updatedAt instanceof Date ? commande.client.updatedAt.toISOString() : commande.client.updatedAt,
          } : null,
          clientEntreprise: commande.clientEntreprise ? {
            ...commande.clientEntreprise,
            createdAt: commande.clientEntreprise.createdAt instanceof Date ? commande.clientEntreprise.createdAt.toISOString() : commande.clientEntreprise.createdAt,
            updatedAt: commande.clientEntreprise.updatedAt instanceof Date ? commande.clientEntreprise.updatedAt.toISOString() : commande.clientEntreprise.updatedAt,
          } : null,
          voitureModel: commande.voitureModel ? {
            ...commande.voitureModel,
            createdAt: commande.voitureModel.createdAt instanceof Date ? commande.voitureModel.createdAt.toISOString() : commande.voitureModel.createdAt,
            updatedAt: commande.voitureModel.updatedAt instanceof Date ? commande.voitureModel.updatedAt.toISOString() : commande.voitureModel.updatedAt,
          } : null,
        };
      }),
      subcases: conteneur.subcases.map((subcase) => ({
        ...subcase,
        createdAt: subcase.createdAt.toISOString(),
        updatedAt: subcase.updatedAt.toISOString(),
        spareParts: subcase.spareParts.map((sparePart) => ({
          ...sparePart,
          createdAt: sparePart.createdAt.toISOString(),
          updatedAt: sparePart.updatedAt.toISOString(),
        })),
      })),
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
        commandes: true,
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => ({
        ...commande,
        prix_unitaire: commande.prix_unitaire ? Number(commande.prix_unitaire) : null,
        date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
        createdAt: commande.createdAt.toISOString(),
        updatedAt: commande.updatedAt.toISOString(),
      })),
      subcases: conteneur.subcases.map((subcase) => ({
        ...subcase,
        createdAt: subcase.createdAt.toISOString(),
        updatedAt: subcase.updatedAt.toISOString(),
      })),
      verifications: conteneur.verifications.map((verification) => ({
        ...verification,
        createdAt: verification.createdAt.toISOString(),
        updatedAt: verification.updatedAt.toISOString(),
      })),
      voitures: conteneur.voitures.map((voiture) => ({
        ...voiture,
        createdAt: voiture.createdAt.toISOString(),
        updatedAt: voiture.updatedAt.toISOString(),
      })),
    }));
    
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
        commandes: {
          some: {
            etapeCommande: "TRANSITE"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "TRANSITE"
          },
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => {
        let prixUnitaireFinal: number | null = null;
        const prixRaw = commande.prix_unitaire;
        
        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          try {
            if (typeof prixRaw === 'number') {
              prixUnitaireFinal = prixRaw;
            } else if (typeof prixRaw === 'string') {
              prixUnitaireFinal = parseFloat(prixRaw);
            } else if (prixRaw && typeof prixRaw === 'object') {
              if ('constructor' in prixRaw && prixRaw.constructor && typeof prixRaw.constructor === 'function' && prixRaw.constructor.name === 'Decimal') {
                try {
                  const str = String(prixRaw);
                  prixUnitaireFinal = parseFloat(str);
                } catch {
                  prixUnitaireFinal = null;
                }
              } else if ('toNumber' in prixRaw && typeof (prixRaw as HasToNumber).toNumber === 'function') {
                prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
              } else if ('toString' in prixRaw && typeof (prixRaw as HasToString).toString === 'function') {
                const str = (prixRaw as HasToString).toString();
                prixUnitaireFinal = parseFloat(str);
              }
            }
          } catch {
            prixUnitaireFinal = null;
          }
        }
        
        return {
          ...commande,
          prix_unitaire: prixUnitaireFinal,
          date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
          createdAt: commande.createdAt.toISOString(),
          updatedAt: commande.updatedAt.toISOString(),
          voitureModel: commande.voitureModel ? {
            ...commande.voitureModel,
            createdAt: commande.voitureModel.createdAt instanceof Date ? commande.voitureModel.createdAt.toISOString() : commande.voitureModel.createdAt,
            updatedAt: commande.voitureModel.updatedAt instanceof Date ? commande.voitureModel.updatedAt.toISOString() : commande.voitureModel.updatedAt,
          } : null,
          client: commande.client ? {
            ...commande.client,
            createdAt: commande.client.createdAt instanceof Date ? commande.client.createdAt.toISOString() : commande.client.createdAt,
            updatedAt: commande.client.updatedAt instanceof Date ? commande.client.updatedAt.toISOString() : commande.client.updatedAt,
          } : null,
          clientEntreprise: commande.clientEntreprise ? {
            ...commande.clientEntreprise,
            createdAt: commande.clientEntreprise.createdAt instanceof Date ? commande.clientEntreprise.createdAt.toISOString() : commande.clientEntreprise.createdAt,
            updatedAt: commande.clientEntreprise.updatedAt instanceof Date ? commande.clientEntreprise.updatedAt.toISOString() : commande.clientEntreprise.updatedAt,
          } : null,
        };
      }),
      subcases: conteneur.subcases.map((subcase) => ({
        ...subcase,
        createdAt: subcase.createdAt.toISOString(),
        updatedAt: subcase.updatedAt.toISOString(),
      })),
      verifications: conteneur.verifications.map((verification) => ({
        ...verification,
        createdAt: verification.createdAt.toISOString(),
        updatedAt: verification.updatedAt.toISOString(),
      })),
      voitures: conteneur.voitures.map((voiture) => ({
        ...voiture,
        createdAt: voiture.createdAt.toISOString(),
        updatedAt: voiture.updatedAt.toISOString(),
      })),
    }));
    
    // Use deepConvertDecimals to catch any remaining Decimal objects
    const finalSerialized = deepConvertDecimals(serializedConteneurs);
    
    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching conteneurs with TRANSITE commandes:", error);
    return { success: false, error: "Failed to fetch conteneurs with TRANSITE commandes" };
  }
}

export async function getConteneursChargeWithTransiteCommandes() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "CHARGE",
        commandes: {
          some: {
            etapeCommande: "TRANSITE"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "TRANSITE"
          },
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => {
        let prixUnitaireFinal: number | null = null;
        const prixRaw = commande.prix_unitaire;
        
        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          try {
            if (typeof prixRaw === 'number') {
              prixUnitaireFinal = prixRaw;
            } else if (typeof prixRaw === 'string') {
              prixUnitaireFinal = parseFloat(prixRaw);
            } else if (prixRaw && typeof prixRaw === 'object') {
              if ('constructor' in prixRaw && prixRaw.constructor && typeof prixRaw.constructor === 'function' && prixRaw.constructor.name === 'Decimal') {
                try {
                  const str = String(prixRaw);
                  prixUnitaireFinal = parseFloat(str);
                } catch {
                  prixUnitaireFinal = null;
                }
              } else if ('toNumber' in prixRaw && typeof (prixRaw as HasToNumber).toNumber === 'function') {
                prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
              } else if ('toString' in prixRaw && typeof (prixRaw as HasToString).toString === 'function') {
                const str = (prixRaw as HasToString).toString();
                prixUnitaireFinal = parseFloat(str);
              }
            }
          } catch {
            prixUnitaireFinal = null;
          }
        }
        
        return {
          ...commande,
          prix_unitaire: prixUnitaireFinal,
          date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
          createdAt: commande.createdAt.toISOString(),
          updatedAt: commande.updatedAt.toISOString(),
          voitureModel: commande.voitureModel ? {
            ...commande.voitureModel,
            createdAt: commande.voitureModel.createdAt instanceof Date ? commande.voitureModel.createdAt.toISOString() : commande.voitureModel.createdAt,
            updatedAt: commande.voitureModel.updatedAt instanceof Date ? commande.voitureModel.updatedAt.toISOString() : commande.voitureModel.updatedAt,
          } : null,
          client: commande.client ? {
            ...commande.client,
            createdAt: commande.client.createdAt instanceof Date ? commande.client.createdAt.toISOString() : commande.client.createdAt,
            updatedAt: commande.client.updatedAt instanceof Date ? commande.client.updatedAt.toISOString() : commande.client.updatedAt,
          } : null,
          clientEntreprise: commande.clientEntreprise ? {
            ...commande.clientEntreprise,
            createdAt: commande.clientEntreprise.createdAt instanceof Date ? commande.clientEntreprise.createdAt.toISOString() : commande.clientEntreprise.createdAt,
            updatedAt: commande.clientEntreprise.updatedAt instanceof Date ? commande.clientEntreprise.updatedAt.toISOString() : commande.clientEntreprise.updatedAt,
          } : null,
        };
      }),
      subcases: conteneur.subcases.map((subcase) => ({
        ...subcase,
        createdAt: subcase.createdAt.toISOString(),
        updatedAt: subcase.updatedAt.toISOString(),
      })),
      verifications: conteneur.verifications.map((verification) => ({
        ...verification,
        createdAt: verification.createdAt.toISOString(),
        updatedAt: verification.updatedAt.toISOString(),
      })),
      voitures: conteneur.voitures.map((voiture) => ({
        ...voiture,
        createdAt: voiture.createdAt.toISOString(),
        updatedAt: voiture.updatedAt.toISOString(),
      })),
    }));
    
    // Use deepConvertDecimals to catch any remaining Decimal objects
    const finalSerialized = deepConvertDecimals(serializedConteneurs);
    
    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching conteneurs CHARGE with TRANSITE commandes:", error);
    return { success: false, error: "Failed to fetch conteneurs CHARGE with TRANSITE commandes" };
  }
}

export async function getAllConteneursCharge() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "CHARGE",
      },
      include: {
        commandes: {
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => {
        let prixUnitaireFinal: number | null = null;
        const prixRaw = commande.prix_unitaire;
        
        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          try {
            if (typeof prixRaw === 'number') {
              prixUnitaireFinal = prixRaw;
            } else if (typeof prixRaw === 'string') {
              prixUnitaireFinal = parseFloat(prixRaw);
            } else if (prixRaw && typeof prixRaw === 'object') {
              if ('constructor' in prixRaw && prixRaw.constructor && typeof prixRaw.constructor === 'function' && prixRaw.constructor.name === 'Decimal') {
                try {
                  const str = String(prixRaw);
                  prixUnitaireFinal = parseFloat(str);
                } catch {
                  prixUnitaireFinal = null;
                }
              } else if ('toNumber' in prixRaw && typeof (prixRaw as HasToNumber).toNumber === 'function') {
                prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
              } else if ('toString' in prixRaw && typeof (prixRaw as HasToString).toString === 'function') {
                const str = (prixRaw as HasToString).toString();
                prixUnitaireFinal = parseFloat(str);
              }
            }
          } catch {
            prixUnitaireFinal = null;
          }
        }
        
        return {
          ...commande,
          prix_unitaire: prixUnitaireFinal,
          date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
          createdAt: commande.createdAt.toISOString(),
          updatedAt: commande.updatedAt.toISOString(),
          voitureModel: commande.voitureModel ? {
            ...commande.voitureModel,
            createdAt: commande.voitureModel.createdAt instanceof Date ? commande.voitureModel.createdAt.toISOString() : commande.voitureModel.createdAt,
            updatedAt: commande.voitureModel.updatedAt instanceof Date ? commande.voitureModel.updatedAt.toISOString() : commande.voitureModel.updatedAt,
          } : null,
          client: commande.client ? {
            ...commande.client,
            createdAt: commande.client.createdAt instanceof Date ? commande.client.createdAt.toISOString() : commande.client.createdAt,
            updatedAt: commande.client.updatedAt instanceof Date ? commande.client.updatedAt.toISOString() : commande.client.updatedAt,
          } : null,
          clientEntreprise: commande.clientEntreprise ? {
            ...commande.clientEntreprise,
            createdAt: commande.clientEntreprise.createdAt instanceof Date ? commande.clientEntreprise.createdAt.toISOString() : commande.clientEntreprise.createdAt,
            updatedAt: commande.clientEntreprise.updatedAt instanceof Date ? commande.clientEntreprise.updatedAt.toISOString() : commande.clientEntreprise.updatedAt,
          } : null,
        };
      }),
      subcases: conteneur.subcases.map((subcase) => ({
        ...subcase,
        createdAt: subcase.createdAt.toISOString(),
        updatedAt: subcase.updatedAt.toISOString(),
      })),
      verifications: conteneur.verifications.map((verification) => ({
        ...verification,
        createdAt: verification.createdAt.toISOString(),
        updatedAt: verification.updatedAt.toISOString(),
      })),
      voitures: conteneur.voitures.map((voiture) => ({
        ...voiture,
        createdAt: voiture.createdAt.toISOString(),
        updatedAt: voiture.updatedAt.toISOString(),
      })),
    }));
    
    // Use deepConvertDecimals to catch any remaining Decimal objects
    const finalSerialized = deepConvertDecimals(serializedConteneurs);
    
    return { success: true, data: finalSerialized };
  } catch (error) {
    console.error("Error fetching all conteneurs CHARGE:", error);
    return { success: false, error: "Failed to fetch all conteneurs CHARGE" };
  }
}

export async function updateConteneur(id: string, data: {
  conteneurNumber?: string;
  sealNumber?: string;
  totalPackages?: string;
  grossWeight?: string;
  netWeight?: string;
  stuffingMap?: string;
  etapeConteneur?: EtapeConteneur;
  dateEmbarquement?: Date;
  dateArriveProbable?: Date;
}) {
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
      where: { id }
    });
    
    revalidatePath("/manager/ajouter-conteneur");
    return { success: true };
  } catch (error) {
    console.error("Error deleting conteneur:", error);
    return { success: false, error: "Failed to delete conteneur" };
  }
}

export async function updateConteneurToTransiteNonRenseigne(conteneurId: string) {
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

export async function updateConteneurToTransiteDejaRenseigne(conteneurId: string) {
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
    console.error("Error updating conteneur to transite_deja_renseigne:", error);
    return { success: false, error: "Failed to update conteneur" };
  }
}

export async function getConteneursRenseignes() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "RENSEIGNE"
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects in commandes
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => {
        // CRITICAL: Convert prix_unitaire using the most aggressive method possible
        let prixUnitaireFinal: number | null = null;
        const prixRaw = commande.prix_unitaire;
        
        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          // Try every possible conversion method
          try {
            // Method 1: Direct number
            if (typeof prixRaw === 'number') {
              prixUnitaireFinal = prixRaw;
            }
            // Method 2: String to number
            else if (typeof prixRaw === 'string') {
              prixUnitaireFinal = parseFloat(prixRaw) || null;
            }
            // Method 3: Decimal object - force conversion
            else if (typeof prixRaw === 'object' && prixRaw !== null) {
              // Try toNumber() first
              if ('toNumber' in prixRaw && typeof (prixRaw as HasToNumber).toNumber === 'function') {
                try {
                  prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
                } catch {}
              }
              // Try toString() then parseFloat
              if (prixUnitaireFinal === null && 'toString' in prixRaw && typeof (prixRaw as HasToString).toString === 'function') {
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
          id: String(commande.id),
          etapeCommande: String(commande.etapeCommande),
          date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
          createdAt: commande.createdAt.toISOString(),
          updatedAt: commande.updatedAt.toISOString(),
          clientId: commande.clientId ? String(commande.clientId) : null,
          conteneurId: commande.conteneurId ? String(commande.conteneurId) : null,
          commandeLocalId: commande.commandeLocalId ? String(commande.commandeLocalId) : null,
          couleur: String(commande.couleur),
          montageId: commande.montageId ? String(commande.montageId) : null,
          motorisation: String(commande.motorisation),
          nbr_portes: String(commande.nbr_portes),
          transmission: String(commande.transmission),
          voitureModelId: commande.voitureModelId ? String(commande.voitureModelId) : null,
          clientEntrepriseId: commande.clientEntrepriseId ? String(commande.clientEntrepriseId) : null,
          factureId: commande.factureId ? String(commande.factureId) : null,
          prix_unitaire: typeof prixUnitaireFinal === 'number' ? prixUnitaireFinal : null,
          commandeFlag: String(commande.commandeFlag),
          commandeGroupeeId: commande.commandeGroupeeId ? String(commande.commandeGroupeeId) : null,
          client: commande.client,
          voitureModel: commande.voitureModel,
          fournisseurs: commande.fournisseurs,
        };
        
        return commandeObj;
      }),
      subcases: conteneur.subcases,
      verifications: conteneur.verifications,
      voitures: conteneur.voitures,
    }));
    
    // Final pass: Deeply convert all Decimal objects recursively
    let finalSerialized = deepConvertDecimals(serializedConteneurs);
    
    // Type guard: ensure finalSerialized is an array
    if (!Array.isArray(finalSerialized)) {
      return { success: false, error: "Serialization failed" };
    }
    
    // CRITICAL: One more explicit pass to ensure prix_unitaire is NEVER a Decimal
    const processedSerialized = finalSerialized.map((conteneur: Record<string, unknown>) => {
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
            if (typeof prixUnitaire === 'number') {
              prixFinal = prixUnitaire;
            } else if (typeof prixUnitaire === 'string') {
              prixFinal = parseFloat(prixUnitaire) || null;
            } else if (typeof prixUnitaire === 'object' && prixUnitaire !== null) {
              // It's still an object - force convert it
              try {
                if ('toNumber' in prixUnitaire && typeof (prixUnitaire as HasToNumber).toNumber === 'function') {
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
    });
    
    let finalProcessed = processedSerialized;
    
    // Ultimate safety: Use JSON.stringify with custom replacer to catch ANY Decimal objects
    try {
      const jsonStringified = JSON.stringify(finalProcessed, (key, value) => {
        // Catch Decimal objects that might have slipped through
        if (value && typeof value === 'object') {
          // Check if it's a Decimal by trying to convert it
          if (isDecimal(value)) {
            const converted = decimalToNumber(value);
            return converted !== null ? converted : null;
          }
          // Check constructor name
          if ('constructor' in value && value.constructor && typeof value.constructor === 'function' && value.constructor.name === 'Decimal') {
            const converted = decimalToNumber(value);
            return converted !== null ? converted : null;
          }
        }
        return value;
      });
      finalProcessed = JSON.parse(jsonStringified) as typeof processedSerialized;
    } catch (jsonError) {
      // If JSON serialization fails, it means there are non-serializable objects
      console.error('JSON serialization failed:', jsonError);
      // Return null for prix_unitaire if we can't serialize
      if (Array.isArray(finalProcessed)) {
        finalProcessed = finalProcessed.map((conteneur: Record<string, unknown>) => {
          const conteneurObj = conteneur as Record<string, unknown>;
          const commandes = Array.isArray(conteneurObj.commandes) ? conteneurObj.commandes : [];
          return {
            ...conteneurObj,
            commandes: commandes.map((commande: unknown) => {
              const commandeObj = commande as Record<string, unknown>;
              return {
                ...commandeObj,
                prix_unitaire: typeof commandeObj.prix_unitaire === 'number' ? commandeObj.prix_unitaire : null,
              };
            }),
          };
        });
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
        subcase: {
          conteneurId: conteneurId
        }
      },
      data: {
        etapeSparePart: 'ARRIVE'
      }
    });

    // Update conteneur status to ARRIVE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: 'ARRIVE'
      }
    });

    // Update all commandes in this conteneur to ARRIVE
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId
      },
      data: {
        etapeCommande: 'ARRIVE'
      }
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
        etapeConteneur: "ARRIVE"
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
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
        commandes: {
          some: {
            etapeCommande: "ARRIVE"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "ARRIVE"
          },
          include: {
            client: true,
            voitureModel: true,
            clientEntreprise: true,
            fournisseurs: true,
            spareParts: {
              where: {
                etapeSparePart: "ARRIVE"
              }
            }
          }
        },
        subcases: {
          include: {
            spareParts: {
              where: {
                etapeSparePart: "ARRIVE"
              }
            },
            tools: true
          }
        },
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Filter to only include conteneurs that have at least one commande with ARRIVE status
    // and filter commandes to only show those with ARRIVE status
    // Also filter spareParts to only show those with ARRIVE status
    const filteredConteneurs = conteneurs
      .map((conteneur) => ({
        ...conteneur,
        commandes: conteneur.commandes
          .filter((commande) => commande.etapeCommande === "ARRIVE")
          .map((commande) => ({
            ...commande,
            prix_unitaire: commande.prix_unitaire ? decimalToNumber(commande.prix_unitaire) : null,
            spareParts: commande.spareParts.filter((sp) => sp.etapeSparePart === "ARRIVE")
          })),
        subcases: conteneur.subcases.map((subcase) => ({
          ...subcase,
          spareParts: subcase.spareParts.filter((sp) => sp.etapeSparePart === "ARRIVE")
        }))
      }))
      .filter((conteneur) => conteneur.commandes.length > 0);
    
    // Serialize Date objects
    const serializedConteneurs = filteredConteneurs.map((conteneur) => ({
      ...conteneur,
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => ({
        ...commande,
        date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
        createdAt: commande.createdAt.toISOString(),
        updatedAt: commande.updatedAt.toISOString(),
      }))
    }));
    
    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs arrives with all ARRIVE statuses:", error);
    return { success: false, error: "Failed to fetch conteneurs arrives with all ARRIVE statuses" };
  }
}

export async function orderDepotageForConteneur(conteneurId: string) {
  try {
    // Update all spare parts in subcases of this conteneur from ARRIVE to DEPOTAGE_EN_COURS
    await prisma.sparePart.updateMany({
      where: {
        subcase: {
          conteneurId: conteneurId
        },
        etapeSparePart: "ARRIVE"
      },
      data: {
        etapeSparePart: 'DEPOTAGE_EN_COURS'
      }
    });

    // Update all spare parts in commandes of this conteneur from ARRIVE to DEPOTAGE_EN_COURS
    await prisma.sparePart.updateMany({
      where: {
        commande: {
          conteneurId: conteneurId,
          etapeCommande: "ARRIVE"
        },
        etapeSparePart: "ARRIVE"
      },
      data: {
        etapeSparePart: 'DEPOTAGE_EN_COURS'
      }
    });

    // Update conteneur from ARRIVE to DEPOTAGE_EN_COURS
    const conteneurUpdateResult = await prisma.conteneur.updateMany({
      where: {
        id: conteneurId,
        etapeConteneur: "ARRIVE"
      },
      data: {
        etapeConteneur: 'DEPOTAGE_EN_COURS'
      }
    });

    // Check if conteneur was updated (if not, it might not be in ARRIVE status)
    if (conteneurUpdateResult.count === 0) {
      // Verify conteneur exists
      const conteneur = await prisma.conteneur.findUnique({
        where: { id: conteneurId },
        select: { id: true, etapeConteneur: true }
      });
      
      if (!conteneur) {
        return { success: false, error: "Conteneur introuvable" };
      }
      
      if (conteneur.etapeConteneur !== "ARRIVE") {
        return { 
          success: false, 
          error: `Le conteneur n'est pas en statut ARRIVE (statut actuel: ${conteneur.etapeConteneur})` 
        };
      }
    }

    // Update all commandes with ARRIVE status to DEPOTAGE_EN_COURS
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId,
        etapeCommande: "ARRIVE"
      },
      data: {
        etapeCommande: 'DEPOTAGE_EN_COURS'
      }
    });
    
    revalidatePath("/manager/conteneur-arrives");
    return { success: true, message: "Dépotage ordonné avec succès" };
  } catch (error) {
    console.error("Error ordering depotage for conteneur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return { 
      success: false, 
      error: `Échec de l'ordonnancement du dépotage: ${errorMessage}` 
    };
  }
}

export async function getConteneursDepotageEnCours() {
  try {
    // Add timeout wrapper for the query
    const queryPromise = prisma.conteneur.findMany({
      where: {
        etapeConteneur: "DEPOTAGE_EN_COURS",
        commandes: {
          some: {
            etapeCommande: "DEPOTAGE_EN_COURS"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "DEPOTAGE_EN_COURS"
          },
          include: {
            client: {
              select: {
                id: true,
                nom: true,
                email: true,
                telephone: true,
              }
            },
            voitureModel: {
              select: {
                id: true,
                model: true,
              }
            },
            clientEntreprise: {
              select: {
                id: true,
                nom_entreprise: true,
                email: true,
                telephone: true,
              }
            },
            fournisseurs: {
              select: {
                id: true,
                nom: true,
                email: true,
              }
            },
            spareParts: {
              where: {
                etapeSparePart: "DEPOTAGE_EN_COURS"
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
              }
            }
          }
        },
        subcases: {
          include: {
            spareParts: {
              where: {
                etapeSparePart: "DEPOTAGE_EN_COURS"
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
              }
            },
            tools: {
              select: {
                id: true,
                toolCode: true,
                toolName: true,
                quantity: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        },
        verifications: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        voitures: {
          select: {
            id: true,
            nbr_portes: true,
            transmission: true,
            motorisation: true,
            couleur: true,
            createdAt: true,
            updatedAt: true,
            voitureModel: {
              select: {
                id: true,
                model: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit results to prevent timeout
    });

    // Add timeout (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout: getConteneursDepotageEnCours took longer than 30 seconds')), 30000);
    });

    const conteneurs = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;
    
    // Filter to only include conteneurs that have at least one commande with DEPOTAGE_EN_COURS status
    // and filter commandes to only show those with DEPOTAGE_EN_COURS status
    // Also filter spareParts to only show those with DEPOTAGE_EN_COURS status
    const filteredConteneurs = conteneurs
      .map((conteneur) => ({
        ...conteneur,
        commandes: conteneur.commandes
          .filter((commande) => commande.etapeCommande === "DEPOTAGE_EN_COURS")
          .map((commande) => ({
            ...commande,
            prix_unitaire: commande.prix_unitaire ? decimalToNumber(commande.prix_unitaire) : null,
            spareParts: commande.spareParts.filter((sp) => sp.etapeSparePart === "DEPOTAGE_EN_COURS")
          })),
        subcases: conteneur.subcases.map((subcase) => ({
          ...subcase,
          spareParts: subcase.spareParts.filter((sp) => sp.etapeSparePart === "DEPOTAGE_EN_COURS")
        }))
      }))
      .filter((conteneur) => conteneur.commandes.length > 0);
    
    // Serialize Date objects
    const serializedConteneurs = filteredConteneurs.map((conteneur) => ({
      ...conteneur,
      createdAt: conteneur.createdAt?.toISOString() || null,
      updatedAt: conteneur.updatedAt?.toISOString() || null,
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => ({
        ...commande,
        prix_unitaire: commande.prix_unitaire !== undefined ? (typeof commande.prix_unitaire === 'number' ? commande.prix_unitaire : decimalToNumber(commande.prix_unitaire)) : null,
        date_livraison: commande.date_livraison?.toISOString() || null,
        createdAt: commande.createdAt?.toISOString() || null,
        updatedAt: commande.updatedAt?.toISOString() || null,
        spareParts: commande.spareParts.map((sp) => ({
          ...sp,
          createdAt: sp.createdAt?.toISOString() || null,
          updatedAt: sp.updatedAt?.toISOString() || null,
        })),
      })),
      subcases: conteneur.subcases.map((subcase) => ({
        ...subcase,
        createdAt: subcase.createdAt?.toISOString() || null,
        updatedAt: subcase.updatedAt?.toISOString() || null,
        spareParts: subcase.spareParts.map((sp) => ({
          ...sp,
          createdAt: sp.createdAt?.toISOString() || null,
          updatedAt: sp.updatedAt?.toISOString() || null,
        })),
        tools: subcase.tools.map((tool) => ({
          ...tool,
          createdAt: tool.createdAt?.toISOString() || null,
          updatedAt: tool.updatedAt?.toISOString() || null,
        })),
      })),
    }));
    
    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs depotage en cours:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : JSON.stringify(error);
    
    // Check if it's a timeout error
    const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('Timeout');
    
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
        : `Failed to fetch conteneurs depotage en cours: ${errorMessage}` 
    };
  }
}

export async function markConteneurAsDecharge(conteneurId: string) {
  try {
    await prisma.sparePart.updateMany({
      where: { subcase: { conteneurId } },
      data: { etapeSparePart: 'DECHARGE' }
    });

    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: { etapeConteneur: EtapeConteneur.DEPOTAGE_EN_COURS }
    });

    await prisma.commande.updateMany({
      where: { conteneurId },
      data: { etapeCommande: 'DECHARGE' }
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
        etapeConteneur: EtapeConteneur.DEPOTAGE_EN_COURS
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: {
          include: {
            spareParts: true,
            tools: true
          }
        },
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
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
        conteneurId: conteneurId,
      },
    });

    // Create RapportVerification linked to VerificationConteneur
    await prisma.rapportVerification.create({
      data: {
        verificationConteneurId: verificationConteneur.id,
      },
    });

    // Update all spare parts from subcases
    await prisma.sparePart.updateMany({
      where: { subcase: { conteneurId } },
      data: { 
        etapeSparePart: 'VERIFIER',
        verificationConteneurId: verificationConteneur.id
      }
    });

    // Update all spare parts from commandes
    await prisma.sparePart.updateMany({
      where: { commande: { conteneurId } },
      data: { 
        etapeSparePart: 'VERIFIER',
        verificationConteneurId: verificationConteneur.id
      }
    });

    // Update conteneur
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: { 
        etapeConteneur: 'VERIFIER',
        isVerified: true
      }
    });

    // Update all commandes in the conteneur
    await prisma.commande.updateMany({
      where: { conteneurId },
      data: { etapeCommande: 'VERIFIER' }
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
        verificationConteneur: {
          include: {
            conteneur: true,
            _count: {
              select: {
                PieceComplement: true,
                spares: true,
                tools: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedRapports = rapports.map((rapport) => ({
      id: rapport.id,
      createdAt: rapport.createdAt.toISOString(),
      updatedAt: rapport.updatedAt.toISOString(),
      verificationConteneur: {
        id: rapport.verificationConteneur.id,
        createdAt: rapport.verificationConteneur.createdAt.toISOString(),
        updatedAt: rapport.verificationConteneur.updatedAt.toISOString(),
        conteneur: {
          id: rapport.verificationConteneur.conteneur.id,
          conteneurNumber: rapport.verificationConteneur.conteneur.conteneurNumber,
          sealNumber: rapport.verificationConteneur.conteneur.sealNumber,
          totalPackages: rapport.verificationConteneur.conteneur.totalPackages,
          grossWeight: rapport.verificationConteneur.conteneur.grossWeight,
          netWeight: rapport.verificationConteneur.conteneur.netWeight,
          stuffingMap: rapport.verificationConteneur.conteneur.stuffingMap,
          isVerified: rapport.verificationConteneur.conteneur.isVerified,
          etapeConteneur: rapport.verificationConteneur.conteneur.etapeConteneur,
          createdAt: rapport.verificationConteneur.conteneur.createdAt.toISOString(),
          updatedAt: rapport.verificationConteneur.conteneur.updatedAt.toISOString(),
          dateEmbarquement: rapport.verificationConteneur.conteneur.dateEmbarquement?.toISOString() || null,
          dateArriveProbable: rapport.verificationConteneur.conteneur.dateArriveProbable?.toISOString() || null,
        },
        counts: {
          pieceComplements: rapport.verificationConteneur._count.PieceComplement,
          spares: rapport.verificationConteneur._count.spares,
          tools: rapport.verificationConteneur._count.tools,
        },
      },
    }));

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
        verificationConteneur: {
          include: {
            conteneur: true,
            spares: {
              include: {
                commande: true,
                subcase: true,
              },
              orderBy: { createdAt: "asc" },
            },
            tools: {
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

    const serializedRapport = {
      id: rapport.id,
      createdAt: rapport.createdAt.toISOString(),
      updatedAt: rapport.updatedAt.toISOString(),
      verificationConteneur: {
        id: rapport.verificationConteneur.id,
        createdAt: rapport.verificationConteneur.createdAt.toISOString(),
        updatedAt: rapport.verificationConteneur.updatedAt.toISOString(),
        conteneur: {
          id: rapport.verificationConteneur.conteneur.id,
          conteneurNumber: rapport.verificationConteneur.conteneur.conteneurNumber,
          sealNumber: rapport.verificationConteneur.conteneur.sealNumber,
          totalPackages: rapport.verificationConteneur.conteneur.totalPackages,
          grossWeight: rapport.verificationConteneur.conteneur.grossWeight,
          netWeight: rapport.verificationConteneur.conteneur.netWeight,
          stuffingMap: rapport.verificationConteneur.conteneur.stuffingMap,
          isVerified: rapport.verificationConteneur.conteneur.isVerified,
          etapeConteneur: rapport.verificationConteneur.conteneur.etapeConteneur,
          createdAt: rapport.verificationConteneur.conteneur.createdAt.toISOString(),
          updatedAt: rapport.verificationConteneur.conteneur.updatedAt.toISOString(),
          dateEmbarquement: rapport.verificationConteneur.conteneur.dateEmbarquement?.toISOString() || null,
          dateArriveProbable: rapport.verificationConteneur.conteneur.dateArriveProbable?.toISOString() || null,
        },
        spares: rapport.verificationConteneur.spares.map((spare) => ({
          id: spare.id,
          partCode: spare.partCode,
          partName: spare.partName,
          partNameFrench: spare.partNameFrench,
          verificationName: spare.verificationName,
          quantity: spare.quantity,
          etapeSparePart: spare.etapeSparePart,
          statusVerification: spare.statusVerification,
          createdAt: spare.createdAt.toISOString(),
          updatedAt: spare.updatedAt.toISOString(),
          commandeId: spare.commandeId,
          subcaseId: spare.subcaseId,
          subcaseNumber: spare.subcase?.subcaseNumber || null,
        })),
        tools: rapport.verificationConteneur.tools.map((tool) => ({
          id: tool.id,
          toolCode: tool.toolCode,
          toolName: tool.toolName,
          quantity: tool.quantity,
          check: tool.check,
          etapeTool: tool.etapeTool,
          createdAt: tool.createdAt.toISOString(),
          updatedAt: tool.updatedAt.toISOString(),
          commandeId: tool.commandeId,
          subcaseId: tool.subcaseId,
        })),
        pieceComplements: rapport.verificationConteneur.PieceComplement.map((piece) => ({
          id: piece.id,
          partCode: piece.partCode,
          partName: piece.partName,
          partNameFrench: piece.partNameFrench,
          vehicleModel: piece.vehicleModel,
          quantity: piece.quantity,
          createdAt: piece.createdAt.toISOString(),
          updatedAt: piece.updatedAt.toISOString(),
          commandeLocalId: piece.commandeLocalId,
        })),
      },
    };

    return { success: true, data: serializedRapport };
  } catch (error) {
    console.error("Error fetching rapport verification details:", error);
    return { success: false, error: "Failed to fetch rapport verification details" };
  }
}

export async function getVerificationSparesByConteneur() {
  try {
    const verificationConteneurs = await prisma.verificationConteneur.findMany({
      include: {
        conteneur: true,
        spares: {
          where: {
            etapeSparePart: "VERIFIER",
          },
          include: {
            subcase: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = verificationConteneurs.map((verification) => ({
      id: verification.id,
      createdAt: verification.createdAt.toISOString(),
      updatedAt: verification.updatedAt.toISOString(),
      conteneur: {
        id: verification.conteneur.id,
        conteneurNumber: verification.conteneur.conteneurNumber,
        sealNumber: verification.conteneur.sealNumber,
        etapeConteneur: verification.conteneur.etapeConteneur,
        isVerified: verification.conteneur.isVerified,
        createdAt: verification.conteneur.createdAt.toISOString(),
        updatedAt: verification.conteneur.updatedAt.toISOString(),
        dateEmbarquement: verification.conteneur.dateEmbarquement?.toISOString() || null,
        dateArriveProbable: verification.conteneur.dateArriveProbable?.toISOString() || null,
      },
      spares: verification.spares.map((spare) => ({
        id: spare.id,
        partCode: spare.partCode,
        partName: spare.partName,
        partNameFrench: spare.partNameFrench,
        verificationName: spare.verificationName,
        quantity: spare.quantity,
        etapeSparePart: spare.etapeSparePart,
        statusVerification: spare.statusVerification,
        createdAt: spare.createdAt.toISOString(),
        updatedAt: spare.updatedAt.toISOString(),
        commandeId: spare.commandeId,
        subcaseId: spare.subcaseId,
        subcaseNumber: spare.subcase?.subcaseNumber || null,
      })),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching verification spares by conteneur:", error);
    return { success: false, error: "Failed to fetch verification spares by conteneur" };
  }
}

export async function getConteneursVerifies() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: EtapeConteneur.VERIFIER
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: {
          include: {
            spareParts: true,
            tools: true
          }
        },
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs verifies:", error);
    return { success: false, error: "Failed to fetch conteneurs verifies" };
  }
}

export async function getConteneursTransite() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "TRANSITE"
      },
      include: {
        commandes: {
          include: {
            client: true,
            clientEntreprise: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects in commandes
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => {
        let prixUnitaireFinal: number | null = null;
        const prixRaw = commande.prix_unitaire;
        
        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          try {
            if (typeof prixRaw === 'number') {
              prixUnitaireFinal = prixRaw;
            } else if (typeof prixRaw === 'string') {
              prixUnitaireFinal = parseFloat(prixRaw);
            } else if (prixRaw && typeof prixRaw === 'object') {
              if ('constructor' in prixRaw && prixRaw.constructor && typeof prixRaw.constructor === 'function' && prixRaw.constructor.name === 'Decimal') {
                try {
                  const str = String(prixRaw);
                  prixUnitaireFinal = parseFloat(str);
                } catch {
                  prixUnitaireFinal = null;
                }
              } else if ('toNumber' in prixRaw && typeof (prixRaw as HasToNumber).toNumber === 'function') {
                prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
              } else if ('toString' in prixRaw && typeof (prixRaw as HasToString).toString === 'function') {
                const str = (prixRaw as HasToString).toString();
                prixUnitaireFinal = parseFloat(str);
              }
            }
          } catch {
            prixUnitaireFinal = null;
          }
        }
        
        return {
          ...commande,
          prix_unitaire: prixUnitaireFinal,
          date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
          createdAt: commande.createdAt.toISOString(),
          updatedAt: commande.updatedAt.toISOString(),
          clientEntreprise: commande.clientEntreprise,
        };
      }),
      subcases: conteneur.subcases,
      verifications: conteneur.verifications,
      voitures: conteneur.voitures,
    }));
    
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
        subcase: {
          conteneurId: conteneurId
        }
      },
      data: {
        etapeSparePart: 'RENSEIGNE'
      }
    });

    // Update conteneur status to RENSEIGNE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: 'RENSEIGNE'
      }
    });

    // Update all commandes in this conteneur to RENSEIGNEE
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId
      },
      data: {
        etapeCommande: 'RENSEIGNEE'
      }
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
        etapeSparePart: "RANGE"
      },
      include: {
        commande: {
          include: {
            voitureModel: true,
            client: true
          }
        },
        voiture: {
          include: {
            voitureModel: true,
            commande: {
              include: {
                client: true
              }
            }
          }
        },
        Storage: true,
        subcase: {
          include: {
            conteneur: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
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
        commandes: {
          some: {
            etapeCommande: "VALIDE"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "VALIDE"
          },
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs with VALIDE commandes:", error);
    return { success: false, error: "Failed to fetch conteneurs with VALIDE commandes" };
  }
}

export async function getConteneursTransiteNonRenseigne() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "TRANSITE_NON_RENSEIGNE",
        commandes: {
          every: {
            etapeCommande: "TRANSITE_NON_RENSEIGNE"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "TRANSITE_NON_RENSEIGNE"
          },
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => {
        let prixUnitaireFinal: number | null = null;
        const prixRaw = commande.prix_unitaire;
        
        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          try {
            if (typeof prixRaw === 'number') {
              prixUnitaireFinal = prixRaw;
            } else if (typeof prixRaw === 'string') {
              prixUnitaireFinal = parseFloat(prixRaw);
            } else if (prixRaw && typeof prixRaw === 'object') {
              if ('constructor' in prixRaw && prixRaw.constructor && typeof prixRaw.constructor === 'function' && prixRaw.constructor.name === 'Decimal') {
                try {
                  const str = String(prixRaw);
                  prixUnitaireFinal = parseFloat(str);
                } catch {
                  prixUnitaireFinal = null;
                }
              } else if ('toNumber' in prixRaw && typeof (prixRaw as HasToNumber).toNumber === 'function') {
                prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
              } else if ('toString' in prixRaw && typeof (prixRaw as HasToString).toString === 'function') {
                const str = (prixRaw as HasToString).toString();
                prixUnitaireFinal = parseFloat(str);
              }
            }
          } catch {
            prixUnitaireFinal = null;
          }
        }
        
        return {
          ...commande,
          prix_unitaire: prixUnitaireFinal,
          date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
          createdAt: commande.createdAt.toISOString(),
          updatedAt: commande.updatedAt.toISOString(),
          voitureModel: commande.voitureModel ? {
            ...commande.voitureModel,
            createdAt: commande.voitureModel.createdAt instanceof Date ? commande.voitureModel.createdAt.toISOString() : commande.voitureModel.createdAt,
            updatedAt: commande.voitureModel.updatedAt instanceof Date ? commande.voitureModel.updatedAt.toISOString() : commande.voitureModel.updatedAt,
          } : null,
          client: commande.client ? {
            ...commande.client,
            createdAt: commande.client.createdAt instanceof Date ? commande.client.createdAt.toISOString() : commande.client.createdAt,
            updatedAt: commande.client.updatedAt instanceof Date ? commande.client.updatedAt.toISOString() : commande.client.updatedAt,
          } : null,
          clientEntreprise: commande.clientEntreprise ? {
            ...commande.clientEntreprise,
            createdAt: commande.clientEntreprise.createdAt instanceof Date ? commande.clientEntreprise.createdAt.toISOString() : commande.clientEntreprise.createdAt,
            updatedAt: commande.clientEntreprise.updatedAt instanceof Date ? commande.clientEntreprise.updatedAt.toISOString() : commande.clientEntreprise.updatedAt,
          } : null,
        };
      }),
    }));
    
    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs transite_non_renseigne:", error);
    return { success: false, error: "Failed to fetch conteneurs transite_non_renseigne" };
  }
}

export async function getConteneursTransiteDejaRenseigne() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "TRANSITE_DEJA_RENSEIGNE",
        commandes: {
          every: {
            etapeCommande: "TRANSITE_DEJA_RENSEIGNE"
          },
          some: {
            etapeCommande: "TRANSITE_DEJA_RENSEIGNE"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "TRANSITE_DEJA_RENSEIGNE"
          },
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Decimal values and Date objects
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      id: conteneur.id,
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages,
      grossWeight: conteneur.grossWeight,
      netWeight: conteneur.netWeight,
      stuffingMap: conteneur.stuffingMap,
      etapeConteneur: String(conteneur.etapeConteneur),
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => {
        let prixUnitaireFinal: number | null = null;
        const prixRaw = commande.prix_unitaire;
        
        if (prixRaw === null || prixRaw === undefined) {
          prixUnitaireFinal = null;
        } else {
          try {
            if (typeof prixRaw === 'number') {
              prixUnitaireFinal = prixRaw;
            } else if (typeof prixRaw === 'string') {
              prixUnitaireFinal = parseFloat(prixRaw);
            } else if (prixRaw && typeof prixRaw === 'object') {
              if ('constructor' in prixRaw && prixRaw.constructor && typeof prixRaw.constructor === 'function' && prixRaw.constructor.name === 'Decimal') {
                try {
                  const str = String(prixRaw);
                  prixUnitaireFinal = parseFloat(str);
                } catch {
                  prixUnitaireFinal = null;
                }
              } else if ('toNumber' in prixRaw && typeof (prixRaw as HasToNumber).toNumber === 'function') {
                prixUnitaireFinal = (prixRaw as HasToNumber).toNumber();
              } else if ('toString' in prixRaw && typeof (prixRaw as HasToString).toString === 'function') {
                const str = (prixRaw as HasToString).toString();
                prixUnitaireFinal = parseFloat(str);
              }
            }
          } catch {
            prixUnitaireFinal = null;
          }
        }
        
        return {
          ...commande,
          prix_unitaire: prixUnitaireFinal,
          date_livraison: commande.date_livraison ? commande.date_livraison.toISOString() : null,
          createdAt: commande.createdAt.toISOString(),
          updatedAt: commande.updatedAt.toISOString(),
          voitureModel: commande.voitureModel ? {
            ...commande.voitureModel,
            createdAt: commande.voitureModel.createdAt instanceof Date ? commande.voitureModel.createdAt.toISOString() : commande.voitureModel.createdAt,
            updatedAt: commande.voitureModel.updatedAt instanceof Date ? commande.voitureModel.updatedAt.toISOString() : commande.voitureModel.updatedAt,
          } : null,
          client: commande.client ? {
            ...commande.client,
            createdAt: commande.client.createdAt instanceof Date ? commande.client.createdAt.toISOString() : commande.client.createdAt,
            updatedAt: commande.client.updatedAt instanceof Date ? commande.client.updatedAt.toISOString() : commande.client.updatedAt,
          } : null,
          clientEntreprise: commande.clientEntreprise ? {
            ...commande.clientEntreprise,
            createdAt: commande.clientEntreprise.createdAt instanceof Date ? commande.clientEntreprise.createdAt.toISOString() : commande.clientEntreprise.createdAt,
            updatedAt: commande.clientEntreprise.updatedAt instanceof Date ? commande.clientEntreprise.updatedAt.toISOString() : commande.clientEntreprise.updatedAt,
          } : null,
        };
      }),
    }));
    
    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs transite_deja_renseigne:", error);
    return { success: false, error: "Failed to fetch conteneurs transite_deja_renseigne" };
  }
}
