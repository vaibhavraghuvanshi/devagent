export type Tier = "instant" | "balanced" | "reasoning" | "deep" | "agentic";

export interface ModelConfig {
  id: string;
  label: string;
  tier: Tier;
  speedTps: number;
  contextWindow: number;
  useCase: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B instant",
    tier: "instant",
    speedTps: 560,
    contextWindow: 131072,
    useCase: "Quick fixes, autocomplete, simple edits",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B versatile",
    tier: "balanced",
    speedTps: 280,
    contextWindow: 131072,
    useCase: "Everyday coding chat, reviews, explanations",
  },
  {
    id: "qwen/qwen3-32b",
    label: "Qwen3 32B",
    tier: "reasoning",
    speedTps: 400,
    contextWindow: 131072,
    useCase: "Debugging, algorithms, step by step logic",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    tier: "deep",
    speedTps: 500,
    contextWindow: 131072,
    useCase: "Large refactors, system design, big context",
  },
  {
    id: "groq/compound",
    label: "Groq compound",
    tier: "agentic",
    speedTps: 450,
    contextWindow: 131072,
    useCase: "Autonomous tool use, web search, code execution",
  },
];

export const getModelById = (id: string): ModelConfig | undefined => {
  return MODELS.find((m) => m.id === id);
};

export const getTierColor = (tier: Tier): string => {
  const colors: Record<Tier, string> = {
    instant: "bg-tier-instant",
    balanced: "bg-tier-balanced",
    reasoning: "bg-tier-reasoning",
    deep: "bg-tier-deep",
    agentic: "bg-tier-agentic",
  };
  return colors[tier];
};

export const getTierTextColor = (tier: Tier): string => {
  const colors: Record<Tier, string> = {
    instant: "text-tier-instant",
    balanced: "text-tier-balanced",
    reasoning: "text-tier-reasoning",
    deep: "text-tier-deep",
    agentic: "text-tier-agentic",
  };
  return colors[tier];
};
