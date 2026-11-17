package com.huffmanstudio.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

@DisplayName("HuffmanStatistics Unit Tests")
class HuffmanStatisticsTest {

    @Test
    @DisplayName("Should handle null or empty input without division by zero")
    void calculateEmpty() {
        HuffmanStatistics statsNull = HuffmanStatistics.calculate(null, null, 0);
        assertThat(statsNull.originalCodePointCount()).isZero();
        assertThat(statsNull.uniqueCharacterCount()).isZero();
        assertThat(statsNull.originalByteSize()).isZero();
        assertThat(statsNull.encodedBitCount()).isZero();
        assertThat(statsNull.encodedByteCount()).isZero();
        assertThat(statsNull.compressionRatio()).isEqualTo(0.0);
        assertThat(statsNull.percentageSaved()).isEqualTo(0.0);

        HuffmanStatistics statsEmpty = HuffmanStatistics.calculate("", "", 0);
        assertThat(statsEmpty.compressionRatio()).isEqualTo(0.0);
        assertThat(statsEmpty.percentageSaved()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Should calculate byte ceiling and compression metrics accurately")
    void calculateMetrics() {
        // 10 ASCII characters = 10 bytes
        String text = "0123456789";
        // 17 bits -> Math.ceil(17 / 8.0) = 3 bytes
        String bitString = "10101010101010101";

        HuffmanStatistics stats = HuffmanStatistics.calculate(text, bitString, 10);

        assertThat(stats.originalCodePointCount()).isEqualTo(10);
        assertThat(stats.uniqueCharacterCount()).isEqualTo(10);
        assertThat(stats.originalByteSize()).isEqualTo(10);
        assertThat(stats.encodedBitCount()).isEqualTo(17);
        assertThat(stats.encodedByteCount()).isEqualTo(3);

        // Compression ratio = 10 / 3.0 = 3.333...
        assertThat(stats.compressionRatio()).isCloseTo(10.0 / 3.0, within(0.001));

        // Percentage saved = (1 - 3/10) * 100 = 70.0%
        assertThat(stats.percentageSaved()).isCloseTo(70.0, within(0.001));
    }
}
