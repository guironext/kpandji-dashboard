import { NextRequest, NextResponse } from "next/server";
import {
  createProjectActor,
  getActorsByProject,
  deleteProjectActor,
} from "@/lib/actions/communication-actor";

// Runtime configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, department, job } = body;

    if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json(
        { success: false, error: "L'ID du projet est obligatoire." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom de l'acteur est obligatoire." },
        { status: 400 }
      );
    }

    if (!department || typeof department !== "string" || !department.trim()) {
      return NextResponse.json(
        { success: false, error: "Le département est obligatoire." },
        { status: 400 }
      );
    }

    if (!job || typeof job !== "string" || !job.trim()) {
      return NextResponse.json(
        { success: false, error: "Le poste est obligatoire." },
        { status: 400 }
      );
    }

    const result = await createProjectActor({
      projectId: projectId.trim(),
      name: name.trim(),
      department: department.trim(),
      job: job.trim(),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, actor: result.actor });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/communication/actors error:", error);
    
    // Check if it's a Prisma model error
    if (message.includes("communicationProjectActor") || message.includes("CommunicationProjectActor")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Le modèle de base de données n'est pas disponible. Veuillez exécuter 'npx prisma generate' puis 'npx prisma migrate dev'." 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: message || "Erreur lors de la création de l'acteur" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "L'ID du projet est obligatoire." },
        { status: 400 }
      );
    }

    const result = await getActorsByProject(projectId);

    return NextResponse.json({
      success: result.success,
      actors: result.actors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/communication/actors error:", error);
    return NextResponse.json(
      { success: false, error: message || "Erreur lors de la récupération des acteurs" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get("actorId");
    const projectId = searchParams.get("projectId");

    if (!actorId) {
      return NextResponse.json(
        { success: false, error: "L'ID de l'acteur est obligatoire." },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "L'ID du projet est obligatoire." },
        { status: 400 }
      );
    }

    const result = await deleteProjectActor(actorId, projectId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("DELETE /api/communication/actors error:", error);
    return NextResponse.json(
      { success: false, error: message || "Erreur lors de la suppression de l'acteur" },
      { status: 500 }
    );
  }
}
