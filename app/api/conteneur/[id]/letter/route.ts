import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conteneurId = id;

    if (!conteneurId) {
      return NextResponse.json(
        { error: "Conteneur ID is required" },
        { status: 400 }
      );
    }

    // Path to the Abidjan.docx template file
    const filePath = join(process.cwd(), "public", "Abidjan.docx");

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Courrier_${conteneurId}.docx"`,
      },
    });
  } catch (error) {
    console.error("Error serving letter file:", error);
    return NextResponse.json(
      { error: "Failed to serve letter file" },
      { status: 500 }
    );
  }
}

