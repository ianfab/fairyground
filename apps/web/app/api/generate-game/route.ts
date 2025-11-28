import { NextResponse } from "next/server";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getUser } from "@propelauth/nextjs/server/app-router";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Define structured output schema
interface GameGenerationResponse {
  code: string;
  explanation: string;
  reasoning?: string;
}

function extractCode(text: string): string {
  const jsCodeBlockMatch = text.match(/```(?:javascript|js)\n([\s\S]*?)\n```/);
  if (jsCodeBlockMatch) {
    return jsCodeBlockMatch[1];
  }

  const genericCodeBlockMatch = text.match(/```\n([\s\S]*?)\n```/);
  if (genericCodeBlockMatch) {
    return genericCodeBlockMatch[1];
  }

  return text;
}

function buildSuggestedName(providedName: string | undefined, description: string): string {
  if (providedName && providedName.trim()) {
    return providedName;
  }

  return description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30);
}

interface OpenAIStreamParams {
  description: string;
  name?: string;
  selectedModel: string;
  systemPrompt: string;
  isEditMode: boolean;
  existingCode?: string;
  templateBaseCode?: string;
  screenshot?: string;
  effectiveUserId: string;
}

export async function POST(request: Request) {
  try {
    // Debug: Log request headers
    const user = await getUser();
    console.log('[Generate Game] User from getUser():', user ? `Found (${user.userId})` : 'null');

    console.log('[Generate Game] User ID:', user?.userId);

    const { template, description, name, model, existingCode, screenshot, userId } = await request.json();

    const effectiveUserId = user?.userId || userId || '';
    console.log('[Generate Game] Effective User ID:', effectiveUserId);

    // Apply rate limiting
    const rateLimitResponse = checkRateLimit(
      effectiveUserId,
      "generate-game",
      RATE_LIMITS.GENERATE_GAME
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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

    // Determine which model to use (default: gpt-5/o1)
    const selectedModel = model || "gpt-5";

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

## by default, you do the bare minimum, don't. if you have to generate some pre-written text, generate lots of funny variations, not just a few.

## make games as engaging as you can by default:
- movement should be acceleration based, not just velocity
- where there are arrow key controls, make sure to also bind wasd and vice versa

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
    playerJoined(state, payload, playerId) => {
      // process new player joining the game
      // This action is automatically called when a new player joins the game
      // Use it to initialize player state, assign colors/teams, set starting positions, etc.
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

GAME ENDING:
When the game ends, set these flags in state:
- state.gameEnded = true (boolean flag indicating game is over)
- state.gameWinner = playerId (socket ID of the winning player, or null for tie/draw)
- state.gameEndReason = "reason" (optional: human-readable reason like "Player 1 won!")

Example:
\`\`\`javascript
// When a player wins
state.gameEnded = true;
state.gameWinner = playerId; // The socket ID of the winner (from move function parameter)
state.gameEndReason = "Player reached score limit";

// For a tie/draw
state.gameEnded = true;
state.gameWinner = null; // null means no winner (tie/draw)
state.gameEndReason = "Draw by stalemate";
\`\`\`

The server will automatically handle ratings, stats, and show a game over screen.

GAME LOOP (tick):
- OPTIONAL: Add a 'tick' action for games needing continuous updates (physics, animation, AI)
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

DEFAULT MAPS AVAILABLE:
For shooter games, you can import pre-made maps from the default-maps library:

2D Maps:
- MAP_2D_BASIC_SHOOTER: Mix of open space with obstacles (800x600)
- MAP_2D_URBAN: Buildings, rooms, and terrain (800x600)

3D Maps:
- MAP_3D_AWP_STYLE: Symmetrical 1v1 sniper map (100x200)
- MAP_3D_BASIC: Simple arena with spawn walls (80x80)
- MAP_3D_KRUNKER: Fast movement/bhop optimized (120x120)

These maps include obstacles/objects, spawn points, and helper functions. See the template prompts for usage examples.

${templateConfig?.prompt || ''}

Base template for a similar game:
${templateConfig?.baseCode || ''}`;

    const isOpenAIModel =
      !selectedModel.startsWith("claude") && !selectedModel.startsWith("gemini");

    if (isOpenAIModel) {
      return streamOpenAIResponse({
        description,
        name,
        selectedModel,
        systemPrompt,
        isEditMode,
        existingCode,
        templateBaseCode: templateConfig?.baseCode,
        screenshot,
        effectiveUserId,
      });
    }

    let generatedCode: string;
    let explanation: string = "";
    let reasoning: string = "";

    // Route to appropriate LLM based on model selection
    if (selectedModel.startsWith("claude")) {
      // Use Claude (Anthropic) with proper Structured Outputs
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create(
        {
          model: selectedModel,
          max_tokens: 16000,
          thinking: {
            type: "enabled",
            budget_tokens: 10000
          },
          output_format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                explanation: {
                  type: "string",
                  description: "Brief explanation of what you're doing and why (2-3 sentences)"
                },
                code: {
                  type: "string",
                  description: "The complete game code"
                }
              },
              required: ["explanation", "code"],
              additionalProperties: false
            }
          },
          messages: [
            {
              role: "user",
              content: systemPrompt + "\n\nUser request:\n" + description
            }
          ],
        } as any, // Type assertion needed because output_format is in beta
        {
          headers: {
            "anthropic-beta": "structured-outputs-2025-11-13"
          }
        }
      );

      // Extract thinking blocks for reasoning
      const thinkingBlocks = message.content.filter(block => block.type === "thinking");
      if (thinkingBlocks.length > 0 && thinkingBlocks[0].type === "thinking") {
        reasoning = thinkingBlocks[0].thinking;
      }

      // Get the text response
      const textBlock = message.content.find(block => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.error("Claude returned no text content, falling back to default");
        generatedCode = isEditMode ? existingCode : templateConfig?.baseCode || '';
        explanation = "Error: Model returned no content. Using fallback.";
      } else {
        try {
          const parsed = JSON.parse(textBlock.text) as GameGenerationResponse;
          generatedCode = parsed.code;
          explanation = parsed.explanation || "";
        } catch (e) {
          console.error("Failed to parse Claude structured output:", e);
          generatedCode = extractCode(textBlock.text);
          explanation = "Error parsing response, extracted code from text.";
        }
      }

     } else if (selectedModel.startsWith("gemini")) {
       // Use Gemini (Google) with proper Structured Outputs
       const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
       
       // Define JSON Schema for structured output
       const jsonSchema = {
         type: SchemaType.OBJECT,
         properties: {
           explanation: {
             type: SchemaType.STRING,
             description: "Brief explanation of what you're doing and why (2-3 sentences)"
           },
           code: {
             type: SchemaType.STRING,
             description: "The complete game code in the specified format"
           }
         },
         required: ["explanation", "code"]
       };
       
       const model = genAI.getGenerativeModel({ 
         model: selectedModel,
         generationConfig: {
           temperature: 0.7,
           maxOutputTokens: 16000,
           responseMimeType: "application/json",
           responseSchema: jsonSchema as any // Type assertion needed for schema compatibility
         }
       });
 
       // Build parts array with text and optional image
       const parts: any[] = [{ text: systemPrompt + "\n\nUser request:\n" + description }];

       // Add screenshot if provided (Gemini supports vision)
       if (screenshot && isEditMode) {
         parts.push({
           inlineData: {
             mimeType: "image/png",
             data: screenshot.replace(/^data:image\/\w+;base64,/, '')
           }
         });
       }

       const result = await model.generateContent({
         contents: [{
           role: "user",
           parts: parts
         }]
       });
 
       const response = result.response;
       const responseText = response.text();
       
       if (!responseText) {
         console.error("Gemini returned no content, falling back to default");
         generatedCode = isEditMode ? existingCode : templateConfig?.baseCode || '';
         explanation = "Error: Model returned no content. Using fallback.";
       } else {
         try {
           const parsed = JSON.parse(responseText) as GameGenerationResponse;
           generatedCode = parsed.code;
           explanation = parsed.explanation || "";
         } catch (e) {
           console.error("Failed to parse Gemini structured output:", e);
           generatedCode = extractCode(responseText);
           explanation = "Error parsing response, extracted code from text.";
         }
       }

    } else {
      return NextResponse.json(
        { error: "Unsupported model provider" },
        { status: 400 }
      );
    }

    // Generate suggested name from description
    const suggestedName = buildSuggestedName(name, description);

    // Log reasoning for debugging
    if (reasoning) {
      console.log("Model reasoning:", reasoning.substring(0, 500) + (reasoning.length > 500 ? "..." : ""));
    }
    
    console.log("Model explanation:", explanation);

    return NextResponse.json({
      code: generatedCode,
      suggestedName,
      suggestedDescription: description.substring(0, 100),
      explanation,
      reasoning: reasoning.substring(0, 1000), // Limit reasoning to first 1000 chars for response
    });
  } catch (error: any) {
    console.error("Generate game error:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error message:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate game" },
      { status: 500 }
    );
  }
}

