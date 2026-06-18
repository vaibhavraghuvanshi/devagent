import path from "path";

const WORKSPACE_ROOT = process.cwd();

/**
 * Resolve a user-supplied path to an absolute path under the workspace root.
 * Rejects absolute paths and `..` segments.
 */
export function resolveWorkspacePath(relativePath: string): string {
  const normalized = path.normalize(relativePath).replace(/^(\.\/)+/, "");
  if (path.isAbsolute(normalized)) {
    throw new Error("Absolute paths are not allowed");
  }
  if (normalized.startsWith("..") || normalized.includes(`..${path.sep}`)) {
    throw new Error("Path escapes workspace");
  }
  const resolved = path.resolve(WORKSPACE_ROOT, normalized);
  if (
    resolved !== WORKSPACE_ROOT &&
    !resolved.startsWith(WORKSPACE_ROOT + path.sep)
  ) {
    throw new Error("Path escapes workspace");
  }
  return resolved;
}

export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}
