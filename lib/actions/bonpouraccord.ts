"use server";

import { prisma } from "@/lib/prisma";

export async function generateNextNumeroBonPourAccord(factureId: string) {
  try {
    const existing = await prisma.bonPourAccord.findUnique({
      where: { factureId },
    });

    if (existing) {
      return {
        success: true,
        data: { numero: existing.numero_bon_pour_accord },
      };
    }

    const latest = await prisma.bonPourAccord.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let nextNumero: string;

    if (!latest || latest.numero_bon_pour_accord === "") {
      nextNumero = "000001";
    } else {
      const match = latest.numero_bon_pour_accord.match(/(\d{6})$/);
      const lastNumero = match
        ? parseInt(match[1], 10)
        : parseInt(latest.numero_bon_pour_accord, 10);
      const nextNum = lastNumero + 1;
      nextNumero = nextNum.toString().padStart(6, "0");
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const fullNumero = `BPA - ${day}${month}${year}${nextNumero}`;

    await prisma.bonPourAccord.create({
      data: {
        id: crypto.randomUUID(),
        numero_bon_pour_accord: fullNumero,
        factureId,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: { numero: fullNumero },
    };
  } catch (error) {
    console.error("Error generating Bon pour Accord numero:", error);
    return {
      success: false,
      error: "Failed to generate numero",
    };
  }
}

export async function getBonPourAccordByFactureId(factureId: string) {
  try {
    const bonPourAccord = await prisma.bonPourAccord.findUnique({
      where: { factureId },
    });

    return {
      success: true,
      data: bonPourAccord
        ? { numero: bonPourAccord.numero_bon_pour_accord }
        : null,
    };
  } catch (error) {
    console.error("Error fetching Bon pour Accord:", error);
    return {
      success: false,
      error: "Failed to fetch Bon pour Accord",
    };
  }
}
