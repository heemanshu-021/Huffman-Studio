/**
 * Architectural domain types for the Huffman compression engine (Phases 2-6).
 */

export interface CompressionStats {
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number;
  spaceSavingsPercent: number;
  executionTimeMs: number;
}

export interface HuffmanTreeNode {
  id: string;
  frequency: number;
  character?: string;
  asciiCode?: number;
  isLeaf: boolean;
  left?: HuffmanTreeNode;
  right?: HuffmanTreeNode;
  code?: string;
}

export interface CodeTableEntry {
  character: string;
  asciiCode: number;
  frequency: number;
  code: string;
  bitLength: number;
}
