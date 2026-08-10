import { readFile } from "fs/promises";
import { join } from "path";
import { head } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCAL_DOCS_PREFIX = "/externes/commercial-documentation/";

function normalizeFichierField(raw: string): string {
	let s = raw.trim().replace(/^["']|["']$/g, "");
	/* DB / imports sometimes omit leading slash */
	if (s.startsWith("externes/commercial-documentation/")) {
		s = `/${s}`;
	}
	return s;
}

function contentTypeFromPath(filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
	switch (ext) {
		case "pdf":
			return "application/pdf";
		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case "doc":
			return "application/msword";
		case "xlsx":
			return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		case "xls":
			return "application/vnd.ms-excel";
		case "pptx":
			return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "webp":
			return "image/webp";
		default:
			return "application/octet-stream";
	}
}

async function tryReadLocalPublicFile(
	publicPath: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
	if (!publicPath.startsWith(LOCAL_DOCS_PREFIX) || publicPath.includes("..")) {
		return null;
	}
	const relativeFromPublic = publicPath.replace(/^\/+/, "");
	const fullPath = join(process.cwd(), "public", relativeFromPublic);
	try {
		const buffer = await readFile(fullPath);
		return {
			buffer,
			contentType: contentTypeFromPath(relativeFromPublic),
		};
	} catch {
		return null;
	}
}

function resolveHttpsBlobUrl(rawUrl: string): string | null {
	try {
		const u = new URL(rawUrl.trim());
		if (u.protocol !== "https:") return null;
		const h = u.hostname.toLowerCase();
		const ok =
			h.endsWith(".vercel-storage.com") ||
			h.endsWith(".blob.core.windows.net");
		if (!ok) return null;
		return u.href;
	} catch {
		return null;
	}
}

const fetchInit: RequestInit = {
	redirect: "follow",
	cache: "no-store",
	headers: {
		Accept: "*/*",
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	},
};

/** Prefer authenticated Blob API when token is set; then plain fetch. Returns bytes or null. */
async function loadBlobBytes(blobUrl: string): Promise<{
	bytes: Buffer;
	contentType: string;
} | null> {
	const token = process.env.BLOB_READ_WRITE_TOKEN;

	const tryResponse = async (
		res: Response
	): Promise<{ bytes: Buffer; contentType: string } | null> => {
		if (!res.ok) return null;
		try {
			const bytes = Buffer.from(await res.arrayBuffer());
			if (bytes.length === 0) return null;
			return {
				bytes,
				contentType:
					res.headers.get("content-type") || "application/octet-stream",
			};
		} catch {
			return null;
		}
	};

	if (token) {
		try {
			const meta = await head(blobUrl, { token });
			const res = await fetch(meta.downloadUrl, fetchInit);
			const parsed = await tryResponse(res);
			if (parsed) return parsed;
		} catch {
			/* continue to anonymous fetch */
		}
	}

	const res = await fetch(blobUrl, fetchInit);
	return tryResponse(res);
}

function asciiFilename(name: string): string {
	const t = name.trim().replace(/[^\x20-\x7E]/g, "_");
	return t.slice(0, 200) || "document";
}

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await context.params;
	if (!id) {
		return NextResponse.json({ error: "Missing id" }, { status: 400 });
	}

	const nameParam = req.nextUrl.searchParams.get("name")?.trim() || "document";

	const doc = await prisma.documentation.findUnique({
		where: { id },
		select: { fichier: true },
	});
	if (!doc) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const fichier = normalizeFichierField(doc.fichier);

	if (fichier.startsWith(LOCAL_DOCS_PREFIX)) {
		const local = await tryReadLocalPublicFile(fichier);
		if (local) {
			const safe = asciiFilename(nameParam);
			const encoded = encodeURIComponent(nameParam);
			return new NextResponse(local.buffer, {
				status: 200,
				headers: {
					"Content-Type": local.contentType,
					"Content-Disposition": `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`,
					"Cache-Control": "private, no-store",
					"Content-Length": String(local.buffer.length),
				},
			});
		}
		return NextResponse.json(
			{
				error:
					"Fichier introuvable sur ce serveur. Les envois faits en développement (dossier local) ne sont pas sur la production : déposez le document à nouveau.",
			},
			{ status: 404 }
		);
	}

	const blobUrl = resolveHttpsBlobUrl(fichier);
	if (!blobUrl) {
		return NextResponse.json(
			{
				error:
					"Invalid url — le lien en base n'est ni un chemin /externes/... ni une URL https Vercel Blob (*.vercel-storage.com).",
				fichierPreview: fichier.slice(0, 120),
			},
			{ status: 400 }
		);
	}

	const loaded = await loadBlobBytes(blobUrl);
	if (!loaded) {
		return NextResponse.json(
			{
				error:
					"File not available — le stockage n'a pas renvoyé le fichier. Vérifiez BLOB_READ_WRITE_TOKEN sur Vercel, que le blob existe toujours, ou re-déposez le document.",
				detail:
					"Astuce : en production, les fichiers doivent être enregistrés avec Vercel Blob (pas seulement /public en local).",
			},
			{ status: 502 }
		);
	}

	const safe = asciiFilename(nameParam);
	const encoded = encodeURIComponent(nameParam);

	return new NextResponse(loaded.bytes, {
		status: 200,
		headers: {
			"Content-Type": loaded.contentType,
			"Content-Disposition": `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`,
			"Cache-Control": "private, no-store",
			"Content-Length": String(loaded.bytes.length),
		},
	});
}
