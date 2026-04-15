export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "UNAUTHORIZED"
  | "UNKNOWN_ERROR";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: AppErrorCode = "UNKNOWN_ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toAppError(
  error: unknown,
  fallbackMessage = "Unexpected error"
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR", error);
  }

  return new AppError(fallbackMessage, "UNKNOWN_ERROR", error);
}
