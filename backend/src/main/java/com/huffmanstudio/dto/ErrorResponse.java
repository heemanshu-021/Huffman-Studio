package com.huffmanstudio.dto;

import java.time.Instant;

/**
 * Standardized error response returned by the global exception handler.
 */
public record ErrorResponse(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(status, error, message, path, Instant.now());
    }
}
