const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

class ApiClientError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("oradent_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("oradent_token");
      localStorage.removeItem("oradent_provider");
      localStorage.removeItem("oradent_practice");
      window.location.href = "/login";
    }
    throw new ApiClientError("Unauthorized", 401);
  }

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: response.statusText || "An unknown error occurred",
        statusCode: response.status,
      };
    }
    throw new ApiClientError(
      errorData.message || "Request failed",
      response.status,
      errorData.errors
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiGet<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
    signal: options?.signal,
  });

  return handleResponse<T>(response);
}

export async function apiPost<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  return handleResponse<T>(response);
}

export async function apiPut<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  return handleResponse<T>(response);
}

export async function apiPatch<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  return handleResponse<T>(response);
}

export async function apiDelete<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
    signal: options?.signal,
  });

  return handleResponse<T>(response);
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options?: RequestOptions
): Promise<T> {
  const headers: Record<string, string> = {};

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("oradent_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...headers,
      ...options?.headers,
    },
    body: formData,
    signal: options?.signal,
  });

  return handleResponse<T>(response);
}

export { ApiClientError };
export type { ApiError, RequestOptions };
