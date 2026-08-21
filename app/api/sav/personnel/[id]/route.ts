import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const personnelInclude = {
  groupePersonnelSAV: { select: { id: true, nom: true } },
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.personnelSAV.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Travailleur introuvable" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const nom = typeof body.nom === "string" ? body.nom.trim() : "";
    const prenom = typeof body.prenom === "string" ? body.prenom.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const telephone =
      typeof body.telephone === "string" ? body.telephone.trim() : "";
    const specialite =
      typeof body.specialite === "string" ? body.specialite.trim() : "";
    const groupePersonnelSAVId =
      typeof body.groupePersonnelSAVId === "string"
        ? body.groupePersonnelSAVId.trim()
        : "";

    if (!nom || !prenom || !email || !telephone || !specialite) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tous les champs sont requis : nom, prénom, email, téléphone, spécialité",
        },
        { status: 400 },
      );
    }

    if (!groupePersonnelSAVId) {
      return NextResponse.json(
        { success: false, error: "Veuillez sélectionner un groupe" },
        { status: 400 },
      );
    }

    const groupe = await prisma.groupePersonnelSAV.findUnique({
      where: { id: groupePersonnelSAVId },
      select: { id: true },
    });
    if (!groupe) {
      return NextResponse.json(
        { success: false, error: "Groupe introuvable" },
        { status: 400 },
      );
    }

    const personnel = await prisma.personnelSAV.update({
      where: { id },
      data: {
        nom,
        prenom,
        email,
        telephone,
        specialite,
        groupePersonnelSAVId,
      },
      include: personnelInclude,
    });

    return NextResponse.json({ success: true, data: personnel });
  } catch (error) {
    console.error("API personnel PATCH:", error);
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
    const existing = await prisma.personnelSAV.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Travailleur introuvable ou déjà supprimé" },
        { status: 404 },
      );
    }

    await prisma.personnelSAV.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API personnel DELETE:", error);
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
