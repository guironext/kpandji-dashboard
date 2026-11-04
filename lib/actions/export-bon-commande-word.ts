"use server";

import { auth } from "@clerk/nextjs/server";
import {
  exportBonCommandeWord,
  type BonCommandeWordInput,
} from "@/lib/export-bon-commande-word";

export async function exportBonCommandeWordFile(input: BonCommandeWordInput & { documentTitle?: string }) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false as const, error: "Non autorisé" };
  }

  const buffer = await exportBonCommandeWord(input);
  const safe = (input.numero || "document").replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
  const prefix =
    input.documentTitle === "BON POUR ACCORD"
      ? "Bon_pour_accord"
      : input.documentTitle === "LETTRE DE COMMANDE"
        ? "Lettre_de_commande"
        : input.documentTitle === "APPEL D'OFFRE"
          ? "Appel_d_offre"
          : "Bon_de_commande";
  return {
    success: true as const,
    filename: `${prefix}_${safe}.docx`,
    base64: buffer.toString("base64"),
  };
}
