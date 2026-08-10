import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nom, prenom, email, contact, entreprise, localisation, secteur_activite } = body;

    const updateData: Record<string, unknown> = {};
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (email !== undefined) updateData.email = email;
    if (contact !== undefined) updateData.contact = contact;
    if (entreprise !== undefined) updateData.entreprise = entreprise;
    if (localisation !== undefined) updateData.localisation = localisation;
    if (secteur_activite !== undefined) updateData.secteur_activite = secteur_activite;

    const client = await prisma.clientSAV.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("API updateClientSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.clientSAV.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteClientSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la suppression",
      },
      { status: 500 }
    );
  }
}
