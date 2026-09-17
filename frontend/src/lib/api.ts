const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiRequest = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: request.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(request.token ? { Authorization: `Bearer ${request.token}` } : {}),
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let detail: unknown;
    try {
      const data = (await response.json()) as { detail?: unknown };
      detail = data.detail;
      if (data.detail) {
        message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // non-JSON error body — keep default message
    }
    throw new ApiError(response.status, message, detail);
  }

  return (await response.json()) as T;
}