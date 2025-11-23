# Game Templates Integration Guide

## Overview
The game creation system now uses template-based flows to make it easier for LLMs to generate working multiplayer games.

## Templates

### 1. Chess Variant
- **Libraries**: chess.js, chessboard.js
- **Use Cases**: Custom chess variants, modified rules, different board sizes
- **Optimizations**: Pre-built move validation, FEN notation support

### 2. 2D Shooter
- **Libraries**: Phaser 3
- **Use Cases**: Top-down shooters, side-scrollers, bullet hell games
- **Optimizations**: Object pooling for bullets, arcade physics, sprite management

### 3. 3D Shooter
- **Libraries**: Three.js, PointerLockControls
- **Use Cases**: FPS, TPS, 3D action games
- **Optimizations**: 
  - Pixel ratio capped at 2
  - Antialiasing disabled by default
  - Fog for draw distance
  - MeshBasicMaterial for performance

### 4. Open Ended
- **Libraries**: None (user choice)
- **Use Cases**: Any custom game type
- **Warning**: May require more iteration

## LLM Integration

### Setup
To integrate with an LLM for code generation:

1. **OpenAI** (recommended):
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: templateConfig.prompt + "\n\n" + templateConfig.baseCode
    },
    {
      role: "user",
      content: userDescription
    }
  ],
  tools: [{ type: "web_search" }] // Enable web search
});
```

2. **Anthropic Claude**:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  messages: [
    {
      role: "user",
      content: templateConfig.prompt + "\n\n" + userDescription
    }
  ]
});
```

### Environment Variables
Add to your `.env`:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## File Structure
```
apps/web/
├── lib/
│   └── game-templates.ts       # Template definitions
├── app/
│   ├── create/
│   │   └── page.tsx            # Template selection & game creation UI
│   └── api/
│       └── generate-game/
│           └── route.ts        # LLM integration endpoint
```

## Adding New Templates

1. Add to `game-templates.ts`:
```typescript
export const GAME_TEMPLATES = {
  // ... existing templates
  "new-template": {
    id: "new-template",
    name: "Template Name",
    description: "Template description",
    libraries: ["library1", "library2"],
    baseCode: `// Base code here`,
    prompt: `// Instructions for LLM`
  }
};
```

2. The UI will automatically pick up the new template.

## Best Practices

1. **Template Design**: Keep base code minimal but functional
2. **LLM Prompts**: Be specific about code structure and multiplayer requirements
3. **Error Handling**: Validate generated code before shipping
4. **Testing**: Test each template with various descriptions
5. **Performance**: Monitor generated code for performance issues

## Next Steps

1. Add your LLM API key to `.env`
2. Uncomment the LLM integration in `apps/web/app/api/generate-game/route.ts`
3. Test game generation with each template
4. Iterate on prompts based on results

