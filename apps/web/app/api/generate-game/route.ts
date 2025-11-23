import { NextResponse } from "next/server";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { template, description, name, model, existingCode } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Check if this is an edit request (has existingCode but no template)
    const isEditMode = existingCode && !template;

    let templateConfig;
    if (!isEditMode) {
      if (!template) {
        return NextResponse.json(
          { error: "Template is required for new games" },
          { status: 400 }
        );
      }
      templateConfig = GAME_TEMPLATES[template as keyof typeof GAME_TEMPLATES];
      if (!templateConfig) {
        return NextResponse.json(
          { error: "Invalid template" },
          { status: 400 }
        );
      }
    }

    // Determine which model to use (default: gpt-4o)
    const selectedModel = model || "gpt-4o";

    // Different prompts for edit mode vs new game mode
    const systemPrompt = isEditMode
      ? `You are a game developer assistant. Modify the existing game code based on the user's request.

IMPORTANT:
1. Keep the same structure (initGameClient and serverLogic)
2. Make ONLY the changes requested by the user
3. Preserve existing functionality unless specifically asked to change it
4. Return ONLY the complete modified code, no explanations
5. The code must be valid JavaScript

Existing code:
\`\`\`javascript
${existingCode}
\`\`\`

User request: ${description}

Return the complete modified code:`
      : `You are a game developer. Generate complete, working game code.

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
    },

    // OPTIONAL: For games with continuous physics/animation
    tick: (state) => {
      // Called automatically ~60 times per second (every 16ms)
      // Update physics, animations, AI, etc.
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

GAME LOOP (tick):
- Add a 'tick' action for games needing continuous updates (physics, animation, AI)
- Server automatically calls tick ~60 times per second (every 16ms)
- Use for: ball movement, enemy AI, timers, animations, collision detection
- Don't use for: turn-based games (chess, card games) or simple click games
- Example: Pong uses tick for ball physics and collision detection

When to use tick:
✓ Real-time physics (ball bouncing, gravity)
✓ Continuous movement (entities moving every frame)
✓ Collision detection that needs frequent checks
✓ Timers/countdowns
✓ Enemy AI that updates every frame
✗ Turn-based games (chess, tic-tac-toe)
✗ Simple event-driven games (clicker games)

${templateConfig?.prompt || ''}

Base template:
${templateConfig?.baseCode || ''}`;

    let rawResponse: string;

    // Route to appropriate LLM based on model selection
    if (selectedModel.startsWith("claude")) {
      // Use Claude (Anthropic)
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 16000,
        messages: [
          {
            role: "user",
            content: systemPrompt + "\n\nUser request:\n" + description
          }
        ],
        temperature: 0.7,
      });

      rawResponse = message.content[0].type === "text"
        ? message.content[0].text
        : (isEditMode ? existingCode : templateConfig?.baseCode || '');

    } else {
      // Use OpenAI (GPT-4o, etc.)
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: selectedModel,
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

      rawResponse = completion.choices[0].message.content || (isEditMode ? existingCode : templateConfig?.baseCode || '');
    }

    // Extract code from markdown code blocks
    // LLMs often wrap code in ```javascript ... ``` or ``` ... ```
    function extractCode(text: string): string {
      // Try to find code block with language specifier (```javascript or ```js)
      const jsCodeBlockMatch = text.match(/```(?:javascript|js)\n([\s\S]*?)\n```/);
      if (jsCodeBlockMatch) {
        return jsCodeBlockMatch[1];
      }

      // Try to find generic code block (```)
      const genericCodeBlockMatch = text.match(/```\n([\s\S]*?)\n```/);
      if (genericCodeBlockMatch) {
        return genericCodeBlockMatch[1];
      }

      // If no code block found, return the whole response
      // (Maybe the LLM returned plain code without markdown)
      return text;
    }

    const generatedCode = extractCode(rawResponse);

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

