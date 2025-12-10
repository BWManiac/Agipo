# Models API (`/api/workforce/models`)

**Method:** `GET`

## Purpose
Returns all available AI models that can be used with agents via Vercel AI Gateway.

## Authentication
Requires Clerk authentication. Returns 401 if user is not authenticated.

## Response

### Success (200)
```json
{
  "models": [
    {
      "id": "google/gemini-2.5-pro",
      "name": "Google Gemini 2.5 Pro",
      "provider": "google",
      "description": "Google's most capable model for complex tasks",
      "tags": ["latest", "multimodal", "long-context"]
    },
    {
      "id": "openai/gpt-4o",
      "name": "OpenAI GPT-4o",
      "provider": "openai",
      "description": "OpenAI's most advanced model with multimodal capabilities",
      "tags": ["latest", "multimodal"]
    }
  ],
  "count": 2
}
```

### Authentication Error (401)
```json
{
  "message": "Unauthorized"
}
```

### Server Error (500)
```json
{
  "message": "Failed to fetch models"
}
```

## Model Format

Models use the format: `provider/model-name`

Examples:
- `google/gemini-2.5-pro`
- `openai/gpt-4o`
- `anthropic/claude-3-5-sonnet`

## Usage

Models are used with Vercel AI Gateway:

```typescript
import { createGateway } from "@ai-sdk/gateway";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Use model in Mastra Agent
const agent = new Agent({
  model: gateway("google/gemini-2.5-pro"),
  // ...
});
```

## Model List Source

Models are maintained in `app/api/workforce/services/models.ts`.

**Note:** Vercel AI Gateway does not provide a public API to list available models, so we maintain a static list. This list is easy to update - simply add new models to the `AVAILABLE_MODELS` array in the models service.

## Frontend Consumers

| Component | Description |
|-----------|-------------|
| `PersonalityStep` | Fetches models for wizard model selection |
| `ConfigTab` | Fetches models for agent configuration |

## Adding New Models

To add a new model:

1. Add model to `AVAILABLE_MODELS` in `app/api/workforce/services/models.ts`
2. Format: `{ id: "provider/model-name", name: "Display Name", provider: "provider", ... }`
3. Models will automatically appear in UI after deployment

## References

- **Vercel AI Gateway:** https://vercel.com/docs/ai-gateway
- **Model Providers:** https://vercel.com/docs/ai-gateway/models-and-providers
- **Model Service:** `app/api/workforce/services/models.ts`
