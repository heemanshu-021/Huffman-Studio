package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;
import com.huffmanstudio.model.HuffmanResult;
import com.huffmanstudio.model.HuffmanStatistics;

import java.util.Map;

/**
 * Top-level coordinator for the Huffman coding engine.
 *
 * <p>Orchestrates the individual algorithm stages:
 * <ol>
 *   <li>{@link FrequencyCounter}: counts Unicode character occurrences.</li>
 *   <li>{@link HuffmanTreeBuilder}: constructs optimal binary tree using priority queue.</li>
 *   <li>{@link HuffmanCodeGenerator}: assigns prefix-free binary codes via DFS.</li>
 *   <li>{@link HuffmanEncoder}: translates source text into binary bit string.</li>
 *   <li>{@link HuffmanStatistics}: evaluates code point count, bit count, ratio, and space savings.</li>
 * </ol>
 */
public final class HuffmanCompressor {

    private HuffmanCompressor() {
        // Static utility class
    }

    /**
     * Executes the complete Huffman compression workflow on the provided text.
     *
     * @param text input text to compress (empty or null returns an empty result)
     * @return fully populated {@link HuffmanResult} containing tree, codes, bit string, and metrics
     */
    public static HuffmanResult compress(String text) {
        if (text == null || text.isEmpty()) {
            return HuffmanResult.empty();
        }

        // 1. Calculate symbol frequencies
        Map<Integer, Integer> frequencyMap = FrequencyCounter.countFrequencies(text);

        // 2. Build deterministic Huffman tree
        HuffmanNode root = HuffmanTreeBuilder.buildTree(frequencyMap);

        // 3. Generate prefix-free codes
        Map<Integer, String> codeTable = HuffmanCodeGenerator.generateCodes(root);

        // 4. Encode text into bit string
        String encodedBitString = HuffmanEncoder.encode(text, codeTable);

        // 5. Compute compression statistics
        HuffmanStatistics statistics = HuffmanStatistics.calculate(
                text,
                encodedBitString,
                frequencyMap.size()
        );

        return new HuffmanResult(
                text,
                root,
                frequencyMap,
                codeTable,
                encodedBitString,
                statistics
        );
    }

    /**
     * Decompresses an encoded bit string using the corresponding Huffman tree root.
     *
     * @param bitString binary bit string of '0' and '1' characters
     * @param root      root node of the Huffman tree
     * @return original restored text string
     */
    public static String decompress(String bitString, HuffmanNode root) {
        return HuffmanDecoder.decode(bitString, root);
    }

    /**
     * Convenience method to decompress a {@link HuffmanResult} back to original text.
     *
     * @param result previous compression result
     * @return restored text string
     */
    public static String decompress(HuffmanResult result) {
        if (result == null) {
            return "";
        }
        return decompress(result.getEncodedBitString(), result.getRootNode());
    }
}
