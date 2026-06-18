/**
 * Re-exports for legacy imports. Implementations live in `@/lib/agent-tools`.
 */
export {
  AGENT_TOOL_DEFINITIONS,
  AGENT_TOOL_DEFINITIONS as TOOL_SCHEMAS,
  executeAgentTool,
  executeAgentTool as executeTool,
} from "@/lib/agent-tools";

export type ToolSchema = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
};
