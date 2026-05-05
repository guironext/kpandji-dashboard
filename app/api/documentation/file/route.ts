import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const LOCAL_DOCS_PREFIX = "/externes/commercial-documentation/";

function resolveAllowedUpstream(rawUrl: string, requestOrigin: string): string | null {
	try {
		if (rawUrl.startsWith("/")) {
			if (!rawUrl.startsWith(LOCAL_DOCS_PREFIX)) return null;
			if (rawUrl.includes("..")) return null;
			return new URL(rawUrl, requestOrigin).href;
		}
		const u = new URL(rawUrl);
		if (u.protocol !== "https:") return null;
		const h = u.hostname.toLowerCase();
		if (
			h.endsWith(".public.blob.vercel-storage.com") ||
			h.endsWith(".blob.vercel-storage.com")
		) {
			return u.href;
		}
		return null;
	} catch {
		return null;
	}
}

function asciiFilename(name: string): string {
	const t = name.trim().replace(/[^\x20-\x7E]/g, "_");
	return t.slice(0, 200) || "document";
}

export async function GET(req: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const urlParam = req.nextUrl.searchParams.get("url");
	const nameParam = req.nextUrl.searchParams.get("name")?.trim() || "document";

	if (!urlParam) {
		return NextResponse.json({ error: "Missing url" }, { status: 400 });
	}

	const target = resolveAllowedUpstream(urlParam, req.nextUrl.origin);
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
