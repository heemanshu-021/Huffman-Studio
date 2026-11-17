package com.huffmanstudio.exception;

import org.springframework.http.HttpStatus;

/**
 * Base domain exception for Huffman Studio application errors.
 */
public class HuffmanStudioException extends RuntimeException {

    private final HttpStatus status;

    public HuffmanStudioException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public HuffmanStudioException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HuffmanStudioException(String message, Throwable cause) {
        super(message, cause);
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
