export function getSupabaseErrorMessage(error: unknown) {
  if (!error) return "Unknown error.";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const maybe = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts: string[] = [];
    if (typeof maybe.message === "string" && maybe.message) parts.push(maybe.message);
    if (typeof maybe.details === "string" && maybe.details) parts.push(maybe.details);
    if (typeof maybe.hint === "string" && maybe.hint) parts.push(maybe.hint);
    if (typeof maybe.code === "string" && maybe.code) parts.push(`code=${maybe.code}`);
    if (parts.length) return parts.join(" • ");
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error.";
  }
}

