package com.huffmanstudio.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an uploaded file is invalid (missing, empty, wrong extension, or unsupported type).
 */
public class InvalidFileException extends HuffmanStudioException {

    public InvalidFileException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "INVALID_FILE");
    }

    public InvalidFileException(String message, HttpStatus status) {
        super(message, status, "INVALID_FILE");
    }
}
