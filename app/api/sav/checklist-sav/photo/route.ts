import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";
import {
  appendCheckListPhoto,
  attachCheckListPhotos,
  removeCheckListPhoto,
} from "@/lib/sav/checklistPhotos";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TYPES = ["RECEPTION", "PREPARATION", "FINALE"] as const;

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
    const filename = `checklist-sav/${timestamp}_${sanitizedName}`;
    const blob = await put(filename, file, { access: "public" });
    return blob.url;
  }

  const externesDir = join(process.cwd(), "public", "externes", "checklist-sav");
  await mkdir(externesDir, { recursive: true });
  const filename = `${timestamp}_${sanitizedName}`;
  const filepath = join(externesDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));
  return `/externes/checklist-sav/${filename}`;
}

/** POST: upload a car photo and append it to the checklist for this véhicule + type */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const voitureSAVId =
      typeof formData.get("voitureSAVId") === "string"
        ? (formData.get("voitureSAVId") as string).trim()
        : "";
    const typeRaw =
      typeof formData.get("type") === "string"
        ? (formData.get("type") as string)
        : "RECEPTION";
    const type = TYPES.includes(typeRaw as (typeof TYPES)[number])
      ? (typeRaw as (typeof TYPES)[number])
      : "RECEPTION";
    const image = formData.get("image");

    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 },
      );
    }
    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json(
        { success: false, error: "Une image est requise" },
        { status: 400 },
      );
    }

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      select: { id: true },
    });
    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }

    const imagePath = await uploadImage(image);

    const existing = await prisma.checkListsSAV.findFirst({
      where: { voitureSAVId, type },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    const checklistId = existing
      ? existing.id
      : (
          await prisma.checkListsSAV.create({
            data: {
              voitureSAVId,
              type,
              statut: "EN_COURS",
            },
            select: { id: true },
          })
        ).id;

    const photos = await appendCheckListPhoto(checklistId, imagePath);
    const saved = await attachCheckListPhotos(
      await prisma.checkListsSAV.findUnique({
        where: { id: checklistId },
      }),
    );

    return NextResponse.json({
      success: true,
      data: saved ? { ...saved, photos } : { id: checklistId, photos },
      url: imagePath,
    });
  } catch (error) {
    console.error("API checklist-sav photo POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'enregistrement de la photo",
      },
      { status: 500 },
    );
  }
}

/** DELETE: remove a photo URL from the checklist */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const voitureSAVId =
      typeof body.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const typeRaw = typeof body.type === "string" ? body.type : "RECEPTION";
    const type = TYPES.includes(typeRaw as (typeof TYPES)[number])
      ? (typeRaw as (typeof TYPES)[number])
      : "RECEPTION";

    if (!voitureSAVId || !url) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId et url requis" },
        { status: 400 },
      );
    }

    const existing = await prisma.checkListsSAV.findFirst({
      where: { voitureSAVId, type },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Check-list introuvable" },
        { status: 404 },
      );
    }

    const photos = await removeCheckListPhoto(existing.id, url);
    const saved = await attachCheckListPhotos(
      await prisma.checkListsSAV.findUnique({
        where: { id: existing.id },
      }),
    );

    return NextResponse.json({
      success: true,
      data: saved ? { ...saved, photos } : { id: existing.id, photos },
    });
  } catch (error) {
    console.error("API checklist-sav photo DELETE error:", error);
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
