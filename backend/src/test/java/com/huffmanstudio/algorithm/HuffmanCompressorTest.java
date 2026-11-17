package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("HuffmanCompressor End-to-End Algorithm Tests")
class HuffmanCompressorTest {

    @Test
    @DisplayName("Case 1: Empty string handling")
    void testEmptyString() {
        HuffmanResult result = HuffmanCompressor.compress("");

        assertThat(result.getOriginalText()).isEmpty();
        assertThat(result.getRootNode()).isNull();
        assertThat(result.getFrequencyMap()).isEmpty();
        assertThat(result.getCodeTable()).isEmpty();
        assertThat(result.getEncodedBitString()).isEmpty();
        assertThat(result.getStatistics().originalCodePointCount()).isZero();

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEmpty();
    }

    @Test
    @DisplayName("Case 2: Single character 'A'")
    void testSingleCharacter() {
        String input = "A";
        HuffmanResult result = HuffmanCompressor.compress(input);

        assertThat(result.getRootNode().isLeaf()).isTrue();
        assertThat(result.getCodeTable()).containsEntry((int) 'A', "0");
        assertThat(result.getEncodedBitString()).isEqualTo("0");

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 3: Repeated single character 'AAAAAA'")
    void testRepeatedCharacter() {
        String input = "AAAAAA";
        HuffmanResult result = HuffmanCompressor.compress(input);

        assertThat(result.getRootNode().isLeaf()).isTrue();
        assertThat(result.getCodeTable()).containsEntry((int) 'A', "0");
        assertThat(result.getEncodedBitString()).isEqualTo("000000");

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 4: Two distinct characters 'AB'")
    void testTwoDifferentCharacters() {
        String input = "AB";
        HuffmanResult result = HuffmanCompressor.compress(input);

        assertThat(result.getCodeTable()).hasSize(2);
        assertThat(result.getEncodedBitString()).isEqualTo("01");

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 5: Normal text 'hello world'")
    void testNormalText() {
        String input = "hello world";
        HuffmanResult result = HuffmanCompressor.compress(input);

        assertThat(result.getEncodedBitString()).matches("^[01]+$");
        assertThat(result.getStatistics().originalCodePointCount()).isEqualTo(11);

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 6: Text with spaces, punctuation and numbers")
    void testPunctuationSpacesNumbers() {
        String input = "The price is $100.00! Are you sure? (Yes/No) \n\t 1234567890.";
        HuffmanResult result = HuffmanCompressor.compress(input);

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 7: Unicode, non-English scripts and supplementary emoji")
    void testUnicodeAndEmoji() {
        String input = "Hello 🌍! नमस्ते, 你好, مرحبا! Symbols: 🚀✨🎉";
        HuffmanResult result = HuffmanCompressor.compress(input);

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 8: All characters having equal frequencies")
    void testEqualFrequencies() {
        String input = "abcdefghijklmnopqrstuvwxyz";
        HuffmanResult result = HuffmanCompressor.compress(input);

        assertThat(result.getCodeTable()).hasSize(26);

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 9: Larger input text roundtrip verification")
    void testLargerInputText() {
        StringBuilder largeText = new StringBuilder();
        for (int i = 0; i < 200; i++) {
            largeText.append("Huffman coding is an optimal prefix code found by David A. Huffman in 1952. ")
                    .append("Iteration ")
                    .append(i)
                    .append(" with diverse words and letters.\n");
        }

        String input = largeText.toString();
        HuffmanResult result = HuffmanCompressor.compress(input);

        assertThat(result.getStatistics().percentageSaved()).isGreaterThan(0.0);
        assertThat(result.getStatistics().compressionRatio()).isGreaterThan(1.0);

        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "a",
            "ab",
            "abc",
            "mississippi",
            "to be or not to be, that is the question",
            "111222333444555",
            "Special: \t\r\n\\//\"'~`@#$%^&*()_+-={}|[]:;<>?,.",
            "Emoji: 🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷"
    })
    @DisplayName("Case 10: Parametric encode/decode exact roundtrip equivalence")
    void testParametricRoundtrips(String input) {
        HuffmanResult result = HuffmanCompressor.compress(input);
        String restored = HuffmanCompressor.decompress(result);
        assertThat(restored).isEqualTo(input);
    }

    @Test
    @DisplayName("Case 11: Deterministic code generation for identical input across repeated calls")
    void testDeterministicCodeGeneration() {
        String input = "Repeated deterministic test verifying that code table and bit strings match 100%.";

        HuffmanResult firstRun = HuffmanCompressor.compress(input);

        for (int i = 0; i < 20; i++) {
            HuffmanResult subsequentRun = HuffmanCompressor.compress(input);

            assertThat(subsequentRun.getCodeTable()).isEqualTo(firstRun.getCodeTable());
            assertThat(subsequentRun.getEncodedBitString()).isEqualTo(firstRun.getEncodedBitString());
            assertThat(subsequentRun.getRootNode()).isEqualTo(firstRun.getRootNode());
        }
    }
}
