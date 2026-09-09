import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadPieceSavImage(file: File): Promise<string> {
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
    const filename = `pieces-sav/${timestamp}_${sanitizedName}`;
    const blob = await put(filename, file, { access: "public" });
    return blob.url;
  }

  const dir = join(process.cwd(), "public", "externes", "pieces-sav");
  await mkdir(dir, { recursive: true });
  const filename = `${timestamp}_${sanitizedName}`;
  const filepath = join(dir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));
  return `/externes/pieces-sav/${filename}`;
}
