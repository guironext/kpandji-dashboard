import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("L'image ne doit pas dépasser 10 Mo");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier doit être une image");
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const filename = `visuel-defaut/${timestamp}_${sanitizedName}`;
    const blob = await put(filename, file, { access: "public" });
    return blob.url;
  }

  const externesDir = join(process.cwd(), "public", "externes", "visuel-defaut");
  await mkdir(externesDir, { recursive: true });
  const filename = `${timestamp}_${sanitizedName}`;
  const filepath = join(externesDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));
  return `/externes/visuel-defaut/${filename}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const voitureSAVId = searchParams.get("voitureSAVId");
    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 }
      );
    }

    const visuelDefauts = await prisma.visuelDefaut.findMany({
      where: { voitureSAVId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: visuelDefauts });
  } catch (error) {
    console.error("API getVisuelDefaut error:", error);
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
    const formData = await request.formData();
    const voitureSAVId = formData.get("voitureSAVId") as string | null;
    const nom = (formData.get("nom") as string | null)?.trim();
    const description = (formData.get("description") as string | null)?.trim() || null;
    const image = formData.get("image");

    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 }
      );
    }
    if (!nom) {
      return NextResponse.json(
        { success: false, error: "Le nom est requis" },
        { status: 400 }
      );
    }
    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json(
        { success: false, error: "Une image est requise" },
        { status: 400 }
      );
    }

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
    });
    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 }
      );
    }

    const imagePath = await uploadImage(image);

    const visuelDefaut = await prisma.visuelDefaut.create({
      data: {
        nom,
        description,
        image: imagePath,
        voitureSAVId,
      },
    });

    return NextResponse.json({ success: true, data: visuelDefaut });
  } catch (error) {
    console.error("API createVisuelDefaut error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de l'enregistrement",
      },
      { status: 500 }
    );
  }
}
