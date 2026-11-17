/**
 * Type contracts for Huffman compression, decompression, statistics, and analysis.
 */

export interface ArchiveStats {
  originalBytes: number;
  archiveBytes: number;
  payloadBits: number;
  payloadBytes: number;
  treeBytes: number;
  headerBytes: number;
  bytesSaved: number;
  compressionRatio: number;
  percentageSaved: number;
}

export interface CompressionResult {
  blob: Blob;
  filename: string;
  stats: ArchiveStats;
}

export interface DecompressionResult {
  blob: Blob;
  text: string;
  filename: string;
  stats?: ArchiveStats;
}

export interface TreeNode {
  id: string;
  frequency: number;
  codePoint?: number;
  character?: string;
  displayCharacter: string;
  isLeaf: boolean;
  code?: string;
  left?: TreeNode;
  right?: TreeNode;
}

export interface CharacterFrequency {
  codePoint: number;
  character: string;
  displayCharacter: string;
  frequency: number;
  percentage: number;
}

export interface CodeTableEntry {
  codePoint: number;
  character: string;
  displayCharacter: string;
  code: string;
  bitLength: number;
  frequency: number;
}

export interface AnalysisResult {
  originalText: string;
  characterCount: number;
  uniqueCharacterCount: number;
  originalByteSize: number;
  encodedBitCount: number;
  encodedByteCount: number;
  compressionRatio: number;
  percentageSaved: number;
  encodedBitString: string;
  frequencies: CharacterFrequency[];
  codeTable: CodeTableEntry[];
  tree: TreeNode | null;
}

export interface SessionOperation {
  id: string;
  type: 'COMPRESS' | 'DECOMPRESS';
  fileName: string;
  originalSize: number;
  processedSize: number;
  timestamp: string;
  ratio?: number;
  savingsPercent?: number;
}

export interface SessionStats {
  totalCompressed: number;
  totalDecompressed: number;
  totalOriginalBytes: number;
  totalArchiveBytes: number;
  totalBytesSaved: number;
  operations: SessionOperation[];
}
