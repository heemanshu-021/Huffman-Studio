package com.huffmanstudio.dto;

import java.time.Instant;

/**
 * Data Transfer Object representing the application health status.
 */
public record HealthResponse(
        String status,
        String message,
        Instant timestamp,
        String version
) {
    public static HealthResponse up(String version) {
        return new HealthResponse(
                "UP",
                "Huffman Studio Backend is operational",
                Instant.now(),
                version
        );
    }
}
