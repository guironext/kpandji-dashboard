import { prisma } from "../lib/prisma";
import { getAllCommandesProposition } from "../lib/actions/commande";
import { Decimal } from "@prisma/client/runtime/library";

async function main() {
  console.log("Starting full verification of getAllCommandesProposition...");

  // 1. Create Dummy Data
  const voitureModel = await prisma.voitureModel.create({
    data: {
      id: crypto.randomUUID(),
      updatedAt: new Date(),
      model: "Test Model " + Date.now(),
      description: "Test Desc",
      // image: '...' // optional
    },
  });

  // Need a user for client
  let user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found, cannot create client.");
    return;
  }

  const client = await prisma.client.create({
    data: {
      nom: "Test Client",
      telephone: "123456789",
      userId: user.id,
    },
  });

  const commande = await prisma.commande.create({
    data: {
      id: crypto.randomUUID(),
      updatedAt: new Date(),
      etapeCommande: "PROPOSITION",
      commandeFlag: "DISPONIBLE",
      date_livraison: new Date(),
      couleur: "Red",
      motorisation: "ESSENCE",
      transmission: "AUTOMATIQUE",
      nbr_portes: "4",
      prix_unitaire: new Decimal("15000.50"),
      voitureModelId: voitureModel.id,
      clientId: client.id,
    },
  });

  console.log("Created dummy commande:", commande.id);

  try {
    // 2. call action
    const result = await getAllCommandesProposition();

    if (result.success) {
      const data = result.data ?? [];
      const found = data.find((c: any) => c.id === commande.id);

      if (found) {
        console.log("Found dummy commande in results.");

        // 3. Scan for issues
        let issues = 0;
        function scan(obj: any, path = "") {
          if (obj === null || obj === undefined) return;
          if (typeof obj !== "object") return;

          if (Array.isArray(obj)) {
            obj.forEach((item: any, i: number) => scan(item, `${path}[${i}]`));
            return;
          }

          const proto = Object.getPrototypeOf(obj);
          if (proto !== Object.prototype && proto !== null) {
            const desc = obj.constructor ? obj.constructor.name : "ukn";
            if (desc === "Decimal" || obj instanceof Decimal) {
              console.error(`[FAIL] Found Decimal at ${path}: ${obj}`);
              issues++;
            } else if (obj instanceof Date) {
              console.error(
                `[FAIL] Found Date at ${path}: ${obj.toISOString()}`,
              );
              issues++;
            }
          }

          for (const k in obj) {
            scan(obj[k], `${path}.${k}`);
          }
        }
        scan(found);

        if (issues === 0) {
          console.log("SUCCESS: No serialization issues found.");
        } else {
          console.error(`FAILED: Found ${issues} serialization issues.`);
        }
      } else {
        console.error("Dummy commande NOT found in results.");
      }
    } else {
      console.error("Action returned success=false:", result.error);
    }
  } catch (e) {
    console.error("Runtime error during action call:", e);
  } finally {
    // Cleanup
    try {
      await prisma.commande.delete({ where: { id: commande.id } });
      await prisma.client.delete({ where: { id: client.id } });
      await prisma.voitureModel.delete({ where: { id: voitureModel.id } });
      console.log("Cleanup complete.");
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
  }
}

main();
