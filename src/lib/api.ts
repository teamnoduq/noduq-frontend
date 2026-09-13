export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function apiBase(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError(0, "CONFIG", "Falta NEXT_PUBLIC_API_URL en .env.local");
  }
  return url.replace(/\/$/, "");
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  token?: string | null,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK",
      "El servidor no responde. Inténtalo de nuevo.",
    );
  }

  const text = await res.text();
  const data = parseBody(text);

  if (!res.ok) {
    const err = data as { code?: string; message?: string } | null;
    throw new ApiError(
      res.status,
      err?.code ?? "ERROR",
      err?.message ?? `No se pudo completar la petición (${res.status}).`,
    );
  }

  return data as T;
}

export function isNotProvisioned(error: unknown): boolean {
  return error instanceof ApiError && error.code === "NOT_PROVISIONED";
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.code === "UNAUTHORIZED");
}
