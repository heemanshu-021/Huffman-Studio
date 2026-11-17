package com.huffmanstudio.dto;

/**
 * Character frequency representation for frequency tables and visual charts.
 *
 * @param codePoint        Unicode code point integer
 * @param character        string character representation
 * @param displayCharacter human-readable label (e.g. "[Space]", "A")
 * @param frequency        number of occurrences
 * @param percentage       frequency percentage relative to total code points
 */
public record CharacterFrequencyDto(
        int codePoint,
        String character,
        String displayCharacter,
        int frequency,
        double percentage
) {
}
