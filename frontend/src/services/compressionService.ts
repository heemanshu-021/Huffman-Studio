import {
  API_BASE_URL,
  parseArchiveStats,
  parseContentDispositionFilename,
  parseErrorFromResponse,
  ApiErrorResponse,
} from './apiClient';
import type { CompressionResult } from '../types/compression';

/**
 * Service communicating with POST /api/compress.
 * Sends multipart text file and extracts binary archive along with real headers.
 */
export async function compressFile(file: File): Promise<CompressionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/compress`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw await parseErrorFromResponse(response);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    const fallbackName = file.name.replace(/\.[^/.]+$/, '') + '.huf';
    const filename = parseContentDispositionFilename(disposition, fallbackName);
    const stats = parseArchiveStats(response.headers);

    return {
      blob,
      filename,
      stats,
    };
  } catch (error) {
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    throw new ApiErrorResponse(0, error instanceof Error ? error.message : 'Network failure during compression');
  }
}

/**
 * Triggers a browser download of a Blob payload.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const compressionService = {
  compressFile,
  downloadBlob,
};
