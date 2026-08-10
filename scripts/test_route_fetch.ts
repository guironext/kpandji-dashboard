import { prisma } from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

async function main() {
  console.log("Testing /api/commandes via fetch...");

  // 1. Get valid voitureModelId
  const model = await prisma.voitureModel.findFirst();
  if (!model) {
    console.error("No voitureModel found to test with.");
    return;
  }
  const voitureModelId = model.id;

  // 2. Prepare payload
  const defaultDeliveryDate = new Date();
  defaultDeliveryDate.setMonth(defaultDeliveryDate.getMonth() + 4);

  const payload = {
    voitureModelId: voitureModelId,
    couleur: "Noir Test",
    motorisation: "ESSENCE",
    transmission: "MANUEL",
    nbr_portes: "4",
    etapeCommande: "PROPOSITION",
    commandeFlag: "DISPONIBLE",
    clientId: null,
    clientEntrepriseId: null,
    date_livraison: defaultDeliveryDate.toISOString(),
    prix_unitaire: null,
  };

  try {
    // 3. Perform Fetch
    console.log("Fetching http://localhost:3000/api/commandes ...");
    const response = await fetch("http://localhost:3000/api/commandes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Response Status:", response.status);
    const text = await response.text();
    // console.log('Response Text:', text);

    if (!response.ok) {
      console.error("Request failed:", text);
      return;
    }

    const json = JSON.parse(text);
    console.log("Response JSON parsed successfully.");
    console.log("Created ID:", json.id);

    // 4. Verify Serialization of returned valid JSON
    if (json.date_livraison && typeof json.date_livraison !== "string") {
      console.error(
        "date_livraison is NOT a string:",
        typeof json.date_livraison,
      );
    }

    // Cleanup
    await prisma.commande.delete({ where: { id: json.id } });
    console.log("Cleanup complete.");
  } catch (error) {
    console.error("Fetch failed:", error);
    if (typeof error === "object" && error !== null && "cause" in error) {
      console.error("Cause:", (error as any).cause);
    }
  }
}

main();
