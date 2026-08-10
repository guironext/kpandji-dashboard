import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Old path kept so bookmarks and cached clients still reach the canonical download handler. */
export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	if (!id) {
		return NextResponse.json({ error: "Missing id" }, { status: 400 });
	}
	const dest = new URL(
		`/api/commercial-documentation/${encodeURIComponent(id)}`,
		req.nextUrl.origin
	);
	dest.search = req.nextUrl.searchParams.toString();
	return NextResponse.redirect(dest, 307);
}
