/**
 * Model Management Service
 * 
 * Centralized list of available AI models via Vercel AI Gateway.
 * 
 * Model Format: "provider/model-name"
 * - Provider: google, openai, anthropic, etc.
 * - Model name: specific model identifier
 * 
 * Usage:
 * - Models are passed to gateway() function: gateway("google/gemini-2.5-pro")
 * - Gateway provides unified access to multiple providers
 * 
 * Reference:
 * - Vercel AI Gateway: https://vercel.com/docs/ai-gateway
 * - Model Providers: https://vercel.com/docs/ai-gateway/models-and-providers
 */

export type ModelProvider = "google" | "openai" | "anthropic" | "meta" | "mistral" | "cohere";

export interface ModelInfo {
  /** Gateway model ID (e.g., "google/gemini-2.5-pro") */
  id: string;
  /** Display name for UI */
  name: string;
  /** Provider name */
  provider: ModelProvider;
  /** Optional description */
  description?: string;
  /** Optional: Model capabilities or use cases */
  tags?: string[];
}

/**
 * Available models via Vercel AI Gateway.
 * 
 * Based on Vercel AI Gateway supported models:
 * https://vercel.com/docs/ai-gateway/models-and-providers
 * 
 * This list should be updated when new models become available.
 * 
 * Note: Vercel AI Gateway does not provide a public API to list models,
 * so we maintain this static list. It's easy to update - just add new
 * models to the array below.
 */
export const AVAILABLE_MODELS: readonly ModelInfo[] = [
  // Google Models
  {
    id: "google/gemini-2.5-pro",
    name: "Google Gemini 2.5 Pro",
    provider: "google",
    description: "Google's most capable model for complex tasks",
    tags: ["latest", "multimodal", "long-context"],
  },
  {
    id: "google/gemini-2.0-flash-exp",
    name: "Google Gemini 2.0 Flash (Experimental)",
    provider: "google",
    description: "Fast and efficient model for quick responses",
    tags: ["fast", "experimental"],
  },
  {
    id: "google/gemini-1.5-pro",
    name: "Google Gemini 1.5 Pro",
    provider: "google",
    description: "Previous generation Pro model",
    tags: ["stable"],
  },
  {
    id: "google/gemini-1.5-flash",
    name: "Google Gemini 1.5 Flash",
    provider: "google",
    description: "Fast and efficient model",
    tags: ["fast"],
  },

  // OpenAI Models
  {
    id: "openai/gpt-4o",
    name: "OpenAI GPT-4o",
    provider: "openai",
    description: "OpenAI's most advanced model with multimodal capabilities",
    tags: ["latest", "multimodal"],
  },
  {
    id: "openai/gpt-4o-mini",
    name: "OpenAI GPT-4o Mini",
    provider: "openai",
    description: "Faster and more affordable version of GPT-4o",
    tags: ["fast", "cost-effective"],
  },
  {
    id: "openai/gpt-4-turbo",
    name: "OpenAI GPT-4 Turbo",
    provider: "openai",
    description: "Previous generation with improved speed",
    tags: ["stable"],
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "OpenAI GPT-3.5 Turbo",
    provider: "openai",
    description: "Fast and cost-effective for simpler tasks",
    tags: ["fast", "cost-effective"],
  },

  // Anthropic Models
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Anthropic Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Anthropic's most capable model for complex reasoning",
    tags: ["latest", "reasoning"],
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Anthropic Claude 3 Opus",
    provider: "anthropic",
    description: "Most powerful Claude model for complex tasks",
    tags: ["powerful"],
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Anthropic Claude 3 Sonnet",
    provider: "anthropic",
    description: "Balanced performance and speed",
    tags: ["balanced"],
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Anthropic Claude 3 Haiku",
    provider: "anthropic",
    description: "Fastest Claude model for quick responses",
    tags: ["fast"],
  },

  // Meta Models
  {
    id: "meta/llama-3.1-405b",
    name: "Meta Llama 3.1 405B",
    provider: "meta",
    description: "Meta's largest open model",
    tags: ["open-source", "large"],
  },
  {
    id: "meta/llama-3.1-70b",
    name: "Meta Llama 3.1 70B",
    provider: "meta",
    description: "Balanced open model",
    tags: ["open-source"],
  },
  {
    id: "meta/llama-3.1-8b",
    name: "Meta Llama 3.1 8B",
    provider: "meta",
    description: "Fast open model",
    tags: ["open-source", "fast"],
  },

  // Mistral Models
  {
    id: "mistral/mistral-large",
    name: "Mistral Large",
    provider: "mistral",
    description: "Mistral's most capable model",
    tags: ["latest"],
  },
  {
    id: "mistral/mistral-medium",
    name: "Mistral Medium",
    provider: "mistral",
    description: "Balanced performance",
    tags: ["balanced"],
  },
  {
    id: "mistral/mistral-small",
    name: "Mistral Small",
    provider: "mistral",
    description: "Fast and efficient",
    tags: ["fast"],
  },

  // Cohere Models
  {
    id: "cohere/command-r-plus",
    name: "Cohere Command R+",
    provider: "cohere",
    description: "Cohere's most capable model",
    tags: ["latest"],
  },
  {
    id: "cohere/command-r",
    name: "Cohere Command R",
    provider: "cohere",
    description: "Balanced performance",
    tags: ["balanced"],
  },
] as const;

/**
 * Get all available models.
 */
export function getAvailableModels(): ModelInfo[] {
  return [...AVAILABLE_MODELS];
}

/**
 * Get models by provider.
 */
export function getModelsByProvider(provider: ModelProvider): ModelInfo[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}

/**
 * Get a specific model by ID.
 */
export function getModelById(id: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id);
}

/**
 * Get default model (used as fallback).
 */
export function getDefaultModel(): ModelInfo {
  return AVAILABLE_MODELS.find((m) => m.id === "google/gemini-2.5-pro") || AVAILABLE_MODELS[0];
}

/**
 * Validate if a model ID is available.
 */
export function isValidModelId(modelId: string): boolean {
  return AVAILABLE_MODELS.some((model) => model.id === modelId);
}
