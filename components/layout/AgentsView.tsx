"use client";

import { useChatStore } from "@/lib/store";
import { MODELS, getTierTextColor, ModelConfig } from "@/lib/models";
import {
  Zap,
  MessageSquare,
  Brain,
  Layers,
  Bot,
  ArrowRight,
  CheckCircle2,
  Gauge,
  BookOpen,
} from "lucide-react";

const TIER_META: Record<
  string,
  { icon: React.ElementType; gradient: string; desc: string }
> = {
  instant: {
    icon: Zap,
    gradient: "linear-gradient(135deg,#10B981 0%,#34D399 100%)",
    desc: "Fastest responses, great for quick tasks and autocomplete.",
  },
  balanced: {
    icon: MessageSquare,
    gradient: "linear-gradient(135deg,#15b728 0%,#4ade80 100%)",
    desc: "Best all-rounder. Handles code, reviews and explanations well.",
  },
  reasoning: {
    icon: Brain,
    gradient: "linear-gradient(135deg,#F59E0B 0%,#FBBF24 100%)",
    desc: "Step-by-step thinker. Ideal for debugging and algorithms.",
  },
  deep: {
    icon: Layers,
    gradient: "linear-gradient(135deg,#8B5CF6 0%,#A78BFA 100%)",
    desc: "Long-context powerhouse. Tackles large refactors and design.",
  },
  agentic: {
    icon: Bot,
    gradient: "linear-gradient(135deg,#EF4444 0%,#F87171 100%)",
    desc: "Autonomous agent with tool use, search and code execution.",
  },
};

function AgentCard({
  model,
  isActive,
  onSelect,
}: {
  model: ModelConfig;
  isActive: boolean;
  onSelect: () => void;
}) {
  const meta = TIER_META[model.tier] ?? TIER_META.balanced;
  const Icon = meta.icon;

  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col gap-4 p-5 rounded-2xl border cursor-pointer transition-all group ${
        isActive
          ? "border-[#15b728] bg-[#e8f9ea] dark:bg-[#0d2310]"
          : "border-[#E5E7EB] dark:border-[#243042] bg-white dark:bg-[#111827] hover:border-[#15b728] hover:shadow-md"
      }`}
    >
      {/* Active badge */}
      {isActive && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="w-5 h-5 text-[#15b728]" />
        </div>
      )}

      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: meta.gradient }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB] truncate">
            {model.label}
          </h3>
          <span
            className={`text-[10px] font-bold uppercase flex-shrink-0 ${getTierTextColor(model.tier)}`}
          >
            {model.tier}
          </span>
        </div>
        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
          {meta.desc}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
        <span className="flex items-center gap-1">
          <Gauge className="w-3 h-3" />
          {model.speedTps} TPS
        </span>
        <span className="w-px h-3 bg-[#E5E7EB] dark:bg-[#243042]" />
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {(model.contextWindow / 1000).toFixed(0)}K ctx
        </span>
      </div>

      {/* CTA */}
      <button
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
          isActive
            ? "text-white"
            : "text-[#15b728] bg-[#e8f9ea] dark:bg-white/5 hover:bg-[#d1f5d3] dark:hover:bg-[#15b728]/20"
        }`}
        style={isActive ? { background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" } : {}}
      >
        {isActive ? "Currently active" : "Start chat"}
        {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export function AgentsView() {
  const { selectedModel, setSelectedModel, setView, setCurrentMessages } =
    useChatStore();

  const handleSelect = (model: ModelConfig) => {
    setSelectedModel(model);
    setCurrentMessages([]);
    setView("chat");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f4f8] dark:bg-[#0B1020] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-1">
            Agents
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
            Choose an AI agent to power your next conversation. Each agent is
            optimized for different tasks.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODELS.map((model) => (
            <AgentCard
              key={model.id}
              model={model}
              isActive={selectedModel?.id === model.id}
              onSelect={() => handleSelect(model)}
            />
          ))}
        </div>

        {/* Active model summary */}
        {selectedModel && (
          <div className="mt-8 flex items-center gap-3 p-4 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  TIER_META[selectedModel.tier]?.gradient ??
                  "linear-gradient(135deg,#15b728,#22d63b)",
              }}
            >
              {(() => {
                const Icon =
                  TIER_META[selectedModel.tier]?.icon ?? Bot;
                return <Icon className="w-4 h-4 text-white" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#9CA3AF]">Active agent</p>
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {selectedModel.label}
              </p>
            </div>
            <button
              onClick={() => setView("chat")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
            >
              Open chat <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
