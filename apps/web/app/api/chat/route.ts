import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
}

const MAX_CHAT_HISTORY = 100;

// GET - Fetch recent chat messages
export async function GET() {
  try {
    const { rows } = await query<ChatMessage>`
      SELECT id, username, message, timestamp
      FROM chat_messages
      ORDER BY timestamp DESC
      LIMIT ${MAX_CHAT_HISTORY}
    `;

    // Reverse to get chronological order (oldest first)
    const messages = rows.reverse();

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new chat message
export async function POST(request: Request) {
  try {
    const { username, message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const chatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: username || "Anonymous",
      message: message.trim(),
      timestamp: new Date(),
    };

    await query`
      INSERT INTO chat_messages (id, username, message, timestamp)
      VALUES (${chatMessage.id}, ${chatMessage.username}, ${chatMessage.message}, ${chatMessage.timestamp})
    `;

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.error("Error saving chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
