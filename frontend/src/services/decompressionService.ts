import {
  API_BASE_URL,
  parseArchiveStats,
  parseContentDispositionFilename,
  parseErrorFromResponse,
  ApiErrorResponse,
} from './apiClient';
import type { DecompressionResult } from '../types/compression';
import { downloadBlob } from './compressionService';

/**
 * Service communicating with POST /api/decompress.
 * Sends multipart .huf binary archive and extracts restored plain text and metrics.
 */
export async function decompressFile(file: File): Promise<DecompressionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/decompress`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw await parseErrorFromResponse(response);
    }

    const blob = await response.blob();
    const text = await blob.text();
    const disposition = response.headers.get('Content-Disposition');
    const fallbackName = file.name.replace(/\.[^/.]+$/, '') + '.txt';
    const filename = parseContentDispositionFilename(disposition, fallbackName);
    const stats = parseArchiveStats(response.headers);

    return {
      blob,
      text,
      filename,
      stats,
    };
  } catch (error) {
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    throw new ApiErrorResponse(0, error instanceof Error ? error.message : 'Network failure during decompression');
  }
}

export const decompressionService = {
  decompressFile,
  downloadBlob,
};
