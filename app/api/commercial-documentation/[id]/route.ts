import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCAL_DOCS_PREFIX = "/externes/commercial-documentation/";

function resolveAllowedUpstream(
	rawUrl: string,
	requestOrigin: string
): string | null {
	try {
		if (rawUrl.startsWith("/")) {
			if (!rawUrl.startsWith(LOCAL_DOCS_PREFIX)) return null;
			if (rawUrl.includes("..")) return null;
			return new URL(rawUrl, requestOrigin).href;
		}
		const u = new URL(rawUrl);
		if (u.protocol !== "https:") return null;
		const h = u.hostname.toLowerCase();
		if (!h.endsWith(".vercel-storage.com")) return null;
		return u.href;
	} catch {
		return null;
	}
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

	const target = resolveAllowedUpstream(doc.fichier, req.nextUrl.origin);
	if (!target) {
		return NextResponse.json({ error: "Invalid url" }, { status: 400 });
	}

	const upstream = await fetch(target, {
		redirect: "follow",
		cache: "no-store",
	});

	if (!upstream.ok || !upstream.body) {
		return NextResponse.json(
			{ error: "File not available" },
			{ status: upstream.status === 404 ? 404 : 502 }
		);
	}

	const contentType =
		upstream.headers.get("content-type") || "application/octet-stream";
	const safe = asciiFilename(nameParam);
	const encoded = encodeURIComponent(nameParam);

	const headers: Record<string, string> = {
		"Content-Type": contentType,
		"Content-Disposition": `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`,
		"Cache-Control": "private, no-store",
	};
	const len = upstream.headers.get("content-length");
	if (len) headers["Content-Length"] = len;

	return new NextResponse(upstream.body, { status: 200, headers });
}
