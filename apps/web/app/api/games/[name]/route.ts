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
    const {
      name,
      description,
      code,
      preview = false,
      creatorId: bodyCreatorId,
      tags: bodyTags,
      min_players_per_room: bodyMinPlayersPerRoom,
      max_players_per_room: bodyMaxPlayersPerRoom,
      has_win_condition: bodyHasWinCondition,
      can_join_late: bodyCanJoinLate,
    } = body;

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
      `SELECT creator_id, preview, tags, min_players_per_room, max_players_per_room, has_win_condition, can_join_late FROM ${tableName} WHERE name = $1`,
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

    // Compute updated tags – default to existing when not explicitly provided
    const existingRow = existing.rows[0] as any;
    const existingTags: string[] | null = existingRow.tags ?? null;
    const tags: string[] | null =
      Array.isArray(bodyTags) && bodyTags.length > 0
        ? bodyTags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : existingTags;

    // Compute updated room config – default to existing when not explicitly provided
    const existingMinPlayers: number =
      typeof existingRow.min_players_per_room === "number" && Number.isFinite(existingRow.min_players_per_room)
        ? Math.max(1, Math.floor(existingRow.min_players_per_room))
        : 2;
    const existingMaxPlayers: number =
      typeof existingRow.max_players_per_room === "number" && Number.isFinite(existingRow.max_players_per_room)
        ? Math.max(existingMinPlayers, Math.floor(existingRow.max_players_per_room))
        : 2;
    const existingHasWinCondition: boolean =
      typeof existingRow.has_win_condition === "boolean" ? existingRow.has_win_condition : true;
    const existingCanJoinLate: boolean =
      typeof existingRow.can_join_late === "boolean" ? existingRow.can_join_late : false;

    const minPlayersPerRoom =
      typeof bodyMinPlayersPerRoom === "number" && Number.isFinite(bodyMinPlayersPerRoom)
        ? Math.max(1, Math.floor(bodyMinPlayersPerRoom))
        : existingMinPlayers;
    const maxPlayersPerRoom =
      typeof bodyMaxPlayersPerRoom === "number" && Number.isFinite(bodyMaxPlayersPerRoom)
        ? Math.max(minPlayersPerRoom, Math.floor(bodyMaxPlayersPerRoom))
        : existingMaxPlayers;
    const hasWinCondition =
      typeof bodyHasWinCondition === "boolean" ? bodyHasWinCondition : existingHasWinCondition;
    const canJoinLate =
      typeof bodyCanJoinLate === "boolean" ? bodyCanJoinLate : existingCanJoinLate;

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
      `UPDATE ${tableName}
       SET
         name = $1,
         description = $2,
         code = $3,
         preview = $4,
         tags = COALESCE($5, '{}'::text[]),
         min_players_per_room = $6,
         max_players_per_room = $7,
         has_win_condition = $8,
         can_join_late = $9
       WHERE name = $10
       RETURNING *`,
      newName,
      description || "",
      code,
      preview,
      tags,
      minPlayersPerRoom,
      maxPlayersPerRoom,
      hasWinCondition,
      canJoinLate,
      oldName
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
