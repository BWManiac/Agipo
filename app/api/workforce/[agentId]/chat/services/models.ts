/**
 * Available AI Models for Agents
 * 
 * Co-located with chat service where models are used.
 * Model names must match Vercel AI Gateway exactly.
 * 
 * Reference: https://vercel.com/ai-gateway/models
 * 
 * Model Format: "provider/model-name"
 * Usage: gateway("provider/model-name")
 */

export type ModelProvider = "google" | "openai" | "anthropic" | "deepseek";

export interface ModelInfo {
  /** Gateway model ID - must match Vercel exactly (e.g., "google/gemini-2.5-flash") */
  id: string;
  /** Display name for UI */
  name: string;
  /** Provider name */
  provider: ModelProvider;
  /** Optional description */
  description?: string;
}

/**
 * Available models via Vercel AI Gateway.
 * 
 * Only includes models we want to support.
 * Model IDs must match Vercel AI Gateway exactly.
 * 
 * Reference: https://vercel.com/ai-gateway/models
 */
export const AVAILABLE_MODELS: readonly ModelInfo[] = [
  // Anthropic Claude
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Anthropic's most capable model for complex reasoning",
  },

  // Google Gemini
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast and efficient Google model",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "google",
    description: "Google's latest preview model",
  },

  // OpenAI
  {
    id: "openai/gpt-5",
    name: "OpenAI GPT-5",
    provider: "openai",
    description: "OpenAI's most advanced model",
  },
  {
    id: "openai/gpt-5-mini",
    name: "OpenAI GPT-5 Mini",
    provider: "openai",
    description: "Faster and more affordable GPT-5",
  },

  // DeepSeek
  {
    id: "deepseek/deepseek-3.2",
    name: "DeepSeek 3.2",
    provider: "deepseek",
    description: "DeepSeek's advanced model",
  },
] as const;

/**
 * Get all available models.
 */
export function getAvailableModels(): ModelInfo[] {
  return [...AVAILABLE_MODELS];
}

/**
 * Get default model (used as fallback).
 */
export function getDefaultModel(): ModelInfo {
  return AVAILABLE_MODELS.find((m) => m.id === "google/gemini-2.5-flash") || AVAILABLE_MODELS[0];
}

/**
 * Validate if a model ID is available.
 */
export function isValidModelId(modelId: string): boolean {
  return AVAILABLE_MODELS.some((model) => model.id === modelId);
}
