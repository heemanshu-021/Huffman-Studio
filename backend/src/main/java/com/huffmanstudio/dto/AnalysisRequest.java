package com.huffmanstudio.dto;

/**
 * Request payload for text analysis.
 *
 * @param text input text to analyze
 */
public record AnalysisRequest(
        String text
) {
}
