import { query } from "../lib/db.js";

async function addChatTable() {
  try {
    console.log("Creating chat_messages table...");

    await query`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await query`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC)
    `;

    console.log("✓ Chat messages table created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating chat_messages table:", error);
    process.exit(1);
  }
}

addChatTable();
