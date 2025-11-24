import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }
    
    // Check against environment variable
    const validKey = process.env.SPECIAL_KEY;
    
    if (!validKey) {
      console.warn("SPECIAL_KEY environment variable is not set");
      return NextResponse.json(
        { error: "Special key verification not configured" },
        { status: 500 }
      );
    }
    
    if (key === validKey) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json(
        { error: "Invalid key" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Verify special key error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

