import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Game } from "@/lib/types";
import { getUser } from "@propelauth/nextjs/server/app-router";

export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const gameName = params.name;

    const { rows } = await query<Game>`
      SELECT * FROM games WHERE name = ${gameName}
    `;

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
    const params = await Promise.resolve(context.params);
    const oldName = params.name;
    const body = await request.json();
    const { name, description, code, preview = false, creatorId: clientCreatorId } = body;

    // Try to get user from server-side auth first, fallback to client-provided
    const user = await getUser();
    const userId = user?.userId || clientCreatorId;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user owns the game
    const existing = await query`SELECT creator_id, preview FROM games WHERE name = ${oldName}`;
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
    const { rows } = await query<Game>`
      UPDATE games
      SET name = ${name}, 
          description = ${description || ''}, 
          code = ${code},
          preview = ${preview}
      WHERE name = ${oldName}
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Update game error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
