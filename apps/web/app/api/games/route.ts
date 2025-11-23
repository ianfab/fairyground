import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Game } from "@/lib/types";
import { getUser } from "@propelauth/nextjs/server/app-router";
import { quickSecurityCheck } from "@/lib/security-check";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, code, preview = false, creatorId: clientCreatorId, creatorEmail: clientCreatorEmail, creatorUsername: clientCreatorUsername } = body;

    // Try to get user from server-side auth first
    const user = await getUser();

    // Use server-side user if available, otherwise fall back to client-provided
    const creatorId = user?.userId || clientCreatorId || null;
    const creatorEmail = user?.email || clientCreatorEmail || null;
    const creatorUsername = user?.username || clientCreatorUsername || null;

    console.log('Creating game with user info:', {
      userId: creatorId,
      email: creatorEmail,
      username: creatorUsername,
      source: user ? 'server-auth' : 'client-provided'
    });

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

    // Quick security check for obvious malicious patterns
    const quickCheck = quickSecurityCheck(code);
    if (quickCheck.blocked) {
      console.warn(`Quick security check blocked game creation: ${quickCheck.reason}`);
      return NextResponse.json(
        { 
          error: "Security check failed",
          details: quickCheck.reason,
          type: "security"
        },
        { status: 403 }
      );
    }

    console.log(`Game code passed quick security check`);
    
    // Note: AI-powered deep security analysis is disabled for new games to reduce cost and latency
    // The quick security check above catches most common malicious patterns

    // Check for unique name
    const existing = await query`SELECT id FROM games WHERE name = ${name}`;
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Game name already taken" },
        { status: 409 }
      );
    }

    const { rows } = await query<Game>`
      INSERT INTO games (name, description, code, creator_id, creator_email, creator_username, preview)
      VALUES (${name}, ${description}, ${code}, ${creatorId}, ${creatorEmail}, ${creatorUsername}, ${preview})
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

export async function GET(request: Request) {
  try {
    // Only return non-preview games for public listing
    const { rows } = await query<Game>`SELECT * FROM games WHERE preview = false ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Get games error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
