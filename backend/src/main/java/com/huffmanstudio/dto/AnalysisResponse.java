package com.huffmanstudio.dto;

import java.util.List;

/**
 * Complete analysis payload returned by the Huffman algorithm engine.
 *
 * @param originalText          source text analyzed
 * @param characterCount        total Unicode code points
 * @param uniqueCharacterCount  distinct symbols in alphabet
 * @param originalByteSize      UTF-8 byte length
 * @param encodedBitCount       total bits required for encoded payload
 * @param encodedByteCount      ceil(encodedBitCount / 8)
 * @param compressionRatio      ratio of original bytes to encoded bytes
 * @param percentageSaved       space savings percentage
 * @param encodedBitString      full binary bit string ('0' and '1')
 * @param frequencies           sorted list of character frequencies
 * @param codeTable             sorted list of prefix codes
 * @param tree                  root node of the constructed Huffman tree
 */
public record AnalysisResponse(
        String originalText,
        int characterCount,
        int uniqueCharacterCount,
        long originalByteSize,
        long encodedBitCount,
        long encodedByteCount,
        double compressionRatio,
        double percentageSaved,
        String encodedBitString,
        List<CharacterFrequencyDto> frequencies,
        List<CodeTableEntryDto> codeTable,
        TreeNodeDto tree
) {
}
