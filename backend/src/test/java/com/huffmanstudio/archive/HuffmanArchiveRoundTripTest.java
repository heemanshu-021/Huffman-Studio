package com.huffmanstudio.archive;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * In-memory round-trip tests for the Huffman binary archive system.
 *
 * Tests that compress a text string to a {@code .huf} byte array and then decompress it
 * back to the original string using only the archive bytes (no original in-memory tree).
 */
@DisplayName("Huffman Archive In-Memory Round Trips")
class HuffmanArchiveRoundTripTest {

    private final HuffmanArchiveService service = new HuffmanArchiveService();

    // =========================================================================
    // Edge cases
    // =========================================================================

    @Test
    @DisplayName("Empty string compresses and decompresses to empty string")
    void emptyString() throws Exception {
        byte[] archive = service.compressText("");
        String restored = service.decompressBytes(archive);
        assertEquals("", restored);
    }

    @Test
    @DisplayName("Null input compresses and decompresses to empty string")
    void nullInput() throws Exception {
        byte[] archive = service.compressText(null);
        String restored = service.decompressBytes(archive);
        assertEquals("", restored);
    }

    @Test
    @DisplayName("Single unique character — 'A' repeated once")
    void singleCharacterOneOccurrence() throws Exception {
        assertRoundTrip("A");
    }

    @Test
    @DisplayName("Single unique character — 'z' repeated many times")
    void singleCharacterManyOccurrences() throws Exception {
        assertRoundTrip("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
    }

    @Test
    @DisplayName("Two unique characters with equal frequency")
    void twoUniqueCharsEqualFrequency() throws Exception {
        assertRoundTrip("ABABABABABABAB");
    }

    @Test
    @DisplayName("Two unique characters with very different frequencies")
    void twoUniqueCharsDifferentFrequency() throws Exception {
        assertRoundTrip("AAAAAAAAAAAAB");
    }

    // =========================================================================
    // Basic English text
    // =========================================================================

    @Test
    @DisplayName("Short English word")
    void shortEnglishWord() throws Exception {
        assertRoundTrip("hello");
    }

    @Test
    @DisplayName("Normal English sentence")
    void normalEnglishSentence() throws Exception {
        assertRoundTrip("The quick brown fox jumps over the lazy dog.");
    }

    @Test
    @DisplayName("Text with spaces, tabs, and newlines")
    void textWithWhitespace() throws Exception {
        assertRoundTrip("line1\nline2\ttabbed\r\nwindows line ending");
    }

    @Test
    @DisplayName("Text with punctuation and numbers")
    void textWithPunctuationAndNumbers() throws Exception {
        assertRoundTrip("Hello, World! Version 3.14 — (c) 2024; all rights reserved.");
    }

    @Test
    @DisplayName("All 26 lowercase ASCII letters")
    void allLowercaseAscii() throws Exception {
        assertRoundTrip("abcdefghijklmnopqrstuvwxyz");
    }

    @Test
    @DisplayName("All printable ASCII characters")
    void allPrintableAscii() throws Exception {
        StringBuilder sb = new StringBuilder();
        for (int c = 32; c <= 126; c++) {
            sb.append((char) c);
        }
        assertRoundTrip(sb.toString());
    }

    // =========================================================================
    // Unicode and international text
    // =========================================================================

    @Test
    @DisplayName("Hindi (Devanagari) text")
    void hindiText() throws Exception {
        assertRoundTrip("नमस्ते दुनिया! हफ़मैन कोडिंग एक प्रसिद्ध एल्गोरिदम है।");
    }

    @Test
    @DisplayName("Chinese text")
    void chineseText() throws Exception {
        assertRoundTrip("霍夫曼编码是一种数据压缩算法，使用变长编码表对源符号进行编码。");
    }

    @Test
    @DisplayName("Arabic text")
    void arabicText() throws Exception {
        assertRoundTrip("ترميز هافمان هو خوارزمية لضغط البيانات تعتمد على الترددات.");
    }

    @Test
    @DisplayName("Japanese text")
    void japaneseText() throws Exception {
        assertRoundTrip("ハフマン符号は情報理論における最適な接頭語符号の一種です。");
    }

    @Test
    @DisplayName("Mixed Latin, Greek, and Cyrillic")
    void mixedScripts() throws Exception {
        assertRoundTrip("English + Ελληνικά + Русский");
    }

    @Test
    @DisplayName("Emoji characters (supplementary Unicode code points)")
    void emojiCharacters() throws Exception {
        assertRoundTrip("😀🎉🌍🚀✨🔥💡🎵🦄");
    }

    @Test
    @DisplayName("Mixed ASCII and emoji")
    void mixedAsciiAndEmoji() throws Exception {
        assertRoundTrip("Hello 🌍! Good morning ☀️. Have a great day 🎉");
    }

    // =========================================================================
    // Parametric tests for different input patterns
    // =========================================================================

    @ParameterizedTest
    @DisplayName("Round trip for various short strings")
    @ValueSource(strings = {
        "a",
        "ab",
        "aa",
        "abc",
        "aab",
        "aabb",
        "abcabc",
        "12345",
        "!@#$%",
        "   ",      // only spaces
        "\n\n\n",   // only newlines
        "aaaaabbbbbccccc"
    })
    void roundTripForVariousShortStrings(String text) throws Exception {
        assertRoundTrip(text);
    }

    // =========================================================================
    // Larger texts
    // =========================================================================

    @Test
    @DisplayName("Repeated paragraph of English text (~500 chars)")
    void repeatedParagraph() throws Exception {
        String paragraph = "Huffman coding is a lossless data compression algorithm. "
                + "The idea is to assign variable-length codes to input characters, "
                + "lengths of the assigned codes are based on the frequencies of "
                + "corresponding characters. ";
        assertRoundTrip(paragraph.repeat(5));
    }

    @Test
    @DisplayName("Large text with ~5000 characters")
    void largeText() throws Exception {
        String base = "The quick brown fox jumps over the lazy dog. "
                + "Pack my box with five dozen liquor jugs. ";
        assertRoundTrip(base.repeat(60));
    }

    @Test
    @DisplayName("Skewed distribution: one character dominates (99% A, 1% B)")
    void skewedFrequencyDistribution() throws Exception {
        String text = "A".repeat(990) + "B".repeat(10);
        assertRoundTrip(text);
    }

    @Test
    @DisplayName("Uniform distribution: each character appears exactly once")
    void uniformDistribution() throws Exception {
        // All 94 printable ASCII symbols, each once
        StringBuilder sb = new StringBuilder();
        for (int c = 33; c <= 126; c++) sb.append((char) c);
        assertRoundTrip(sb.toString());
    }

    // =========================================================================
    // Helper
    // =========================================================================

    /**
     * Compresses {@code original} to a byte archive then decompresses using only
     * those bytes, asserting the restored text equals the original.
     */
    private void assertRoundTrip(String original) throws Exception {
        byte[] archive = service.compressText(original);
        assertNotNull(archive, "Archive bytes must not be null");
        assertTrue(archive.length >= ArchiveFormat.FIXED_HEADER_SIZE,
                "Archive must be at least " + ArchiveFormat.FIXED_HEADER_SIZE + " bytes");

        String restored = service.decompressBytes(archive);
        assertEquals(original, restored,
                "Decompressed text must exactly match original");
    }
}
