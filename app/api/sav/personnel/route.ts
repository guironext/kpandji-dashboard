import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const personnels = await prisma.personnelSAV.findMany({
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      include: {
        groupePersonnelSAV: { select: { id: true, nom: true } },
      },
    });
    return NextResponse.json({ success: true, data: personnels });
  } catch (error) {
    console.error("API personnel GET:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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
    });
    if (!groupe) {
      return NextResponse.json(
        { success: false, error: "Groupe introuvable" },
        { status: 400 },
      );
    }

    const personnel = await prisma.personnelSAV.create({
      data: {
        nom,
        prenom,
        email,
        telephone,
        specialite,
        groupePersonnelSAVId,
      },
      include: {
        groupePersonnelSAV: { select: { id: true, nom: true } },
      },
    });

    return NextResponse.json({ success: true, data: personnel });
  } catch (error) {
    console.error("API personnel POST:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 },
    );
  }
}
