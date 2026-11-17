import { API_BASE_URL, parseErrorFromResponse, ApiErrorResponse } from './apiClient';
import type { AnalysisResult } from '../types/compression';

/**
 * Service communicating with POST /api/analyze.
 * Retrieves real character frequencies, Huffman codes, and hierarchical tree topology.
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  const url = `${API_BASE_URL}/api/analyze`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw await parseErrorFromResponse(response);
    }

    return (await response.json()) as AnalysisResult;
  } catch (error) {
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    throw new ApiErrorResponse(0, error instanceof Error ? error.message : 'Analysis request failed');
  }
}

/**
 * Analyzes an uploaded text file using the backend algorithm engine.
 */
export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/analyze`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw await parseErrorFromResponse(response);
    }

    return (await response.json()) as AnalysisResult;
  } catch (error) {
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    throw new ApiErrorResponse(0, error instanceof Error ? error.message : 'File analysis failed');
  }
}

export const analysisService = {
  analyzeText,
  analyzeFile,
};
