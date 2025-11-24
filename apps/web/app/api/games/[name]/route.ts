import { NextResponse } from "next/server";
import { query, getGamesTableName } from "@/lib/db";
import { Game } from "@/lib/types";
import { getUser } from "@propelauth/nextjs/server/app-router";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const gameName = params.name;
    const tableName = getGamesTableName();

    const { rows } = await query<Game>(
      `SELECT * FROM ${tableName} WHERE name = $1`,
      gameName
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Get game error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    // Require authentication - no fallbacks
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to edit games." },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResponse = checkRateLimit(
      user.userId,
      "edit-game",
      RATE_LIMITS.EDIT_GAME
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const params = await Promise.resolve(context.params);
    const oldName = params.name;
    const body = await request.json();
    const { name, description, code, preview = false } = body;

    const userId = user.userId;

    // Check if user owns the game
    const tableName = getGamesTableName();
    const existing = await query(
      `SELECT creator_id, preview FROM ${tableName} WHERE name = $1`,
      oldName
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Allow update if user owns the game OR if it's a preview game (no owner check for previews)
    if (existing.rows[0].creator_id && existing.rows[0].creator_id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to update this game" },
        { status: 403 }
      );
    }

    // Update the game
    const { rows } = await query<Game>(
      `UPDATE ${tableName} SET name = $1, description = $2, code = $3, preview = $4 WHERE name = $5 RETURNING *`,
      name, description || '', code, preview, oldName
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Update game error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
