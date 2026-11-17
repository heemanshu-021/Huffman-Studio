package com.huffmanstudio.algorithm;

import java.util.Map;

/**
 * Encodes text strings into binary Huffman bit strings using a generated code table.
 *
 * <p>Validates that every character in the input text exists within the provided code table,
 * throwing an explicit descriptive exception if an unregistered character is encountered.
 */
public final class HuffmanEncoder {

    private HuffmanEncoder() {
        // Static utility class
    }

    /**
     * Converts the original text into its binary Huffman bit representation.
     *
     * @param text      the original text to encode (empty or null returns empty string)
     * @param codeTable mapping from Unicode code points to binary code strings
     * @return string of '0' and '1' characters representing the encoded text
     * @throws IllegalArgumentException if text is non-empty and codeTable is null/empty,
     *                                  or if a character in text is missing from codeTable
     */
    public static String encode(String text, Map<Integer, String> codeTable) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        if (codeTable == null || codeTable.isEmpty()) {
            throw new IllegalArgumentException("Cannot encode non-empty text with a null or empty Huffman code table");
        }

        StringBuilder bitStringBuilder = new StringBuilder();
        int length = text.length();

        for (int offset = 0; offset < length; ) {
            int codePoint = text.codePointAt(offset);
            String code = codeTable.get(codePoint);

            if (code == null) {
                String symbol = Character.isValidCodePoint(codePoint) ? Character.toString(codePoint) : "unknown";
                throw new IllegalArgumentException(
                        "Character '" + symbol + "' (Unicode code point " + codePoint + ") not found in Huffman code table"
                );
            }

            bitStringBuilder.append(code);
            offset += Character.charCount(codePoint);
        }

        return bitStringBuilder.toString();
    }
}
