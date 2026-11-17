package com.huffmanstudio.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an uploaded archive is corrupted, malformed, or fails checksum/integrity validation.
 */
public class CorruptedArchiveException extends HuffmanStudioException {

    public CorruptedArchiveException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_ARCHIVE");
    }

    public CorruptedArchiveException(String message, Throwable cause) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_ARCHIVE", cause);
    }
}
