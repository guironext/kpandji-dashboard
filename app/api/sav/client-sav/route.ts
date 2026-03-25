import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = await prisma.clientSAV.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error("API getClientSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, prenom, email, contact, entreprise, localisation, secteur_activite } = body;

    if (!nom || !prenom || !contact) {
      return NextResponse.json(
        { success: false, error: "Nom, prénom et contact sont requis" },
        { status: 400 }
      );
    }

    const client = await prisma.clientSAV.create({
      data: {
        nom,
        prenom,
        email: email || null,
        contact,
        entreprise: entreprise || null,
        localisation: localisation || null,
        secteur_activite: secteur_activite || null,
      },
    });
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("API createClientSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 }
    );
  }
}
