import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Game } from "@/lib/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> | { name: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const params = await Promise.resolve(context.params);
    // Decode the URL-encoded name (e.g., "snake%20awesome" -> "snake awesome")
    const name = decodeURIComponent(params.name);

    if (!name) {
      return NextResponse.json(
        { error: "Game name is required" },
        { status: 400 }
      );
    }

    const { rows } = await query<Game>`
      SELECT * FROM games WHERE name = ${name}
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
    // Await params if it's a Promise (Next.js 15+)
    const params = await Promise.resolve(context.params);
    // Decode the URL-encoded name (e.g., "snake%20awesome" -> "snake awesome")
    const name = decodeURIComponent(params.name);
    const body = await request.json();
    const { code, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Game name is required" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Validate that the code has the required structure
    if (!code.includes('function initGameClient')) {
      return NextResponse.json(
        { error: "Code must define initGameClient function" },
        { status: 400 }
      );
    }

    if (!code.includes('const serverLogic') && !code.includes('var serverLogic')) {
      return NextResponse.json(
        { error: "Code must define serverLogic constant" },
        { status: 400 }
      );
    }

    const { rows } = await query<Game>`
      UPDATE games
      SET code = ${code}, description = ${description || null}
      WHERE name = ${name}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Update game error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
