"use client";

import { MODELS, getTierTextColor } from "@/lib/models";
import { useChatStore } from "@/lib/store";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f4f4f8] dark:bg-white/5 border border-[#E5E7EB] dark:border-[#243042] hover:border-[#15b728] text-sm font-medium text-[#111827] dark:text-[#F9FAFB] transition-all"
      >
        {selectedModel ? (
          <>
            <span
              className={`w-2 h-2 rounded-full ${getTierTextColor(
                selectedModel.tier
              ).replace("text-", "bg-")}`}
            />
            <span>{selectedModel.label}</span>
          </>
        ) : (
          "Select model"
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl z-50 overflow-hidden"
          style={{ boxShadow: "0 20px 50px rgba(15,23,42,0.15)" }}>
          <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                  selectedModel?.id === model.id
                    ? "text-white"
                    : "text-[#111827] dark:text-[#F9FAFB] hover:bg-[#f4f4f8] dark:hover:bg-white/5"
                }`}
                style={selectedModel?.id === model.id ? { background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" } : {}}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold text-sm">{model.label}</span>
                  <span
                    className={`text-xs font-bold ${getTierTextColor(
                      model.tier
                    )}`}
                  >
                    {model.tier.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs opacity-75 line-clamp-2">
                  {model.useCase}
                </p>
                <div className="flex gap-2 mt-2 text-xs opacity-60">
                  <span>{model.speedTps} TPS</span>
                  <span>•</span>
                  <span>{(model.contextWindow / 1000).toFixed(0)}K tokens</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
