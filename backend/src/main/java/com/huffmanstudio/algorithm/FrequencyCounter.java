package com.huffmanstudio.algorithm;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Calculates occurrence frequencies for each unique Unicode code point in a text string.
 *
 * <p>Supports the entire Unicode spectrum, including ASCII, Latin, Cyrillic, CJK, Devanagari,
 * punctuation, whitespace, and 32-bit supplementary characters (such as emojis) by iterating
 * over code points rather than raw 16-bit char units.
 */
public final class FrequencyCounter {

    // Utility class with static methods; prevent instantiation
    private FrequencyCounter() {
    }

    /**
     * Scans the input text and constructs an unmodifiable map of Unicode code points
     * to their respective occurrence frequencies.
     *
     * @param text the input text to analyze (null or empty produces an empty map)
     * @return an unmodifiable map where key is Unicode code point (Integer) and value is frequency (Integer)
     */
    public static Map<Integer, Integer> countFrequencies(String text) {
        if (text == null || text.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Integer, Integer> frequencyMap = new LinkedHashMap<>();
        int length = text.length();

        for (int offset = 0; offset < length; ) {
            int codePoint = text.codePointAt(offset);
            int currentFrequency = frequencyMap.getOrDefault(codePoint, 0);
            frequencyMap.put(codePoint, currentFrequency + 1);

            // Increment by 1 for BMP characters or 2 for supplementary surrogate pairs
            offset += Character.charCount(codePoint);
        }

        return Collections.unmodifiableMap(frequencyMap);
    }

    /**
     * Calculates the total number of Unicode code points in the given text.
     *
     * @param text the text to measure
     * @return code point count (0 for null or empty string)
     */
    public static int countCodePoints(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }
        return text.codePointCount(0, text.length());
    }
}
