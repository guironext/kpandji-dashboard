import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Legacy query-style URL still used by cached clients:
 * GET /api/documentation/file?id=...&name=...
 * → canonical handler /api/commercial-documentation/[id]
 */
export async function GET(req: NextRequest) {
	const id = req.nextUrl.searchParams.get("id");
	if (!id) {
		return NextResponse.json({ error: "Missing id" }, { status: 400 });
	}
	const dest = new URL(
		`/api/commercial-documentation/${encodeURIComponent(id)}`,
		req.nextUrl.origin
	);
	const name = req.nextUrl.searchParams.get("name");
	if (name) {
		dest.searchParams.set("name", name);
	}
	return NextResponse.redirect(dest, 307);
}
