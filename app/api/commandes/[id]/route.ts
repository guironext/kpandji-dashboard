import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { etapeCommande } = body;

    if (!etapeCommande) {
      return NextResponse.json(
        { error: "etapeCommande est requis" },
        { status: 400 },
      );
    }

    // Check if the commande exists
    const existingCommande = await prisma.commande.findUnique({
      where: { id },
    });

    if (!existingCommande) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 },
      );
    }

    // Update the commande
    const updatedCommande = await prisma.commande.update({
      where: { id },
      data: { etapeCommande },
    });

    const serializedCommande = {
      ...updatedCommande,
      prix_unitaire: updatedCommande.prix_unitaire
        ? Number(updatedCommande.prix_unitaire)
        : null,
      date_livraison: updatedCommande.date_livraison.toISOString(),
      createdAt: updatedCommande.createdAt.toISOString(),
      updatedAt: updatedCommande.updatedAt.toISOString(),
    };

    return NextResponse.json(serializedCommande, { status: 200 });
  } catch (error) {
    console.error("Error updating commande:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if the commande exists
    const existingCommande = await prisma.commande.findUnique({
      where: { id },
    });

    if (!existingCommande) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 },
      );
    }

    // Delete the commande
    await prisma.commande.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Commande supprimée avec succès" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting commande:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la commande" },
      { status: 500 },
    );
  }
}
