import { NextResponse } from "next/server";
import { GAME_TEMPLATES } from "@/lib/game-templates";

// This is a placeholder - you'll need to integrate with an actual LLM API
// Options: OpenAI, Anthropic Claude, or a local model

export async function POST(request: Request) {
  try {
    const { template, description, name } = await request.json();

    if (!template || !description) {
      return NextResponse.json(
        { error: "Template and description are required" },
        { status: 400 }
      );
    }

    const templateConfig = GAME_TEMPLATES[template as keyof typeof GAME_TEMPLATES];
    if (!templateConfig) {
      return NextResponse.json(
        { error: "Invalid template" },
        { status: 400 }
      );
    }

    // TODO: Integrate with LLM API (OpenAI, Anthropic, etc.)
    // For now, return the base template
    
    // Example with OpenAI (uncomment and add API key):
    /*
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a game developer. Generate complete, working game code.

CRITICAL: Follow this EXACT structure:

\`\`\`javascript
// CLIENT-SIDE CODE
function initGameClient(container, socket, roomId, emitAction) {
  // 1. Create your game UI
  // 2. Set up event listeners
  // 3. Return object with onStateUpdate method
  
  return {
    onStateUpdate: (state) => {
      // Update UI based on state
    }
  };
}

// SERVER-SIDE CODE
const serverLogic = {
  initialState: {
    // Your initial game state
  },
  moves: {
    actionName: (state, payload, playerId) => {
      // Mutate state directly
    }
  }
};
\`\`\`

RULES:
1. Must define initGameClient function
2. Must return object with onStateUpdate method
3. Must define const serverLogic
4. Must have initialState and moves in serverLogic
5. No import/export statements
6. No external dependencies unless in template
7. Mutate state directly in move functions

${templateConfig.prompt}

Base template:
${templateConfig.baseCode}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: description
        }
      ],
      temperature: 0.7,
    });

    const generatedCode = completion.choices[0].message.content;
    */

    // Placeholder response
    const generatedCode = templateConfig.baseCode;
    
    // Generate suggested name from description
    const suggestedName = name || description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    return NextResponse.json({
      code: generatedCode,
      suggestedName,
      suggestedDescription: description.substring(0, 100),
    });
  } catch (error) {
    console.error("Generate game error:", error);
    return NextResponse.json(
      { error: "Failed to generate game" },
      { status: 500 }
    );
  }
}

