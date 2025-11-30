import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUser } from "@propelauth/nextjs/server/app-router";

interface Draft {
  id: string;
  user_id: string;
  template: string;
  game_description: string;
  name: string | null;
  description: string | null;
  model: string;
  is_shipped: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/drafts - Get all drafts for the current user
export async function GET(request: Request) {
  try {
    let userId: string | null = null;
    
    // Try to get user from PropelAuth
    try {
      const user = await getUser();
      userId = user?.userId || null;
    } catch (e) {
      console.log("[Drafts GET] Auth not available or failed:", e);
    }
    
    // If no auth, try to get userId from query params (for guest users)
    if (!userId) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get("userId");
    }
    
    if (!userId) {
      // Return empty drafts instead of error to allow frontend to work
      console.log("[Drafts GET] No userId, returning empty drafts");
      return NextResponse.json({ drafts: [] });
    }

    const result = await query<Draft>`
      SELECT * FROM drafts 
      WHERE user_id = ${userId}
        AND is_shipped IS NOT TRUE
      ORDER BY updated_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ drafts: result.rows });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

// POST /api/drafts - Create or update a draft
export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    
    // Try to get user from PropelAuth
    try {
      const user = await getUser();
      userId = user?.userId || null;
    } catch (e) {
      console.log("[Drafts POST] Auth not available or failed:", e);
    }

    const body = await request.json();
    const { template, gameDescription, name, description, model, userId: bodyUserId } = body;

    // Use userId from body if auth failed
    if (!userId) {
      userId = bodyUserId;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "User identification required" },
        { status: 401 }
      );
    }

    if (!template || !gameDescription) {
      return NextResponse.json(
        { error: "Template and game description are required" },
        { status: 400 }
      );
    }

    // Create a new draft
    const result = await query<Draft>`
      INSERT INTO drafts (user_id, template, game_description, name, description, model, updated_at)
      VALUES (
        ${userId},
        ${template},
        ${gameDescription},
        ${name || null},
        ${description || null},
        ${model || 'gpt-5'},
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ draft: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

// DELETE /api/drafts - Delete a draft
export async function DELETE(request: Request) {
  try {
    let userId: string | null = null;
    
    // Try to get user from PropelAuth
    try {
      const user = await getUser();
      userId = user?.userId || null;
    } catch (e) {
      console.log("[Drafts DELETE] Auth not available or failed:", e);
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get("id");
    const urlUserId = searchParams.get("userId");

    // Use userId from URL if auth failed
    if (!userId) {
      userId = urlUserId;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "User identification required" },
        { status: 401 }
      );
    }

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    // Delete the draft only if it belongs to the user
    await query`
      DELETE FROM drafts 
      WHERE id = ${draftId} AND user_id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}

