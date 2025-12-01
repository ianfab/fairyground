import { NextResponse } from "next/server";
import { GAME_TEMPLATES } from "@/lib/game-templates";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getUser } from "@propelauth/nextjs/server/app-router";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Force dynamic rendering and disable response buffering for streaming
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Define structured output schema
type CodeEdit = {
  find: {
    start_at: string;
    end_at: string;
  };
  replace_with: string;
};

interface GameGenerationResponse {
  code?: string;
  explanation?: string;
  reasoning?: string;
  edits?: CodeEdit[];
   min_players_per_room?: number;
   max_players_per_room?: number;
   has_win_condition?: boolean;
   can_join_late?: boolean;
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
  requestId: string;
  template?: string;
}

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Generate Game ${requestId}] ========== REQUEST START at ${new Date().toISOString()} ==========`);
  
  try {
    // Debug: Log request headers
    const user = await getUser();
    console.log(`[Generate Game ${requestId}] User from getUser():`, user ? `Found (${user.userId})` : 'null');

    console.log(`[Generate Game ${requestId}] User ID:`, user?.userId);

    const { template, description, name, model, existingCode, screenshot, userId, chatHistory } = await request.json();
    console.log(`[Generate Game ${requestId}] Params - template: ${template}, model: ${model}, isEditMode: ${!!existingCode}, hasChatHistory: ${!!chatHistory}`);

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

    // Determine which model to use (default: Claude Sonnet 4.5)
    const selectedModel = model || "claude-sonnet-4-5-20250929";

    // Different prompts for edit mode vs new game mode
    let systemPrompt = isEditMode
      ? `You are a game developer assistant. Modify the existing game code based on the user's request by returning a JSON description of edits, not the full file.

IMPORTANT:
1. Keep the same structure (initGameClient and serverLogic).
2. Make ONLY the changes requested by the user.
3. Preserve existing functionality unless specifically asked to change it.
4. The code must remain valid JavaScript after applying your edits.
5. Instead of returning the full file, you MUST return a JSON object with this exact shape:

{
  "explanation": "Brief explanation of what you're doing and why (2-3 sentences)",
  "edits": [
    {
      "find": {
        "start_at": "function foo() {",
        "end_at": "}"
      },
      "replace_with": "function foo() {\\n  console.log('hi');\\n}"
    }
  ]
}

6. "find.start_at" and "find.end_at" should be short substrings that uniquely identify the start and end of the region to replace.
7. The actual code in the file may have slightly different spacing, indentation, or line breaks compared to what you see. Be careful with how you space things and do NOT assume the formatting is exactly the same.
8. Choose robust snippets that are unlikely to change and avoid relying on exact whitespace. Do NOT include leading or trailing spaces or indentation in "start_at" or "end_at"—focus on the core tokens.
9. "replace_with" must be the complete replacement text for the region between "start_at" and "end_at".

Existing code:
\`\`\`javascript
${existingCode}
\`\`\`${chatHistory && chatHistory.length > 0 ? `

