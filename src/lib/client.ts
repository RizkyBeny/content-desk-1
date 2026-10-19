export class ClientError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "ClientError";
    this.status = status;
    this.code = code;
  }
}

interface Envelope {
  error?: string;
  code?: string;
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T & Envelope) : ({} as T & Envelope);
  if (!res.ok) {
    throw new ClientError(data.error ?? "Terjadi kesalahan.", res.status, data.code);
  }
  return data as T;
}

export const post = <T>(url: string, body?: unknown) =>
  apiFetch<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined });

export const patch = <T>(url: string, body?: unknown) =>
  apiFetch<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
