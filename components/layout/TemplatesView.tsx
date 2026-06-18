"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/store";
import {
  Code2,
  Pencil,
  BarChart2,
  Lightbulb,
  Globe,
  Bug,
  Mail,
  FileText,
  GitBranch,
  Layers,
  CheckSquare,
  Cpu,
} from "lucide-react";

type Category = "All" | "Code" | "Writing" | "Analysis" | "Debug" | "Plan";

interface Template {
  id: string;
  category: Exclude<Category, "All">;
  title: string;
  description: string;
  prompt: string;
  icon: React.ElementType;
  color: string;
}

const TEMPLATES: Template[] = [
  // Code
  {
    id: "write-fn",
    category: "Code",
    title: "Write a function",
    description: "Generate a clean, documented function from a description.",
    prompt: "Write a well-documented function that ",
    icon: Code2,
    color: "#15b728",
  },
  {
    id: "code-review",
    category: "Code",
    title: "Code review",
    description: "Get actionable feedback on your code quality and style.",
    prompt: "Review the following code for bugs, style issues, and improvements:\n\n```\n\n```",
    icon: GitBranch,
    color: "#15b728",
  },
  {
    id: "refactor",
    category: "Code",
    title: "Refactor code",
    description: "Clean up messy code while preserving behaviour.",
    prompt: "Refactor the following code to be cleaner and more maintainable:\n\n```\n\n```",
    icon: Cpu,
    color: "#15b728",
  },
  // Writing
  {
    id: "draft-email",
    category: "Writing",
    title: "Draft email",
    description: "Write a professional email for any situation.",
    prompt: "Draft a professional email for the following situation: ",
    icon: Mail,
    color: "#15b728",
  },
  {
    id: "summarize",
    category: "Writing",
    title: "Summarize text",
    description: "Condense long content into key bullet points.",
    prompt: "Summarize the following text into clear, concise bullet points:\n\n",
    icon: FileText,
    color: "#15b728",
  },
  {
    id: "translate",
    category: "Writing",
    title: "Translate",
    description: "Translate text accurately while preserving tone.",
    prompt: "Translate the following text to ",
    icon: Globe,
    color: "#06B6D4",
  },
  // Analysis
  {
    id: "explain",
    category: "Analysis",
    title: "Explain concept",
    description: "Get a clear, simple explanation with examples.",
    prompt: "Explain the concept of ",
    icon: Lightbulb,
    color: "#F59E0B",
  },
  {
    id: "compare",
    category: "Analysis",
    title: "Compare options",
    description: "Side-by-side comparison with pros and cons.",
    prompt: "Compare the following options with a pros/cons table:\n\n",
    icon: Layers,
    color: "#F59E0B",
  },
  {
    id: "analyze-data",
    category: "Analysis",
    title: "Analyze data",
    description: "Interpret data, find patterns, and summarize insights.",
    prompt: "Analyze the following data and provide key insights:\n\n",
    icon: BarChart2,
    color: "#F59E0B",
  },
  // Debug
  {
    id: "find-bug",
    category: "Debug",
    title: "Find the bug",
    description: "Pinpoint what's wrong and how to fix it.",
    prompt: "Find and explain the bug in this code, then provide a fix:\n\n```\n\n```",
    icon: Bug,
    color: "#EF4444",
  },
  {
    id: "explain-error",
    category: "Debug",
    title: "Explain error",
    description: "Decode an error message and learn how to resolve it.",
    prompt: "Explain this error message and how to fix it:\n\n",
    icon: Pencil,
    color: "#EF4444",
  },
  // Plan
  {
    id: "project-plan",
    category: "Plan",
    title: "Project plan",
    description: "Break a project into structured, actionable tasks.",
    prompt: "Create a detailed project plan with tasks and milestones for: ",
    icon: CheckSquare,
    color: "#10B981",
  },
  {
    id: "step-by-step",
    category: "Plan",
    title: "Step-by-step guide",
    description: "Turn any goal into a numbered how-to guide.",
    prompt: "Write a clear step-by-step guide for: ",
    icon: Layers,
    color: "#10B981",
  },
];

const CATEGORIES: Category[] = ["All", "Code", "Writing", "Analysis", "Debug", "Plan"];

const CATEGORY_COLOR: Record<Exclude<Category, "All">, string> = {
  Code: "#15b728",
  Writing: "#15b728",
  Analysis: "#F59E0B",
  Debug: "#EF4444",
  Plan: "#10B981",
};

function TemplateCard({
  template,
  onUse,
}: {
  template: Template;
  onUse: () => void;
}) {
  const Icon = template.icon;
  return (
    <button
      onClick={onUse}
      className="flex flex-col gap-3 p-4 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl text-left hover:border-[#15b728] hover:shadow-md transition-all group"
    >
      {/* Icon + category */}
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: template.color + "18" }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: template.color }} />
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: CATEGORY_COLOR[template.category] + "18",
            color: CATEGORY_COLOR[template.category],
          }}
        >
          {template.category}
        </span>
      </div>

      {/* Text */}
      <div>
        <p className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-0.5">
          {template.title}
        </p>
        <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-2">
          {template.description}
        </p>
      </div>

      {/* Hover CTA */}
      <div className="text-xs font-semibold text-[#15b728] opacity-0 group-hover:opacity-100 transition-opacity -mt-1">
        Use template →
      </div>
    </button>
  );
}

export function TemplatesView() {
  const { setView } = useChatStore();
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered =
    activeCategory === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUse = (template: Template) => {
    window.dispatchEvent(
      new CustomEvent("suggestion-click", { detail: template.prompt })
    );
    setView("chat");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f4f8] dark:bg-[#0B1020] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-1">
            Templates
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
            Jump-start your conversation with a ready-made prompt. Click any
            template to open it in the chat input.
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827]"
                  : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] hover:border-[#15b728]"
              }`}
            >
              {cat !== "All" && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      activeCategory === cat
                        ? "white"
                        : CATEGORY_COLOR[cat as Exclude<Category, "All">],
                  }}
                />
              )}
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={() => handleUse(template)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
