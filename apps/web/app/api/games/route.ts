import { NextResponse } from "next/server";
import { query, getGamesTableName } from "@/lib/db";
import { Game } from "@/lib/types";
import { getUser } from "@propelauth/nextjs/server/app-router";
import { quickSecurityCheck } from "@/lib/security-check";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      code,
      preview = false,
      creatorId: bodyCreatorId,
      creatorEmail: bodyCreatorEmail,
      creatorUsername: bodyCreatorUsername,
      tags: bodyTags,
    } = body;

    // Try to authenticate using PropelAuth, but allow client-provided info as fallback
    const user = await getUser();
    
    const creatorId = user?.userId || bodyCreatorId;
    const creatorEmail = user?.email || bodyCreatorEmail;
    const creatorUsername = user?.username || bodyCreatorUsername;
    const tags: string[] | null =
      Array.isArray(bodyTags) && bodyTags.length > 0
        ? bodyTags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : null;

    if (!creatorId) {
      return NextResponse.json(
        { error: "Authentication required or creatorId must be provided." },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResponse = checkRateLimit(
      creatorId,
      "create-game",
      RATE_LIMITS.CREATE_GAME
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    console.log('Creating game with user info:', {
      userId: creatorId,
      email: creatorEmail,
      username: creatorUsername,
      authMethod: user ? 'server-auth' : 'client-fallback'
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
    const tableName = getGamesTableName();
    const existing = await query(
      `SELECT id FROM ${tableName} WHERE name = $1`,
      name
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Game name already taken" },
        { status: 409 }
      );
    }

    const { rows } = await query<Game>(
      `INSERT INTO ${tableName} (name, description, code, creator_id, creator_email, creator_username, preview, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, '{}'::text[])) RETURNING *`,
      name,
      description,
      code,
      creatorId,
      creatorEmail,
      creatorUsername,
      preview,
      tags
    );

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
    const tableName = getGamesTableName();
    const { rows } = await query<Game>(
      `SELECT * FROM ${tableName} WHERE preview = false ORDER BY created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Get games error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
