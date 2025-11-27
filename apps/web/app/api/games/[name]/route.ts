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
    const body = await request.json();
    const { name, description, code, preview = false, creatorId: bodyCreatorId } = body;

    // Try to authenticate using PropelAuth, but allow client-provided ID as fallback
    const user = await getUser();
    const userId = user?.userId || bodyCreatorId;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required or userId must be provided." },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResponse = checkRateLimit(
      userId,
      "edit-game",
      RATE_LIMITS.EDIT_GAME
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const params = await Promise.resolve(context.params);
    const oldName = params.name;

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
    // If name is not provided in the body, use the existing name (oldName)
    const newName = name || oldName;

    // If the name is changing, check if the new name is already taken
    if (newName !== oldName) {
      const nameCheck = await query(
        `SELECT id FROM ${tableName} WHERE name = $1`,
        newName
      );
      if (nameCheck.rows.length > 0) {
        return NextResponse.json(
          { error: "Game name already taken" },
          { status: 409 }
        );
      }
    }

    const { rows } = await query<Game>(
      `UPDATE ${tableName} SET name = $1, description = $2, code = $3, preview = $4 WHERE name = $5 RETURNING *`,
      newName, description || '', code, preview, oldName
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
