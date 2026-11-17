package com.huffmanstudio.dto;

import java.time.Instant;

/**
 * Standardized error response returned by the global exception handler.
 */
public record ErrorResponse(
        boolean success,
        String errorCode,
        int status,
        String error,
        String message,
        String path,
        Instant timestamp
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        String code = (error != null) ? error.replace(' ', '_').toUpperCase() : "ERROR";
        return new ErrorResponse(false, code, status, error, message, path, Instant.now());
    }

    public static ErrorResponse of(int status, String errorCode, String error, String message, String path) {
        return new ErrorResponse(false, errorCode, status, error, message, path, Instant.now());
    }
}
