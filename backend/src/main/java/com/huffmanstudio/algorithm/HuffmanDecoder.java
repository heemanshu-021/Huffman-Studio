package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;

/**
 * Decodes binary Huffman bit strings back into original text by traversing a binary Huffman tree.
 *
 * <p>Validation &amp; Integrity Guarantees:
 * <ul>
 *   <li>Validates that the bit string strictly contains only binary characters ({@code '0'} and {@code '1'}).</li>
 *   <li>Detects and rejects corrupted or incomplete bit streams that end mid-tree.</li>
 *   <li>Properly reconstructs all Unicode code points, including multi-byte UTF-16 surrogate pairs (e.g. emojis).</li>
 *   <li>Correctly handles single-character trees where the leaf is the root.</li>
 * </ul>
 */
public final class HuffmanDecoder {

    private HuffmanDecoder() {
        // Static utility class
    }

    /**
     * Reconstructs the original text by traversing the Huffman tree using the provided bit string.
     *
     * @param bitString the binary string of '0' and '1' characters
     * @param root      the root node of the Huffman tree used during encoding
     * @return the fully restored original text
     * @throws IllegalArgumentException if bitString contains invalid characters, if root is null
     *                                  when bitString is non-empty, or if the bit stream terminates mid-tree
     */
    public static String decode(String bitString, HuffmanNode root) {
        if (bitString == null || bitString.isEmpty()) {
            return "";
        }

        if (root == null) {
            throw new IllegalArgumentException("Cannot decode non-empty bit string with a null Huffman tree");
        }

        // Single unique character case: root itself is a leaf
        if (root.isLeaf()) {
            StringBuilder decoded = new StringBuilder(bitString.length());
            String symbol = root.getCharacterAsString();

            for (int i = 0; i < bitString.length(); i++) {
                char bit = bitString.charAt(i);
                if (bit != '0') {
                    throw new IllegalArgumentException(
                            "Invalid bit '" + bit + "' at index " + i + " for single-character tree. Expected '0'."
                    );
                }
                decoded.append(symbol);
            }
            return decoded.toString();
        }

        // General binary tree traversal
        StringBuilder decoded = new StringBuilder();
        HuffmanNode current = root;

        for (int i = 0; i < bitString.length(); i++) {
            char bit = bitString.charAt(i);

            if (bit == '0') {
                current = current.getLeft();
            } else if (bit == '1') {
                current = current.getRight();
            } else {
                throw new IllegalArgumentException(
                        "Invalid bit character '" + bit + "' at index " + i + ". Only '0' and '1' are permitted."
                );
            }

            if (current == null) {
                throw new IllegalArgumentException(
                        "Invalid traversal path at bit index " + i + ": reached null tree branch"
                );
            }

            // If a leaf node is reached, emit its character and reset traversal to root
            if (current.isLeaf()) {
                decoded.append(current.getCharacterAsString());
                current = root;
            }
        }

        // Verify that the bit stream terminated at a complete symbol boundary
        if (current != root) {
            throw new IllegalArgumentException(
                    "Encoded bit stream ended prematurely mid-tree. The final symbol code was incomplete."
            );
        }

        return decoded.toString();
    }
}
