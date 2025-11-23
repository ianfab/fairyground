import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    // For now, just return success
    // PropelAuth integration can be completed when needed
    const { count } = await request.json();
    
    console.log("Would update games count to:", count);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating games count:", error);
    return NextResponse.json(
      { error: "Failed to update games count" },
      { status: 500 }
    );
  }
}

