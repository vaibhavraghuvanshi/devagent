export function getPrismaDelegate<T>(
  delegate: T | undefined,
  modelName: string
): T {
  if (!delegate) {
    throw new Error(
      `Prisma client is missing model delegate "${modelName}". Run "npm run prisma:generate" and restart the dev server.`
    );
  }
  return delegate;
}