Previous conversation:
${chatHistory.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}` : ''}

User request: ${description}

Return ONLY the JSON object with "explanation" and "edits".`
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
      console.log(`[Generate Game ${requestId}] Using streaming OpenAI response`);
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
        requestId,
        template
      });
    }

    let generatedCode: string = "";
    let explanation: string = "";
    let reasoning: string = "";
    let edits: CodeEdit[] = [];
    let minPlayersPerRoom: number | undefined;
    let maxPlayersPerRoom: number | undefined;
    let hasWinCondition: boolean | undefined;
    let canJoinLate: boolean | undefined;

    // Route to appropriate LLM based on model selection
    if (selectedModel.startsWith("claude")) {
      // Use Claude (Anthropic) with proper Structured Outputs
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const outputFormat = isEditMode
        ? {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                explanation: {
                  type: "string",
                  description:
                    "Brief explanation of what you're doing and why (2-3 sentences)",
                },
                edits: {
                  type: "array",
                  description:
                    "List of targeted edits to apply to the existing code.",
                  items: {
                    type: "object",
                    properties: {
                      find: {
                        type: "object",
                        properties: {
                          start_at: {
                            type: "string",
                            description:
                              "Short substring marking the start of the region to replace.",
                          },
                          end_at: {
                            type: "string",
                            description:
                              "Short substring marking the end of the region to replace.",
                          },
                        },
                        required: ["start_at", "end_at"],
                        additionalProperties: false,
                      },
                      replace_with: {
                        type: "string",
                        description:
                          "Complete replacement text for the region between start_at and end_at.",
                      },
                    },
                    required: ["find", "replace_with"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["explanation", "edits"],
              additionalProperties: false,
            },
          }
        : {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                explanation: {
                  type: "string",
                  description:
                    "Brief explanation of what you're doing and why (2-3 sentences)",
                },
                code: {
                  type: "string",
                  description: "The complete game code",
                },
                min_players_per_room: {
                  type: "integer",
                  description:
                    "Minimum number of players required to start a room. Default 2.",
                },
                max_players_per_room: {
                  type: "integer",
                  description:
                    "Maximum number of players allowed in a single room. Default 2.",
                },
                has_win_condition: {
                  type: "boolean",
                  description:
                    "Whether the game has a hard win condition that ends the round (true/false). Default true.",
                },
                can_join_late: {
                  type: "boolean",
                  description:
                    "Whether new players are allowed to join a room after it has started (true/false). Default false.",
                },
              },
              required: ["explanation", "code", "min_players_per_room", "max_players_per_room", "has_win_condition", "can_join_late"],
              additionalProperties: false,
            },
          };

      const message = await anthropic.messages.create(
        {
          model: selectedModel,
          max_tokens: 16000,
          thinking: {
            type: "enabled",
            budget_tokens: 10000,
          },
          output_format: outputFormat,
          messages: [
            {
              role: "user",
              content: systemPrompt + "\n\nUser request:\n" + description,
            },
          ],
        } as any, // Type assertion needed because output_format is in beta
        {
          headers: {
            "anthropic-beta": "structured-outputs-2025-11-13",
          },
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
        if (isEditMode) {
          generatedCode = existingCode || "";
        } else {
          generatedCode = templateConfig?.baseCode || "";
        }
        explanation = "Error: Model returned no content. Using fallback.";
      } else {
        try {
          const parsed = JSON.parse(textBlock.text) as GameGenerationResponse;
          if (isEditMode) {
            edits = parsed.edits || [];
            explanation = parsed.explanation || "";
          } else {
            generatedCode = parsed.code || "";
            explanation = parsed.explanation || "";
            minPlayersPerRoom = parsed.min_players_per_room;
            maxPlayersPerRoom = parsed.max_players_per_room;
            hasWinCondition = parsed.has_win_condition;
            canJoinLate = parsed.can_join_late;
          }
        } catch (e) {
          console.error("Failed to parse Claude structured output:", e);
          if (isEditMode) {
            const extracted = extractCode(textBlock.text);
            generatedCode = extracted || existingCode || "";
            explanation =
              "Error parsing response, using full code fallback extracted from text.";
          } else {
            generatedCode = extractCode(textBlock.text);
            explanation = "Error parsing response, extracted code from text.";
          }
        }
      }

     } else if (selectedModel.startsWith("gemini")) {
       // Use Gemini (Google) with proper Structured Outputs
       const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
       
       // Define JSON Schema for structured output
       const jsonSchema = isEditMode
         ? {
             type: SchemaType.OBJECT,
             properties: {
               explanation: {
                 type: SchemaType.STRING,
                 description:
                   "Brief explanation of what you're doing and why (2-3 sentences)",
               },
               edits: {
                 type: SchemaType.ARRAY,
                 description:
                   "List of targeted edits to apply to the existing code.",
                 items: {
                   type: SchemaType.OBJECT,
                   properties: {
                     find: {
                       type: SchemaType.OBJECT,
                       properties: {
                         start_at: {
                           type: SchemaType.STRING,
                           description:
                             "Short substring marking the start of the region to replace.",
                         },
                         end_at: {
                           type: SchemaType.STRING,
                           description:
                             "Short substring marking the end of the region to replace.",
                         },
                       },
                     },
                     replace_with: {
                       type: SchemaType.STRING,
                       description:
                         "Complete replacement text for the region between start_at and end_at.",
                     },
                   },
                 },
               },
             },
             required: ["explanation", "edits"],
           }
             : {
             type: SchemaType.OBJECT,
             properties: {
               explanation: {
                 type: SchemaType.STRING,
                 description:
                   "Brief explanation of what you're doing and why (2-3 sentences)",
               },
               code: {
                 type: SchemaType.STRING,
                 description: "The complete game code in the specified format",
               },
               min_players_per_room: {
                 type: SchemaType.NUMBER,
                 description:
                   "Minimum number of players required to start a room. Default 2.",
               },
               max_players_per_room: {
                 type: SchemaType.NUMBER,
                 description:
                   "Maximum number of players allowed in a single room. Default 2.",
               },
               has_win_condition: {
                 type: SchemaType.BOOLEAN,
                 description:
                   "Whether the game has a hard win condition that ends the round (true/false). Default true.",
               },
               can_join_late: {
                 type: SchemaType.BOOLEAN,
                 description:
                   "Whether new players are allowed to join a room after it has started (true/false). Default false.",
               },
             },
             required: ["explanation", "code", "min_players_per_room", "max_players_per_room", "has_win_condition", "can_join_late"],
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
         if (isEditMode) {
           generatedCode = existingCode || "";
         } else {
           generatedCode = templateConfig?.baseCode || "";
         }
         explanation = "Error: Model returned no content. Using fallback.";
       } else {
         try {
           const parsed = JSON.parse(responseText) as GameGenerationResponse;
           if (isEditMode) {
             edits = parsed.edits || [];
             explanation = parsed.explanation || "";
           } else {
             generatedCode = parsed.code || "";
             explanation = parsed.explanation || "";
             minPlayersPerRoom = parsed.min_players_per_room;
             maxPlayersPerRoom = parsed.max_players_per_room;
             hasWinCondition = parsed.has_win_condition;
             canJoinLate = parsed.can_join_late;
           }
         } catch (e) {
           console.error("Failed to parse Gemini structured output:", e);
           if (isEditMode) {
             const extracted = extractCode(responseText);
             generatedCode = extracted || existingCode || "";
             explanation =
               "Error parsing response, using full code fallback extracted from text.";
           } else {
             generatedCode = extractCode(responseText);
             explanation = "Error parsing response, extracted code from text.";
           }
         }
       }

    } else {
      return NextResponse.json(
        { error: "Unsupported model provider" },
        { status: 400 }
      );
    }

    // Log reasoning for debugging
    if (reasoning) {
      console.log(`[Generate Game ${requestId}] Model reasoning:`, reasoning.substring(0, 500) + (reasoning.length > 500 ? "..." : ""));
    }
    
    console.log(`[Generate Game ${requestId}] Model explanation:`, explanation);
    console.log(`[Generate Game ${requestId}] ========== REQUEST END at ${new Date().toISOString()} ==========`);

    // Edit mode: return edits (preferred) or fallback code
    if (isEditMode) {
      return NextResponse.json({
        ...(edits.length > 0 ? { edits } : { code: generatedCode }),
        explanation,
        reasoning: reasoning.substring(0, 1000), // Limit reasoning to first 1000 chars for response
      });
    }

    // New game mode: return full code + suggested name/description
    const suggestedName = buildSuggestedName(name, description);

    // Apply safe defaults if the model did not specify these fields
    const safeMinPlayers = typeof minPlayersPerRoom === "number" && Number.isFinite(minPlayersPerRoom)
      ? Math.max(1, Math.floor(minPlayersPerRoom))
      : 2;
    const safeMaxPlayers = typeof maxPlayersPerRoom === "number" && Number.isFinite(maxPlayersPerRoom)
      ? Math.max(safeMinPlayers, Math.floor(maxPlayersPerRoom))
      : 2;
    const safeHasWinCondition = typeof hasWinCondition === "boolean" ? hasWinCondition : true;
    const safeCanJoinLate = typeof canJoinLate === "boolean" ? canJoinLate : false;

    return NextResponse.json({
      code: generatedCode,
      suggestedName,
      suggestedDescription: description.substring(0, 100),
      explanation,
      reasoning: reasoning.substring(0, 1000), // Limit reasoning to first 1000 chars for response
      min_players_per_room: safeMinPlayers,
      max_players_per_room: safeMaxPlayers,
      has_win_condition: safeHasWinCondition,
      can_join_late: safeCanJoinLate,
    });
  } catch (error: any) {
    console.error(`[Generate Game ${requestId}] ERROR:`, error);
    console.error(`[Generate Game ${requestId}] Error stack:`, error?.stack);
    console.error(`[Generate Game ${requestId}] Error message:`, error?.message);
    console.log(`[Generate Game ${requestId}] ========== REQUEST END (ERROR) at ${new Date().toISOString()} ==========`);
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
    requestId,
    template
  } = params;

  console.log(`[Generate Game ${requestId}] streamOpenAIResponse started`);

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

        const structuredFormat = isEditMode
          ? {
              type: "json_schema" as const,
              name: "game_edit_response",
              strict: true,
            schema: {
                type: "object",
                properties: {
                  explanation: {
                    type: "string",
                    description:
                      "Brief explanation of what you're doing and why (2-3 sentences)",
                  },
                  edits: {
                    type: "array",
                    description:
                      "List of targeted edits to apply to the existing code.",
                    items: {
                      type: "object",
                      properties: {
                        find: {
                          type: "object",
                          properties: {
                            start_at: {
                              type: "string",
                              description:
                                "Short substring marking the start of the region to replace.",
                            },
                            end_at: {
                              type: "string",
                              description:
                                "Short substring marking the end of the region to replace.",
                            },
                          },
                          required: ["start_at", "end_at"],
                          additionalProperties: false,
                        },
                        replace_with: {
                          type: "string",
                          description:
                            "Complete replacement text for the region between start_at and end_at.",
                        },
                      },
                      required: ["find", "replace_with"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["explanation", "edits"],
                additionalProperties: false,
              },
            }
          : {
              type: "json_schema" as const,
              name: "game_generation_response",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  explanation: {
                    type: "string",
                    description:
                      "Brief explanation of what you're doing and why (2-3 sentences)",
                  },
                  code: {
                    type: "string",
                    description: "The complete game code",
                },
                min_players_per_room: {
                  type: "integer",
                  description:
                    "Minimum number of players required to start a room. Default 2.",
                },
                max_players_per_room: {
                  type: "integer",
                  description:
                    "Maximum number of players allowed in a single room. Default 2.",
                },
                has_win_condition: {
                  type: "boolean",
                  description:
                    "Whether the game has a hard win condition that ends the round (true/false). Default true.",
                },
                can_join_late: {
                  type: "boolean",
                  description:
                    "Whether new players are allowed to join a room after it has started (true/false). Default false.",
                  },
                },
                required: ["explanation", "code", "min_players_per_room", "max_players_per_room", "has_win_condition", "can_join_late"],
                additionalProperties: false,
              },
            };

        const responseStream = await client.responses.stream({
          model: selectedModel,
          input: inputMessages,
          text: {
            format: structuredFormat,
          },
          reasoning: { effort: "medium"},
          prompt_cache_retention: "24h",
          prompt_cache_key: `generate-${isEditMode ? "edit" : "new"}-${template}`
        });

        let aggregatedJson = "";
        let streamedReasoning = "";

        for await (const event of responseStream) {
          switch (event.type) {
            case "response.output_text.delta": {
              if (event.delta) {
                aggregatedJson += event.delta;
                // console.log("event.delta", event.delta);
                send({ type: "token", delta: event.delta });
              }
              break;
            }
            case "response.reasoning_text.delta": {
              if (event.delta) {
                streamedReasoning += event.delta;
                // console.log("streamedReasoning", streamedReasoning);
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
              return JSON.parse(
                finalResponse.output_text || aggregatedJson || ""
              ) as GameGenerationResponse;
            } catch {
              return null;
            }
          })();

        const fallbackCode = isEditMode ? existingCode || "" : templateBaseCode || "";

        let generatedCode = "";
        let explanation = parsedPayload?.explanation || "";
        let reasoning = (parsedPayload?.reasoning || streamedReasoning || "").substring(
          0,
          1000
        );
        let edits: CodeEdit[] = [];
        let minPlayersPerRoom: number | undefined =
          parsedPayload?.min_players_per_room;
        let maxPlayersPerRoom: number | undefined =
          parsedPayload?.max_players_per_room;
        let hasWinCondition: boolean | undefined =
          parsedPayload?.has_win_condition;
        let canJoinLate: boolean | undefined = parsedPayload?.can_join_late;

        if (isEditMode) {
          if (parsedPayload?.edits && parsedPayload.edits.length > 0) {
            edits = parsedPayload.edits;
          } else {
            const extracted = extractCode(
              finalResponse.output_text || aggregatedJson || ""
            );
            generatedCode = extracted || fallbackCode;
            if (!explanation) {
              explanation = extracted
                ? "Parsed full code from the model output as fallback."
                : "Model returned no edits. Using fallback code.";
            }
          }
        } else {
          generatedCode = parsedPayload?.code || "";
        }

        if (!isEditMode && !generatedCode) {
          const extracted = extractCode(finalResponse.output_text || aggregatedJson || "");
          generatedCode = extracted || fallbackCode;
          if (!explanation) {
            explanation = extracted
              ? "Parsed code directly from the model output."
              : "Model returned no content. Using fallback.";
          }
        }

        if (!isEditMode && !generatedCode) {
          throw new Error("Model did not return any code.");
        }
        if (isEditMode && edits.length === 0 && !generatedCode) {
          throw new Error("Model did not return any edits or code.");
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

        const resultPayload: Record<string, unknown> = {
          type: "result",
          explanation,
          reasoning,
        };

        if (isEditMode) {
          if (edits.length > 0) {
            resultPayload.edits = edits;
          } else {
            resultPayload.code = generatedCode;
          }
        } else {
          // Apply safe defaults if the model omitted config fields
          const safeMinPlayers =
            typeof minPlayersPerRoom === "number" && Number.isFinite(minPlayersPerRoom)
              ? Math.max(1, Math.floor(minPlayersPerRoom))
              : 2;
          const safeMaxPlayers =
            typeof maxPlayersPerRoom === "number" && Number.isFinite(maxPlayersPerRoom)
              ? Math.max(safeMinPlayers, Math.floor(maxPlayersPerRoom))
              : 2;
          const safeHasWinCondition =
            typeof hasWinCondition === "boolean" ? hasWinCondition : true;
          const safeCanJoinLate =
            typeof canJoinLate === "boolean" ? canJoinLate : false;

          resultPayload.code = generatedCode;
          resultPayload.suggestedName = buildSuggestedName(name, description);
          resultPayload.suggestedDescription = description.substring(0, 100);
          resultPayload.min_players_per_room = safeMinPlayers;
          resultPayload.max_players_per_room = safeMaxPlayers;
          resultPayload.has_win_condition = safeHasWinCondition;
          resultPayload.can_join_late = safeCanJoinLate;
        }

        send(resultPayload);
        console.log(`[Generate Game ${requestId}] ========== STREAM END at ${new Date().toISOString()} ==========`);
      } catch (error) {
        console.error(`[Generate Game ${requestId}] OpenAI streaming error:`, error);
        send({
          type: "error",
          error: {
            message: error instanceof Error ? error.message : "Failed to generate game",
          },
        });
        console.log(`[Generate Game ${requestId}] ========== STREAM END (ERROR) at ${new Date().toISOString()} ==========`);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for Nginx/Vercel
    },
  });
}

