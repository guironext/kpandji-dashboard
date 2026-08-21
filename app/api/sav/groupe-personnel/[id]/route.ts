import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const groupeSelect = {
  id: true,
  nom: true,
  chefGroupeId: true,
  createdAt: true,
  chefGroupe: {
    select: { id: true, nom: true, prenom: true },
  },
  _count: { select: { personnelSAVs: true } },
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.groupePersonnelSAV.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Groupe introuvable" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const nom =
      typeof body.nom === "string" ? body.nom.trim() : undefined;

    if (nom !== undefined && !nom) {
      return NextResponse.json(
        { success: false, error: "Le nom du groupe est requis" },
        { status: 400 },
      );
    }

    const hasChefField = Object.prototype.hasOwnProperty.call(
      body,
      "chefGroupeId",
    );
    let chefGroupeId: string | null | undefined;
    if (hasChefField) {
      const raw =
        typeof body.chefGroupeId === "string" ? body.chefGroupeId.trim() : "";
      chefGroupeId =
        !raw || raw === "__none__" || body.chefGroupeId === null ? null : raw;
    }

    if (chefGroupeId) {
      const chef = await prisma.personnelSAV.findUnique({
        where: { id: chefGroupeId },
        select: { id: true, groupeOuJeSuisChef: { select: { id: true } } },
      });
      if (!chef) {
        return NextResponse.json(
          { success: false, error: "Chef de groupe introuvable" },
          { status: 400 },
        );
      }
      if (chef.groupeOuJeSuisChef && chef.groupeOuJeSuisChef.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: "Cette personne est déjà chef d'un autre groupe",
          },
          { status: 400 },
        );
      }
    }

    const groupe = await prisma.groupePersonnelSAV.update({
      where: { id },
      data: {
        ...(nom !== undefined ? { nom } : {}),
        ...(hasChefField ? { chefGroupeId } : {}),
      },
      select: groupeSelect,
    });
    return NextResponse.json({ success: true, data: groupe });
  } catch (error) {
    console.error("API groupe-personnel PATCH:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.groupePersonnelSAV.findUnique({
      where: { id },
      select: { id: true, _count: { select: { personnelSAVs: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Groupe introuvable ou déjà supprimé" },
        { status: 404 },
      );
    }

    await prisma.groupePersonnelSAV.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API groupe-personnel DELETE:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      },
      { status: 500 },
    );
  }
}
