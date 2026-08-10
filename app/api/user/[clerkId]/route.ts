import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/actions/user";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  try {
    const { clerkId } = await params;
    
    // Try to get or create user using the server action
    const result = await getOrCreateUser(clerkId);
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "User not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result.data.id,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      email: result.data.email
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" }, 
      { status: 500 }
    );
  }
}