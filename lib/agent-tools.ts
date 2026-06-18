import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { resolveWorkspacePath, getWorkspaceRoot } from "@/lib/workspace-path";

const RUN_TIMEOUT_MS = 120_000;

export const AGENT_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "read",
      description:
        "Read the contents of a UTF-8 text file relative to the project root.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "File path relative to project root (no ..)",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write",
      description:
        "Create or overwrite a UTF-8 text file relative to the project root.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "File path relative to project root",
          },
          content: { type: "string", description: "Full new file contents" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "run",
      description:
        "Run a shell command in the project root (non-interactive). Prefer short commands.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Shell command to run (e.g. ls, yarn lint)",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "test",
      description:
        "Run the project's test script (yarn test or npm test) with optional extra CLI args.",
      parameters: {
        type: "object",
        properties: {
          args: {
            type: "string",
            description: "Extra arguments appended to the test command",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "diff",
      description:
        "Run git diff in the repo. Optionally restrict to specific paths (relative to root).",
      parameters: {
        type: "object",
        properties: {
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Optional list of paths relative to root",
          },
        },
      },
    },
  },
];

function runShell(
  command: string,
  cwd: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: { ...process.env, CI: "true", FORCE_COLOR: "0" },
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code });
    });
  });
}

function truncate(s: string, max = 48_000): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n[truncated ${s.length - max} chars]`;
}

export async function executeAgentTool(
  name: string,
  rawArgs: unknown
): Promise<string> {
  const args =
    rawArgs && typeof rawArgs === "object"
      ? (rawArgs as Record<string, unknown>)
      : {};

  const root = getWorkspaceRoot();

  try {
    switch (name) {
      case "read": {
        const p = String(args.path ?? "");
        const abs = resolveWorkspacePath(p);
        const buf = await fs.readFile(abs);
        return truncate(buf.toString("utf8"));
      }
      case "write": {
        const p = String(args.path ?? "");
        const content = String(args.content ?? "");
        const abs = resolveWorkspacePath(p);
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, content, "utf8");
        return `Wrote ${p} (${content.length} bytes)`;
      }
      case "run": {
        const command = String(args.command ?? "").trim();
        if (!command) return "Error: empty command";
        const { stdout, stderr, exitCode } = await runShell(
          command,
          root,
          RUN_TIMEOUT_MS
        );
        return truncate(
          `exit ${exitCode}\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`
        );
      }
      case "test": {
        const extra = String(args.args ?? "").trim();
        let script = `npm test --silent`;
        try {
          await fs.access(`${root}/yarn.lock`);
          script = `yarn test --silent`;
        } catch {
          /* npm */
        }
        if (extra) script += ` ${extra}`;
        const { stdout, stderr, exitCode } = await runShell(
          script,
          root,
          RUN_TIMEOUT_MS
        );
        return truncate(
          `exit ${exitCode}\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`
        );
      }
      case "diff": {
        const paths = Array.isArray(args.paths)
          ? (args.paths as unknown[]).map(String).filter(Boolean)
          : [];
        const safePaths = paths.map((rel) => resolveWorkspacePath(rel));
        const cmd =
          safePaths.length > 0
            ? `git diff -- ${safePaths.map((p) => quoteShellArg(p)).join(" ")}`
            : "git diff";
        const { stdout, stderr, exitCode } = await runShell(
          cmd,
          root,
          RUN_TIMEOUT_MS
        );
        return truncate(
          `exit ${exitCode}\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`
        );
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return `Error: ${msg}`;
  }
}

function quoteShellArg(p: string): string {
  if (!/[\\s'"`]/.test(p)) return p;
  return `'${p.replace(/'/g, `'\\''`)}'`;
}
