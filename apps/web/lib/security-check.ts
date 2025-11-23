import Anthropic from "@anthropic-ai/sdk";

interface SecurityCheckResult {
  isMalicious: boolean;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  findings: string[];
  explanation: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Check game code for malicious patterns using AI
 * Returns a structured analysis of potential security issues
 */
export async function checkCodeForMaliciousContent(
  code: string
): Promise<SecurityCheckResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a security expert analyzing JavaScript game code for malicious patterns.

Analyze this code and identify if it contains any malicious or dangerous patterns:

\`\`\`javascript
${code}
\`\`\`

Look for:
1. **Network requests** to external domains (fetch, XMLHttpRequest, WebSocket to non-game servers)
2. **Data exfiltration** attempts (sending user data, cookies, localStorage to external servers)
3. **Credential theft** (accessing passwords, tokens, authentication data)
4. **XSS attempts** (eval with user input, innerHTML with unsanitized data, script injection)
5. **Code injection** (Function constructor, eval, setTimeout/setInterval with strings)
6. **Filesystem access** attempts (if any Node.js APIs are used inappropriately)
7. **Cryptocurrency mining** code
8. **Suspicious obfuscation** (heavily obfuscated code that hides intent)
9. **Unauthorized resource access** (accessing window.parent, window.top in suspicious ways)
10. **Malicious redirects** (window.location changes to phishing sites)

IMPORTANT NOTES:
- Socket.io connections to the game server (window.location.origin) are SAFE and expected
- Canvas/WebGL rendering is SAFE
- Game logic with moves, state updates, and player interactions is SAFE
- Loading game libraries (chess.js, chessboard.js, three.js, etc.) from CDNs is SAFE
- localStorage usage for game state is SAFE
- Normal game mechanics (scores, timers, player positions) are SAFE

Respond with a JSON object in this exact format:
{
  "isMalicious": boolean,
  "riskLevel": "safe" | "low" | "medium" | "high" | "critical",
  "findings": ["specific issue 1", "specific issue 2", ...],
  "explanation": "detailed explanation of why this code is or isn't malicious"
}`,
        },
      ],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = content.text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\s*\n/, "")
        .replace(/\n```\s*$/, "");
    }

    const result = JSON.parse(jsonText) as SecurityCheckResult;

    // Validate the response structure
    if (
      typeof result.isMalicious !== "boolean" ||
      !["safe", "low", "medium", "high", "critical"].includes(result.riskLevel) ||
      !Array.isArray(result.findings) ||
      typeof result.explanation !== "string"
    ) {
      throw new Error("Invalid response structure from AI");
    }

    return result;
  } catch (error) {
    console.error("Security check error:", error);
    
    // On error, fail closed (treat as suspicious)
    return {
      isMalicious: true,
      riskLevel: "high",
      findings: ["Unable to complete security check due to an error"],
      explanation: `Security analysis failed: ${error instanceof Error ? error.message : "Unknown error"}. Blocking as a precaution.`,
    };
  }
}

/**
 * Basic pattern matching for obviously malicious code
 * This runs before the AI check as a fast first pass
 */
export function quickSecurityCheck(code: string): {
  blocked: boolean;
  reason?: string;
} {
  // Extremely dangerous patterns that should always be blocked
  const dangerousPatterns = [
    {
      pattern: /document\.cookie/gi,
      reason: "Attempts to access document.cookie (potential credential theft)",
    },
    {
      pattern: /localStorage\.getItem\s*\(\s*['"`].*(?:token|password|auth|secret|key).*['"`]\s*\)/gi,
      reason: "Attempts to access authentication tokens from localStorage",
    },
    {
      pattern: /fetch\s*\(\s*['"`](?!http:\/\/localhost|https?:\/\/[^/]*\.?splork\.io).+['"`]/gi,
      reason: "Makes network requests to suspicious external domains",
    },
    {
      pattern: /XMLHttpRequest.*\.open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`](?!http:\/\/localhost|https?:\/\/[^/]*\.?splork\.io).+['"`]/gi,
      reason: "Makes XMLHttpRequest to suspicious external domains",
    },
    {
      pattern: /new\s+WebSocket\s*\(\s*['"`](?!ws:\/\/localhost|wss?:\/\/[^/]*\.?splork\.io).+['"`]/gi,
      reason: "Creates WebSocket connection to suspicious external server",
    },
    {
      pattern: /eval\s*\(/g,
      reason: "Uses eval() which can execute arbitrary code",
    },
    {
      pattern: /Function\s*\(\s*['"`]/g,
      reason: "Uses Function constructor which can execute arbitrary code",
    },
    {
      pattern: /window\.parent/g,
      reason: "Attempts to access parent window (potential frame breaking)",
    },
    {
      pattern: /top\.location/g,
      reason: "Attempts to manipulate top frame location",
    },
  ];

  for (const { pattern, reason } of dangerousPatterns) {
    if (pattern.test(code)) {
      return { blocked: true, reason };
    }
  }

  return { blocked: false };
}

