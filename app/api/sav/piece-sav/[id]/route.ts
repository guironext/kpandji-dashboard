import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadPieceSavImage } from "@/lib/sav/uploadPieceSavImage";

export const dynamic = "force-dynamic";

async function readPatchPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const image = formData.get("image");
    return {
      nom: formData.get("nom"),
      model_voiture: formData.get("model_voiture"),
      marque_piece: formData.get("marque_piece"),
      part_code: formData.get("part_code"),
      description: formData.get("description"),
      emplacement: formData.get("emplacement"),
      origine: formData.get("origine"),
      prix_achat: formData.get("prix_achat"),
      prix_vente: formData.get("prix_vente"),
      quantite_entree: formData.get("quantite_entree"),
      imageFile: image instanceof File && image.size > 0 ? image : null,
    };
  }
  const body = await request.json();
  return {
    nom: body.nom,
    model_voiture: body.model_voiture,
    marque_piece: body.marque_piece,
    part_code: body.part_code,
    description: body.description,
    emplacement: body.emplacement,
    origine: body.origine,
    prix_achat: body.prix_achat,
    prix_vente: body.prix_vente,
    quantite_entree: body.quantite_entree,
    imageFile: null as File | null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      nom,
      model_voiture,
      marque_piece,
      part_code,
      description,
      emplacement,
      origine,
      prix_achat,
      prix_vente,
      quantite_entree,
      imageFile,
    } = await readPatchPayload(request);

    const existing = await prisma.pieceSAV.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Pièce introuvable" },
        { status: 404 }
      );
    }

    const updateData: Parameters<typeof prisma.pieceSAV.update>[0]["data"] =
      {};

    if (nom !== undefined) {
      if (typeof nom !== "string" || !nom.trim()) {
        return NextResponse.json(
          { success: false, error: "Le nom de la pièce est requis" },
          { status: 400 }
        );
      }
      updateData.nom = nom.trim();
    }
    if (model_voiture !== undefined) {
      updateData.model_voiture =
        typeof model_voiture === "string" && model_voiture.trim()
          ? model_voiture.trim()
          : null;
    }
    if (marque_piece !== undefined) {
      updateData.marque_piece =
        typeof marque_piece === "string" && marque_piece.trim()
          ? marque_piece.trim()
          : null;
    }
    if (part_code !== undefined) {
      updateData.part_code =
        typeof part_code === "string" && part_code.trim()
          ? part_code.trim()
          : null;
    }
    if (description !== undefined) {
      updateData.description =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;
    }
    if (emplacement !== undefined) {
      updateData.emplacement =
        typeof emplacement === "string" && emplacement.trim()
          ? emplacement.trim()
          : null;
    }
    if (origine !== undefined) {
      if (typeof origine !== "string" || !origine.trim()) {
        updateData.origine = null;
      } else {
        const t = origine.trim();
        if (t !== "Achat local" && t !== "Usine") {
          return NextResponse.json(
            {
              success: false,
              error: "L'origine doit être « Achat local » ou « Usine »",
            },
            { status: 400 }
          );
        }
        updateData.origine = t;
      }
    }
    if (prix_achat !== undefined) {
      updateData.prix_achat =
        prix_achat != null && prix_achat !== ""
          ? String(prix_achat)
          : null;
    }
    if (prix_vente !== undefined) {
      updateData.prix_vente =
        prix_vente != null && prix_vente !== ""
          ? String(prix_vente)
          : null;
    }
    if (quantite_entree !== undefined) {
      if (quantite_entree != null && quantite_entree !== "") {
        const n = Number(quantite_entree);
        if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
          return NextResponse.json(
            {
              success: false,
              error: "La quantité entrée doit être un entier positif ou zéro",
            },
            { status: 400 }
          );
        }
        const delta = n - existing.quantite_entree;
        updateData.quantite_entree = n;
        updateData.quantite_restante = Math.max(
          0,
          existing.quantite_restante + delta
        );
      }
    }
    if (imageFile) {
      updateData.image = await uploadPieceSavImage(imageFile);
    }

    const piece = await prisma.pieceSAV.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: piece });
  } catch (error) {
    console.error("API piece-sav PATCH error:", error);
    const isNotFound =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025";
    return NextResponse.json(
      {
        success: false,
        error: isNotFound
          ? "Pièce introuvable"
          : error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour",
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.pieceSAV.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API piece-sav DELETE error:", error);
    const isNotFound =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025";
    return NextResponse.json(
      {
        success: false,
        error: isNotFound
          ? "Pièce introuvable ou déjà supprimée"
          : error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
