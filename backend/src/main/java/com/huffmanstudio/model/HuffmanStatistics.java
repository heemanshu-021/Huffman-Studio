package com.huffmanstudio.model;

import com.huffmanstudio.algorithm.FrequencyCounter;

import java.nio.charset.StandardCharsets;

/**
 * Encapsulates quantifiable metrics and compression statistics computed from the Huffman encoding process.
 *
 * <p><b>Formulas and Calculations:</b>
 * <ul>
 *   <li><b>Original Byte Size:</b> Length in bytes of the original string encoded as UTF-8.</li>
 *   <li><b>Encoded Bit Count:</b> Total length of the generated Huffman bit string.</li>
 *   <li><b>Encoded Byte Count:</b> {@code (long) Math.ceil(encodedBitCount / 8.0)}.</li>
 *   <li><b>Compression Ratio:</b> {@code originalByteSize / (double) encodedByteCount}
 *       (e.g., 2.0 indicates 2:1 compression). Returns {@code 0.0} if original or encoded size is 0.</li>
 *   <li><b>Percentage Saved:</b> {@code (1.0 - ((double) encodedByteCount / originalByteSize)) * 100.0}.
 *       Returns {@code 0.0} if original size is 0.</li>
 * </ul>
 *
 * <p><i>Note on Scope:</i> These values reflect theoretical payload stream compression.
 * The eventual physical {@code .huf} archive format in Phase 3 will include container headers
 * and serialized tree metadata.
 */
public record HuffmanStatistics(
        long originalCodePointCount,
        int uniqueCharacterCount,
        long originalByteSize,
        long encodedBitCount,
        long encodedByteCount,
        double compressionRatio,
        double percentageSaved
) {

    /**
     * Factory method computing compression metrics from the original text and encoded bit string.
     *
     * @param originalText     the raw text prior to encoding (empty or null handled safely)
     * @param encodedBitString the generated bit string of '0' and '1' characters
     * @param uniqueCharacters number of distinct characters in the alphabet
     * @return populated HuffmanStatistics instance with non-null, validated figures
     */
    public static HuffmanStatistics calculate(
            String originalText,
            String encodedBitString,
            int uniqueCharacters
    ) {
        if (originalText == null || originalText.isEmpty()) {
            return new HuffmanStatistics(0, 0, 0, 0, 0, 0.0, 0.0);
        }

        long codePointCount = FrequencyCounter.countCodePoints(originalText);
        long origBytes = originalText.getBytes(StandardCharsets.UTF_8).length;
        long bitCount = (encodedBitString != null) ? encodedBitString.length() : 0;
        long byteCount = (long) Math.ceil(bitCount / 8.0);

        double ratio = 0.0;
        if (origBytes > 0 && byteCount > 0) {
            ratio = (double) origBytes / (double) byteCount;
        }

        double savedPercent = 0.0;
        if (origBytes > 0) {
            savedPercent = (1.0 - ((double) byteCount / (double) origBytes)) * 100.0;
        }

        return new HuffmanStatistics(
                codePointCount,
                uniqueCharacters,
                origBytes,
                bitCount,
                byteCount,
                ratio,
                savedPercent
        );
    }
}
