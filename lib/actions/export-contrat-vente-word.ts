"use server";

import { auth } from "@clerk/nextjs/server";
import { exportContratVenteWord } from "@/lib/export-contrat-vente-word";
import type { ContratVenteContenu } from "@/lib/contrat-vente-document";

export async function exportContratVenteWordFile(input: ContratVenteContenu) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Non autorisé" };

  const buffer = await exportContratVenteWord(input);
  const safe = (input.acheteur || "document").replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
  return {
    success: true as const,
    filename: `Contrat_de_vente_${safe}.docx`,
    base64: buffer.toString("base64"),
  };
}
