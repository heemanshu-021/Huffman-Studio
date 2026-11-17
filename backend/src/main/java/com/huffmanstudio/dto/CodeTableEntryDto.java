package com.huffmanstudio.dto;

/**
 * Prefix code entry mapping a character to its variable-length binary code.
 *
 * @param codePoint        Unicode code point integer
 * @param character        string character representation
 * @param displayCharacter human-readable label
 * @param code             prefix-free binary code string (e.g. "011")
 * @param bitLength        length of code in bits
 * @param frequency        occurrence count of character
 */
public record CodeTableEntryDto(
        int codePoint,
        String character,
        String displayCharacter,
        String code,
        int bitLength,
        int frequency
) {
}
