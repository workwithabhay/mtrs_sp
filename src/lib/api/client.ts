import type { ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

export class ApiClientError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isStateChanging) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers['x-csrf-token'] && !headers['X-CSRF-Token']) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include', // Strictly required for HTTP-only session cookies
  });

  let json: ApiResponse<T> | null = null;
  try {
    json = await response.json();
  } catch {
    // Non-JSON or empty response
  }

  if (!response.ok || !json?.success) {
    const errorPayload = json?.error;
    const message = errorPayload?.message || `Request failed with status ${response.status}`;
    const code = errorPayload?.code || `HTTP_${response.status}`;
    throw new ApiClientError(message, code, response.status, errorPayload?.details);
  }

  return json.data;
}
