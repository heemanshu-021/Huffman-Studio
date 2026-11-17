package com.huffmanstudio.algorithm;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("FrequencyCounter Unit Tests")
class FrequencyCounterTest {

    @Test
    @DisplayName("Should return empty map for null or empty input")
    void countFrequenciesEmpty() {
        assertThat(FrequencyCounter.countFrequencies(null)).isEmpty();
        assertThat(FrequencyCounter.countFrequencies("")).isEmpty();
        assertThat(FrequencyCounter.countCodePoints(null)).isZero();
        assertThat(FrequencyCounter.countCodePoints("")).isZero();
    }

    @Test
    @DisplayName("Should calculate frequencies for simple ASCII string")
    void countFrequenciesAscii() {
        String text = "hello";
        Map<Integer, Integer> frequencies = FrequencyCounter.countFrequencies(text);

        // 'h': 1, 'e': 1, 'l': 2, 'o': 1
        assertThat(frequencies)
                .hasSize(4)
                .containsEntry((int) 'h', 1)
                .containsEntry((int) 'e', 1)
                .containsEntry((int) 'l', 2)
                .containsEntry((int) 'o', 1);

        assertThat(FrequencyCounter.countCodePoints(text)).isEqualTo(5);
    }

    @Test
    @DisplayName("Should preserve whitespace, numbers and punctuation")
    void countFrequenciesPunctuationAndWhitespace() {
        String text = "a 1\n!";
        Map<Integer, Integer> frequencies = FrequencyCounter.countFrequencies(text);

        assertThat(frequencies)
                .containsEntry((int) 'a', 1)
                .containsEntry((int) ' ', 1)
                .containsEntry((int) '1', 1)
                .containsEntry((int) '\n', 1)
                .containsEntry((int) '!', 1);

        assertThat(FrequencyCounter.countCodePoints(text)).isEqualTo(5);
    }

    @Test
    @DisplayName("Should accurately calculate frequencies for non-English and multi-byte Unicode characters")
    void countFrequenciesUnicode() {
        // "नमस्ते" (Hindi), "你好" (Chinese), "🌍" (Earth globe emoji, supplementary code point U+1F30E)
        String text = "नमस्ते 你好 🌍";
        Map<Integer, Integer> frequencies = FrequencyCounter.countFrequencies(text);

        int emojiCodePoint = "🌍".codePointAt(0); // 127758
        assertThat(frequencies).containsKey(emojiCodePoint);
        assertThat(frequencies.get(emojiCodePoint)).isEqualTo(1);

        // Code point count vs UTF-16 char length
        int codePoints = FrequencyCounter.countCodePoints(text);
        assertThat(codePoints).isLessThan(text.length()); // Emoji takes 2 chars in UTF-16, 1 code point
    }
}
