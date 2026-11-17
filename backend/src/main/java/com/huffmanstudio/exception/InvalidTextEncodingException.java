package com.huffmanstudio.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an uploaded text file contains invalid or malformed UTF-8 byte sequences.
 */
public class InvalidTextEncodingException extends HuffmanStudioException {

    public InvalidTextEncodingException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_TEXT_ENCODING");
    }

    public InvalidTextEncodingException(String message, Throwable cause) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_TEXT_ENCODING", cause);
    }
}
