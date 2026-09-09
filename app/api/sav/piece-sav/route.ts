import { NextResponse } from "next/server";
import { executeWithRetry, prisma } from "@/lib/prisma";
import { uploadPieceSavImage } from "@/lib/sav/uploadPieceSavImage";

export const dynamic = "force-dynamic";

type PieceFields = {
  nom: unknown;
  model_voiture: unknown;
  marque_piece: unknown;
  part_code: unknown;
  description: unknown;
  emplacement: unknown;
  origine: unknown;
  prix_achat: unknown;
  prix_vente: unknown;
  quantite_entree: unknown;
  imageFile: File | null;
};

const ORIGINE_VALUES = ["Achat local", "Usine"] as const;

function parseOrigine(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) return null;
  const t = value.trim();
  return ORIGINE_VALUES.includes(t as (typeof ORIGINE_VALUES)[number])
    ? t
    : null;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function readPiecePayload(request: Request): Promise<PieceFields> {
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
    imageFile: null,
  };
}

export async function GET() {
  try {
    const pieces = await executeWithRetry(() =>
      prisma.pieceSAV.findMany({
        orderBy: [{ nom: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          nom: true,
          model_voiture: true,
          marque_piece: true,
          part_code: true,
          image: true,
          quantite_restante: true,
          quantite_sortie: true,
          interventionDiagnosticOffertId: true,
        },
      })
    );
    return NextResponse.json({ success: true, data: pieces });
  } catch (error) {
    console.error("API piece-sav GET error:", error);
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
    } = await readPiecePayload(request);

    if (typeof nom !== "string" || !nom.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Le nom de la pièce est requis",
        },
        { status: 400 }
      );
    }

    let qe = 0;
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
      qe = n;
    }

    const imagePath = imageFile ? await uploadPieceSavImage(imageFile) : null;

    const piece = await executeWithRetry(() =>
      prisma.pieceSAV.create({
        data: {
          nom: nom.trim(),
          quantite_entree: qe,
          quantite_restante: qe,
          model_voiture:
            typeof model_voiture === "string" && model_voiture.trim()
              ? model_voiture.trim()
              : null,
          marque_piece:
            typeof marque_piece === "string" && marque_piece.trim()
              ? marque_piece.trim()
              : null,
          part_code:
            typeof part_code === "string" && part_code.trim()
              ? part_code.trim()
              : null,
          description: optionalText(description),
          emplacement: optionalText(emplacement),
          origine: parseOrigine(origine) ?? null,
          image: imagePath,
          prix_achat:
            prix_achat != null && prix_achat !== ""
              ? String(prix_achat)
              : undefined,
          prix_vente:
            prix_vente != null && prix_vente !== ""
              ? String(prix_vente)
              : undefined,
        },
      })
    );

    return NextResponse.json({ success: true, data: piece });
  } catch (error) {
    console.error("API piece-sav POST error:", error);
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
