import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Game } from "@/lib/types";
import { getUser } from "@propelauth/nextjs/server/app-router";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, code } = body;

    // Get the authenticated user
    const user = await getUser();
    const creatorId = user?.userId || null;
    const creatorEmail = user?.email || null;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    // Validate that the code has the required structure
    // Check for initGameClient function
    if (!code.includes('function initGameClient')) {
      return NextResponse.json(
        { error: "Code must define initGameClient function" },
        { status: 400 }
      );
    }

    // Check for serverLogic
    if (!code.includes('const serverLogic') && !code.includes('var serverLogic')) {
      return NextResponse.json(
        { error: "Code must define serverLogic constant" },
        { status: 400 }
      );
    }

    // Check for unique name
    const existing = await query`SELECT id FROM games WHERE name = ${name}`;
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Game name already taken" },
        { status: 409 }
      );
    }

    const { rows } = await query<Game>`
      INSERT INTO games (name, description, code, creator_id, creator_email)
      VALUES (${name}, ${description}, ${code}, ${creatorId}, ${creatorEmail})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Create game error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
