import { NextRequest, NextResponse } from "next/server";

/**
 * Sets a dev bypass cookie to skip Clerk when it fails to load.
 * Only works when NODE_ENV=development.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("__clerk_dev_bypass", "1", {
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: false, // So we can clear it from client if needed
    sameSite: "lax",
  });
  return response;
}
