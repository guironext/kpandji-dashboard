import { NextRequest, NextResponse } from "next/server";
import { executeWithRetry, prisma } from "@/lib/prisma";
import {
  pieceSAVFindByIdRaw,
  pieceSAVSwapDiagnosticReplaceRaw,
  pieceSAVUpdateDiagnosticSortieRaw,
  pieceSAVUpdateReparationSortieRaw,
} from "@/lib/pieceSavMouvementSql";

export const dynamic = "force-dynamic";

type MouvementType = "ENTREE" | "SORTIE";

function prismaKnownRequestCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  const c = (error as { code?: unknown }).code;
  return typeof c === "string" ? c : undefined;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetPieceId } = await params;
    const body = await request.json();
    const type = body?.type as MouvementType | undefined;
    const quantite = body?.quantite;
    const reparationIdRaw = body?.reparationId;
    const diagnosticArriveeIdRaw = body?.diagnosticArriveeId;
    const detailDiagnosticIdRaw = body?.detailDiagnosticId;
    const voitureSAVIdRaw = body?.voitureSAVId;
    const replacePieceIdRaw = body?.replacePieceId;

    if (type !== "ENTREE" && type !== "SORTIE") {
      return NextResponse.json(
        { success: false, error: "Type de mouvement invalide (ENTREE ou SORTIE)" },
        { status: 400 }
      );
    }

    const n =
      typeof quantite === "string" ? parseInt(quantite, 10) : Number(quantite);
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      return NextResponse.json(
        {
          success: false,
          error: "La quantité doit être un entier strictement positif",
        },
        { status: 400 }
      );
    }

    const existing = await executeWithRetry(() =>
      prisma.pieceSAV.findUnique({ where: { id: targetPieceId } })
    );
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Pièce introuvable" },
        { status: 404 }
      );
    }

    if (type === "ENTREE") {
      const piece = await prisma.pieceSAV.update({
        where: { id: targetPieceId },
        data: {
          quantite_entree: existing.quantite_entree + n,
          quantite_restante: existing.quantite_restante + n,
        },
      });
      return NextResponse.json({ success: true, data: piece });
    }

    // SORTIE — soit réparation, soit diagnostic d'arrivée (atelier SAV)
    const reparationId =
      typeof reparationIdRaw === "string" && reparationIdRaw.trim()
        ? reparationIdRaw.trim()
        : null;
    const diagnosticArriveeId =
      typeof diagnosticArriveeIdRaw === "string" && diagnosticArriveeIdRaw.trim()
        ? diagnosticArriveeIdRaw.trim()
        : null;

    const hasReparation = Boolean(reparationId);
    const hasDiagnostic = Boolean(diagnosticArriveeId);

    if (!hasReparation && !hasDiagnostic) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Indiquez une réparation ou un diagnostic d'arrivée pour la sortie",
        },
        { status: 400 }
      );
    }
    if (hasReparation && hasDiagnostic) {
      return NextResponse.json(
        {
          success: false,
          error: "Choisissez soit une réparation, soit un diagnostic, pas les deux",
        },
        { status: 400 }
      );
    }

    if (hasReparation) {
      const reparation = await prisma.reparation.findUnique({
        where: { id: reparationId! },
      });
      if (!reparation) {
        return NextResponse.json(
          { success: false, error: "Réparation introuvable" },
          { status: 404 }
        );
      }

      if (existing.quantite_restante < n) {
        return NextResponse.json(
          {
            success: false,
            error: `Stock insuffisant (restant : ${existing.quantite_restante})`,
          },
          { status: 400 }
        );
      }

      await pieceSAVUpdateReparationSortieRaw(
        targetPieceId,
        existing.quantite_sortie + n,
        existing.quantite_restante - n,
        reparationId!
      );

      const piece = await prisma.pieceSAV.findUnique({ where: { id: targetPieceId } });
      return NextResponse.json({ success: true, data: piece });
    }

    // Diagnostic (SQL brut : champs detailDiagnostic / quantiteSortieDetail absents du client Prisma généré)
    const diagnosticArriveeIdResolved = diagnosticArriveeId!;
    if (typeof voitureSAVIdRaw !== "string" || !voitureSAVIdRaw.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiant du véhicule SAV requis pour une sortie liée au diagnostic",
        },
        { status: 400 }
      );
    }
    if (typeof detailDiagnosticIdRaw !== "string" || !detailDiagnosticIdRaw.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Ligne de diagnostic (detailDiagnosticId) requise",
        },
        { status: 400 }
      );
    }
    const detailDiagnosticId = detailDiagnosticIdRaw.trim();
    const voitureSAVId = voitureSAVIdRaw.trim();

    const diagnostic = await prisma.diagnosticArrivee.findUnique({
      where: { id: diagnosticArriveeIdResolved },
      include: { voitureSAV: { select: { id: true } } },
    });
    if (!diagnostic) {
      return NextResponse.json(
        { success: false, error: "Diagnostic d'arrivée introuvable" },
        { status: 404 }
      );
    }
    if (diagnostic.voitureSAV.id !== voitureSAVId) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce diagnostic ne correspond pas au véhicule sélectionné",
        },
        { status: 400 }
      );
    }

    const detail = await prisma.detailDiagnostic.findUnique({
      where: { id: detailDiagnosticId },
    });
    if (!detail || detail.diagnosticArriveeId !== diagnosticArriveeIdResolved) {
      return NextResponse.json(
        {
          success: false,
          error: "Le détail diagnostic ne correspond pas au diagnostic choisi",
        },
        { status: 400 }
      );
    }

    const replacePieceId =
      typeof replacePieceIdRaw === "string" && replacePieceIdRaw.trim()
        ? replacePieceIdRaw.trim()
        : null;

    if (replacePieceId) {
      const oldPiece = await pieceSAVFindByIdRaw(replacePieceId);
      if (!oldPiece) {
        return NextResponse.json(
          { success: false, error: "Pièce à remplacer introuvable" },
          { status: 404 }
        );
      }
      if (
        oldPiece.detailDiagnosticId !== detailDiagnosticId ||
        oldPiece.diagnosticArriveeId !== diagnosticArriveeIdResolved
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "La pièce à remplacer ne correspond pas à cette ligne de diagnostic",
          },
          { status: 400 }
        );
      }

      const oldQty = oldPiece.quantiteSortieDetail ?? 0;

      if (replacePieceId === targetPieceId) {
        const delta = n - oldQty;
        if (delta > 0 && existing.quantite_restante < delta) {
          return NextResponse.json(
            {
              success: false,
              error: `Stock insuffisant (restant : ${existing.quantite_restante}, variation demandée : +${delta})`,
            },
            { status: 400 }
          );
        }

        await pieceSAVUpdateDiagnosticSortieRaw(targetPieceId, {
          quantite_sortie: existing.quantite_sortie + delta,
          quantite_restante: existing.quantite_restante - delta,
          diagnosticArriveeId: diagnosticArriveeIdResolved,
          detailDiagnosticId,
          quantiteSortieDetail: n,
        });
        const piece = await prisma.pieceSAV.findUnique({ where: { id: targetPieceId } });
        return NextResponse.json({ success: true, data: piece });
      }

      const newSortieOld = oldPiece.quantite_sortie - oldQty;
      const newRestOld = oldPiece.quantite_restante + oldQty;
      const swapped = await pieceSAVSwapDiagnosticReplaceRaw({
        replacePieceId,
        newSortieOld,
        newRestOld,
        targetPieceId,
        n,
        diagnosticArriveeId: diagnosticArriveeIdResolved,
        detailDiagnosticId,
      });
      if (swapped === 0) {
        const fresh = await pieceSAVFindByIdRaw(targetPieceId);
        if (!fresh) {
          return NextResponse.json(
            { success: false, error: "Pièce cible introuvable" },
            { status: 404 }
          );
        }
        return NextResponse.json(
          {
            success: false,
            error: `Stock insuffisant sur la nouvelle pièce (restant : ${fresh.quantite_restante})`,
          },
          { status: 400 }
        );
      }

      const piece = await prisma.pieceSAV.findUnique({ where: { id: targetPieceId } });
      return NextResponse.json({ success: true, data: piece });
    }

    if (existing.quantite_restante < n) {
      return NextResponse.json(
        {
          success: false,
          error: `Stock insuffisant (restant : ${existing.quantite_restante})`,
        },
        { status: 400 }
      );
    }

    await pieceSAVUpdateDiagnosticSortieRaw(targetPieceId, {
      quantite_sortie: existing.quantite_sortie + n,
      quantite_restante: existing.quantite_restante - n,
      diagnosticArriveeId: diagnosticArriveeIdResolved,
      detailDiagnosticId,
      quantiteSortieDetail: n,
    });

    const piece = await prisma.pieceSAV.findUnique({ where: { id: targetPieceId } });
    return NextResponse.json({ success: true, data: piece });
  } catch (error) {
    console.error("API piece-sav mouvement POST error:", error);

    const code = prismaKnownRequestCode(error);
    const unreachable =
      (code === "P1001" || code === "P1017") ||
      (error instanceof Error &&
        /Can't reach database server|connection.*refused|getaddrinfo|timed out/i.test(
          error.message
        ));

    if (unreachable) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Base de données injoignable. Vérifiez que le projet Neon est démarré (non en pause), votre connexion réseau et la variable DATABASE_URL.",
        },
        { status: 503 }
      );
    }

    const msg =
      error instanceof Error ? error.message : "Erreur lors du mouvement";
    const isStock = msg.includes("Stock insuffisant");
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: isStock ? 400 : 500 }
    );
  }
}
