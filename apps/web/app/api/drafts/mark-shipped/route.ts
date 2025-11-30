import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUser } from "@propelauth/nextjs/server/app-router";

// POST /api/drafts/mark-shipped - Mark drafts as shipped
export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    
    // Try to get user from PropelAuth
    try {
      const user = await getUser();
      userId = user?.userId || null;
    } catch (e) {
      console.log("[Drafts Mark Shipped] Auth not available or failed:", e);
    }

    const body = await request.json();
    const { template, gameDescription, userId: bodyUserId } = body;

    // Use userId from body if auth failed
    if (!userId) {
      userId = bodyUserId;
    }
    
    if (!userId || !template || !gameDescription) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Mark matching drafts as shipped
    await query`
      UPDATE drafts 
      SET is_shipped = TRUE
      WHERE user_id = ${userId} 
        AND template = ${template}
        AND game_description = ${gameDescription}
        AND is_shipped = FALSE
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking draft as shipped:", error);
    return NextResponse.json(
      { error: "Failed to mark draft as shipped" },
      { status: 500 }
    );
  }
}

