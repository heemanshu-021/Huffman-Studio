package com.huffmanstudio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Huffman Studio Spring Boot backend application.
 *
 * <p>Huffman Studio provides RESTful endpoints for lossless text compression,
 * binary archive construction (.huf), and interactive Huffman tree visual analytics.
 */
@SpringBootApplication
public class HuffmanStudioApplication {

    public static void main(String[] args) {
        SpringApplication.run(HuffmanStudioApplication.class, args);
    }
}