async function streamOpenAIResponse(params: OpenAIStreamParams) {
  const {
    description,
    name,
    selectedModel,
    systemPrompt,
    isEditMode,
    existingCode,
    templateBaseCode,
    screenshot,
    effectiveUserId,
  } = params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const userContentParts: Array<
          | { type: "input_text"; text: string }
          | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" }
        > = [
          {
            type: "input_text",
            text: description,
          },
        ];

        if (screenshot && isEditMode) {
          userContentParts.push({
            type: "input_image",
            image_url: screenshot,
            detail: "high",
          });
        }

        const inputMessages = [
          {
            role: "system" as const,
            content: [
              {
                type: "input_text" as const,
                text: systemPrompt,
              },
            ],
          },
          {
            role: "user" as const,
            content: userContentParts,
          },
        ];

        const structuredFormat = {
          type: "json_schema" as const,
          name: "game_generation_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              explanation: {
                type: "string",
                description: "Brief explanation of what you're doing and why (2-3 sentences)",
              },
              code: {
                type: "string",
                description: "The complete game code",
              },
            },
            required: ["explanation", "code"],
            additionalProperties: false,
          },
        };

        const responseStream = await client.responses.stream({
          model: selectedModel,
          input: inputMessages,
          text: {
            format: structuredFormat,
          },
          reasoning: { effort: "medium"}
        });

        let aggregatedJson = "";
        let streamedReasoning = "";

        for await (const event of responseStream) {
          switch (event.type) {
            case "response.output_text.delta": {
              if (event.delta) {
                aggregatedJson += event.delta;
                console.log("event.delta", event.delta);
                send({ type: "token", delta: event.delta });
              }
              break;
            }
            case "response.reasoning_text.delta": {
              if (event.delta) {
                streamedReasoning += event.delta;
                console.log("streamedReasoning", streamedReasoning);
                send({ type: "reasoning", delta: event.delta });
              }
              break;
            }
            case "response.failed": {
              throw new Error("Model response failed");
            }
            case "error": {
              throw new Error(event.message);
            }
          }
        }

        const finalResponse = await responseStream.finalResponse();
        const parsedPayload =
          (finalResponse.output_parsed as GameGenerationResponse | null) ||
          (() => {
            try {
              return JSON.parse(finalResponse.output_text || aggregatedJson || "") as GameGenerationResponse;
            } catch {
              return null;
            }
          })();

        const fallbackCode = isEditMode ? existingCode || "" : templateBaseCode || "";

        let generatedCode = parsedPayload?.code || "";
        let explanation = parsedPayload?.explanation || "";
        let reasoning = (parsedPayload?.reasoning || streamedReasoning || "").substring(0, 1000);

        if (!generatedCode) {
          const extracted = extractCode(finalResponse.output_text || aggregatedJson || "");
          generatedCode = extracted || fallbackCode;
          if (!explanation) {
            explanation = extracted ? "Parsed code directly from the model output." : "Model returned no content. Using fallback.";
          }
        }

        if (!generatedCode) {
          throw new Error("Model did not return any code.");
        }

        if (!reasoning && streamedReasoning) {
          reasoning = streamedReasoning.substring(0, 1000);
        }

        if (reasoning) {
          console.log(
            "Model reasoning:",
            reasoning.substring(0, 500) + (reasoning.length > 500 ? "..." : "")
          );
        }
        console.log("Model explanation:", explanation);

        const resultPayload = {
          type: "result",
          code: generatedCode,
          explanation,
          reasoning,
          suggestedName: buildSuggestedName(name, description),
          suggestedDescription: description.substring(0, 100),
        };

        send(resultPayload);
      } catch (error) {
        console.error("OpenAI streaming error:", error);
        send({
          type: "error",
          error: {
            message: error instanceof Error ? error.message : "Failed to generate game",
          },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

