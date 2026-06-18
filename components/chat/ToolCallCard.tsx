"use client";

import { ToolCall } from "@/lib/store";
import { Terminal, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { useState } from "react";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const hasResult = !!toolCall.result;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${toolCall.name}\nArgs: ${JSON.stringify(toolCall.args, null, 2)}\nResult: ${toolCall.result || "Pending..."}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isError =
    toolCall.result?.toLowerCase().includes("error") ||
    toolCall.result?.toLowerCase().includes("failed");

  return (
    <div className="border border-primary rounded-lg bg-secondary overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-tertiary border-b border-primary flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-sm font-semibold text-primary">
            {toolCall.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasResult && (
            <>
              {isError ? (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs text-red-600 font-medium">Error</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Done</span>
                </div>
              )}
            </>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-10"
          >
            <Copy className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </div>

      {/* Args */}
      <div className="px-4 py-3 bg-primary">
        <p className="text-xs text-secondary mb-2 font-medium">Arguments:</p>
        <pre className="text-xs bg-secondary p-2 rounded border border-primary overflow-x-auto font-mono text-primary">
          {JSON.stringify(toolCall.args, null, 2)}
        </pre>
      </div>

      {/* Result */}
      {hasResult && (
        <div className="px-4 py-3 border-t border-primary bg-primary">
          <p className="text-xs text-secondary mb-2 font-medium">Result:</p>
          <pre
            className={`text-xs p-2 rounded border overflow-x-auto font-mono whitespace-pre-wrap break-words ${
              isError
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                : "bg-secondary border-primary text-primary"
            }`}
          >
            {toolCall.result}
          </pre>
        </div>
      )}

      {/* Loading indicator */}
      {!hasResult && (
        <div className="px-4 py-3 border-t border-primary bg-primary">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent" />
            <span className="text-xs text-secondary font-medium">Executing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
