/**
 * Centralized HTTP API client for communication with the Spring Boot backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class ApiErrorResponse extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.status = status;
    this.data = data;
  }
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      let errorBody: unknown = null;
      try {
        errorBody = await response.json();
        if (errorBody && typeof errorBody === 'object' && 'message' in errorBody) {
          errorMessage = String((errorBody as { message: string }).message);
        }
      } catch {
        // Response wasn't JSON
      }
      throw new ApiErrorResponse(response.status, errorMessage, errorBody);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    throw new ApiErrorResponse(0, error instanceof Error ? error.message : 'Network request failed');
  }
}
