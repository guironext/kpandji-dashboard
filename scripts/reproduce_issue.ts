import { prisma } from "../lib/prisma";
import {
  getConteneursTransiteDejaRenseigne,
  getConteneursTransiteNonRenseigne,
} from "../lib/actions/conteneur"; // Import both
import { Decimal } from "@prisma/client/runtime/library";

async function cleanup(conteneurNumber: string) {
  const conteneur = await prisma.conteneur.findUnique({
    where: { conteneurNumber },
  });
  if (!conteneur) return;

  // Delete children manually because no Cascade on DB level
  await prisma.subcase.deleteMany({ where: { conteneurId: conteneur.id } });
  await prisma.verificationConteneur.deleteMany({
    where: { conteneurId: conteneur.id },
  });
  await prisma.voiture.deleteMany({ where: { conteneurId: conteneur.id } });
  await prisma.commande.deleteMany({ where: { conteneurId: conteneur.id } });

  // Finally delete conteneur
  await prisma.conteneur.delete({ where: { id: conteneur.id } });
  console.log("Cleaned up data for", conteneurNumber);
}

async function verifyResult(
  result: any,
  label: string,
  conteneurNumber: string,
) {
  if (result.success) {
    const data = result.data;
    const found = data.find((c: any) => c.conteneurNumber === conteneurNumber);

    if (found) {
      console.log(`[${label}] Found test conteneur.`);
      function scan(obj: any, path = "") {
        if (obj === null || obj === undefined) return;
        if (typeof obj !== "object") return;
        if (Array.isArray(obj)) {
          obj.forEach((item: any, index: number) =>
            scan(item, `${path}[${index}]`),
          );
          return;
        }
        const proto = Object.getPrototypeOf(obj);
        if (proto !== Object.prototype && proto !== null) {
          const desc = obj.constructor ? obj.constructor.name : "ukn";
          if (desc === "Decimal" || obj instanceof Decimal) {
            console.error(`[FAIL - ${label}] Found Decimal at ${path}: ${obj}`);
          }
          if (obj instanceof Date) {
            console.error(
              `[FAIL - ${label}] Found Date at ${path}: ${obj.toISOString()}`,
            );
          }
        }
        for (const key in obj) {
          scan(obj[key], `${path}.${key}`);
        }
      }
      scan(found);

      // Check JSON stringify
      try {
        const json = JSON.stringify(found);
        console.log(`[${label}] JSON Length:`, json.length);
      } catch (e) {
        console.error(`[FAIL - ${label}] JSON Stringify threw:`, e);
      }
    } else {
      console.log(`[${label}] Test conteneur not found (filtering?)`);
    }
  } else {
    console.error(`[FAIL - ${label}] Action Failed:`, result.error);
  }
}

async function main() {
  const conteneurNumber = "TEST-CONT-001";

  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error("No user found in DB");
      return;
    }
    const userId = user.id;

    // 1. Clean up
    await cleanup(conteneurNumber);

    // 2. Create Dummy Data - DEJA RENSEIGNE
    const conteneur = await prisma.conteneur.create({
      data: {
        conteneurNumber,
        etapeConteneur: "TRANSITE_DEJA_RENSEIGNE", // Target DEJA
        commandes: {
          create: {
            etapeCommande: "TRANSITE_DEJA_RENSEIGNE",
            date_livraison: new Date(),
            couleur: "Red",
            motorisation: "ESSENCE",
            transmission: "AUTOMATIQUE",
            nbr_portes: "4",
            prix_unitaire: 12345.67,
            client: {
              create: {
                nom: "Test Client",
                telephone: "123456789",
                userId: userId,
              },
            },
          },
        },
        subcases: {
          create: {
            subcaseNumber: "SC-001",
            tools: {
              create: {
                toolCode: "TOOL-01",
                toolName: "Hammer",
                quantity: 1,
              },
            },
            spareParts: {
              create: {
                partCode: "PART-01",
                partName: "Screw",
                quantity: 10,
              },
            },
          },
        },
        verifications: { create: {} },
        voitures: {
          create: {
            nbr_portes: "4",
            transmission: "AUTOMATIQUE",
            motorisation: "ESSENCE",
            couleur: "Blue",
            etatVoiture: "PARKING",
          },
        },
      },
    });
    console.log("Created dummy data for DEJA test:", conteneur.id);

    // 3. Test DEJA
    console.log("Testing DEJA...");
    const resultDeja = await getConteneursTransiteDejaRenseigne();
    await verifyResult(resultDeja, "DEJA", conteneurNumber);

    // 4. Update to NON RENSEIGNE
    await prisma.conteneur.update({
      where: { id: conteneur.id },
      data: { etapeConteneur: "TRANSITE_NON_RENSEIGNE" },
    });
    console.log("Updated to TRANSITE_NON_RENSEIGNE");

    // 5. Test NON
    console.log("Testing NON...");
    const resultNon = await getConteneursTransiteNonRenseigne();
    await verifyResult(resultNon, "NON", conteneurNumber);
  } catch (error) {
    console.error("Script Fatal Error:", error);
  } finally {
    try {
      await cleanup(conteneurNumber);
      console.log("Final cleanup done.");
    } catch (e) {
      console.error("Final cleanup failed", e);
    }
  }
}

main();
