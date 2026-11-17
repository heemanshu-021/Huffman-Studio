/**
 * Centralized HTTP API client for communication with the Spring Boot backend.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

import type { ArchiveStats } from '../types/compression';

export class ApiErrorResponse extends Error {
  status: number;
  errorCode?: string;
  data: unknown;

  constructor(status: number, message: string, data?: unknown, errorCode?: string) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.status = status;
    this.data = data;
    this.errorCode = errorCode;
  }
}

/**
 * Extracts and parses custom X-* archive statistics headers returned by the Java backend.
 */
export function parseArchiveStats(headers: Headers): ArchiveStats {
  const getNum = (name: string, fallback = 0): number => {
    const val = headers.get(name);
    if (!val) return fallback;
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
  };

  return {
    originalBytes: getNum('X-Original-Bytes'),
    archiveBytes: getNum('X-Archive-Bytes'),
    payloadBits: getNum('X-Payload-Bits'),
    payloadBytes: getNum('X-Payload-Bytes'),
    treeBytes: getNum('X-Tree-Bytes'),
    headerBytes: getNum('X-Header-Bytes'),
    bytesSaved: getNum('X-Bytes-Saved'),
    compressionRatio: getNum('X-Compression-Ratio'),
    percentageSaved: getNum('X-Percentage-Saved'),
  };
}

/**
 * Safely parses the filename attribute from Content-Disposition header.
 */
export function parseContentDispositionFilename(header: string | null, fallback: string): string {
  if (!header) return fallback;

  // Check for RFC 5987 / UTF-8 format filename*=UTF-8''...
  const utf8Match = header.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // ignore decoding error
    }
  }

  // Check for standard filename="..."
  const standardMatch = header.match(/filename=["']?([^"';\n]+)["']?/i);
  if (standardMatch && standardMatch[1]) {
    let name = standardMatch[1].trim();
    // Strip Spring Boot mime-word encoding if present e.g. =?UTF-8?Q?name?=
    if (name.startsWith('=?') && name.endsWith('?=')) {
      name = name.replace(/=\?[^?]+\?[BQ]\?([^?]+)\?=/i, '$1');
    }
    return name;
  }

  return fallback;
}

export async function parseErrorFromResponse(response: Response): Promise<ApiErrorResponse> {
  let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
  let errorCode: string | undefined = undefined;
  let errorBody: unknown = null;
  try {
    errorBody = await response.json();
    if (errorBody && typeof errorBody === 'object') {
      const obj = errorBody as { message?: string; errorCode?: string; error?: string };
      if (obj.message) {
        errorMessage = String(obj.message);
      }
      if (obj.errorCode) {
        errorCode = String(obj.errorCode);
      }
    }
  } catch {
    // Response wasn't JSON
  }
  return new ApiErrorResponse(response.status, errorMessage, errorBody, errorCode);
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
