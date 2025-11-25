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
When the game ends, you MUST set these flags in state:
- state.gameEnded = true (boolean flag indicating game is over)
- state.gameWinner = playerId (socket ID of the winning player, or null for tie/draw)
- state.gameEndReason = "reason" (optional: "checkmate", "timeout", "score limit", etc.)

Example:
\`\`\`javascript
// When a player wins
state.gameEnded = true;
state.gameWinner = playerId; // The socket ID of the winner
state.gameEndReason = "Player reached score limit";

// For a tie/draw
state.gameEnded = true;
state.gameWinner = null; // null means no winner (tie/draw)
state.gameEndReason = "Draw by stalemate";
\`\`\`

The system will automatically:
- Update ELO ratings for all players based on the outcome
- Show a game over screen to players
- Allow players to play again

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

${templateConfig?.prompt || ''}

Base template for a similar game:
${templateConfig?.baseCode || ''}`;

    // Helper function to extract code from markdown code blocks
    // LLMs sometimes wrap code in ```javascript ... ``` or ``` ... ```
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
      // Use OpenAI (GPT-5/o1, GPT-4o, etc.) with structured output
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // GPT-5/o1 models use reasoning_effort instead of temperature
      const isO1Model = selectedModel.startsWith("o1") || selectedModel.startsWith("gpt-5") || selectedModel.startsWith("o3");
      
      let completion: OpenAI.Chat.ChatCompletion;
      
      if (isO1Model) {
        // o1 models don't support structured outputs yet, use prompt-based JSON
        const structuredPrompt = `${systemPrompt}

IMPORTANT: You must respond with a JSON object in this exact format:
{
  "explanation": "Brief explanation of what you're doing and why (2-3 sentences)",
  "code": "The complete game code here"
}

User request: ${description}`;

        completion = await openai.chat.completions.create({
          model: selectedModel,
          messages: [
            {
              role: "user",
              content: structuredPrompt
            }
          ],
          reasoning_effort: "medium"
        } as OpenAI.Chat.ChatCompletionCreateParams) as OpenAI.Chat.ChatCompletion;
      } else {
        // Other models support proper Structured Outputs
        // Build message content with text and optional image
        let userContent: any = description;
        
        // Add screenshot if provided and model supports vision (gpt-4o, gpt-4-turbo, etc.)
        if (screenshot && isEditMode && (selectedModel.includes("gpt-4") || selectedModel.includes("gpt-5"))) {
          userContent = [
            {
              type: "text",
              text: description
            },
            {
              type: "image_url",
              image_url: {
                url: screenshot
              }
            }
          ];
        }

        completion = await openai.chat.completions.create({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userContent
            }
          ],
          temperature: 0.7,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "game_generation_response",
              strict: true,
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
            }
          }
        });
      }

      const responseContent = completion.choices[0].message.content;
      
      if (!responseContent) {
        console.error("OpenAI returned no content, falling back to default");
        generatedCode = isEditMode ? existingCode : templateConfig?.baseCode || '';
        explanation = "Error: Model returned no content. Using fallback.";
      } else {
        try {
          const parsed = JSON.parse(responseContent) as GameGenerationResponse;
          generatedCode = parsed.code;
          explanation = parsed.explanation || "";
          
          // Extract reasoning from o1 models if available (using type assertion for new feature)
          if (isO1Model) {
            const messageWithReasoning = completion.choices[0].message as any;
            if (messageWithReasoning.reasoning_content) {
              reasoning = messageWithReasoning.reasoning_content;
            }
          }
        } catch (e) {
          console.error("Failed to parse OpenAI structured output:", e);
          generatedCode = extractCode(responseContent);
          explanation = "Error parsing response, extracted code from text.";
        }
      }
    }

    // Generate suggested name from description
    const suggestedName = name || description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

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

