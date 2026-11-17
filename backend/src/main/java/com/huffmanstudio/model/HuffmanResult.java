package com.huffmanstudio.model;

import java.util.Collections;
import java.util.Map;
import java.util.Objects;

/**
 * Encapsulates the complete result of executing the Huffman compression algorithm on input text.
 *
 * <p>Contains the original text, constructed tree root, frequency map, generated code table,
 * encoded bit string, and computed compression statistics.
 */
public class HuffmanResult {

    private final String originalText;
    private final HuffmanNode rootNode;
    private final Map<Integer, Integer> frequencyMap;
    private final Map<Integer, String> codeTable;
    private final String encodedBitString;
    private final HuffmanStatistics statistics;

    public HuffmanResult(
            String originalText,
            HuffmanNode rootNode,
            Map<Integer, Integer> frequencyMap,
            Map<Integer, String> codeTable,
            String encodedBitString,
            HuffmanStatistics statistics
    ) {
        this.originalText = (originalText != null) ? originalText : "";
        this.rootNode = rootNode;
        this.frequencyMap = (frequencyMap != null) ? frequencyMap : Collections.emptyMap();
        this.codeTable = (codeTable != null) ? codeTable : Collections.emptyMap();
        this.encodedBitString = (encodedBitString != null) ? encodedBitString : "";
        this.statistics = Objects.requireNonNull(statistics, "Statistics cannot be null");
    }

    /**
     * Creates an empty result representing null or empty input text.
     *
     * @return empty HuffmanResult
     */
    public static HuffmanResult empty() {
        return new HuffmanResult(
                "",
                null,
                Collections.emptyMap(),
                Collections.emptyMap(),
                "",
                HuffmanStatistics.calculate("", "", 0)
        );
    }

    public String getOriginalText() {
        return originalText;
    }

    public HuffmanNode getRootNode() {
        return rootNode;
    }

    public Map<Integer, Integer> getFrequencyMap() {
        return frequencyMap;
    }

    public Map<Integer, String> getCodeTable() {
        return codeTable;
    }

    public String getEncodedBitString() {
        return encodedBitString;
    }

    public HuffmanStatistics getStatistics() {
        return statistics;
    }

    /**
     * Retrieves the Huffman binary code for a specific Unicode code point.
     *
     * @param codePoint character code point
     * @return bit code string, or null if not in table
     */
    public String getCodeFor(int codePoint) {
        return codeTable.get(codePoint);
    }

    /**
     * Retrieves the Huffman binary code for a given string symbol (single character or emoji).
     *
     * @param symbol string character
     * @return bit code string, or null if not found or invalid
     */
    public String getCodeFor(String symbol) {
        if (symbol == null || symbol.isEmpty()) {
            return null;
        }
        return codeTable.get(symbol.codePointAt(0));
    }
}
