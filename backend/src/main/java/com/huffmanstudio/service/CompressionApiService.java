package com.huffmanstudio.service;

import com.huffmanstudio.archive.HuffmanArchiveService;
import com.huffmanstudio.dto.CompressionFileResponse;
import com.huffmanstudio.exception.InvalidFileException;
import com.huffmanstudio.exception.InvalidTextEncodingException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

/**
 * Service orchestrating HTTP file compression workflows.
 *
 * <p>Handles multipart file validation, strict UTF-8 decoding, filename sanitization,
 * and calls {@link HuffmanArchiveService} to produce binary {@code .huf} archives.
 */
@Service
public class CompressionApiService {

    private final HuffmanArchiveService archiveService;

    public CompressionApiService(HuffmanArchiveService archiveService) {
        this.archiveService = archiveService;
    }

    /**
     * Validates and compresses an uploaded plain text file into a binary .huf archive.
     *
     * @param file the multipart text file uploaded by the client
     * @return {@link CompressionFileResponse} containing archive bytes, download filename, and statistics
     * @throws InvalidFileException         if the file is missing, extension is invalid, or filename is blank
     * @throws InvalidTextEncodingException if the file is not valid UTF-8
     */
    public CompressionFileResponse compress(MultipartFile file) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String downloadFilename = deriveArchiveFilename(originalFilename);

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidFileException("Failed to read uploaded file: " + e.getMessage());
        }

        // Strict UTF-8 validation
        String text = decodeUtf8Strict(fileBytes);

        // Execute compression via HuffmanArchiveService
        HuffmanArchiveService.CompressionResult result;
        try {
            result = archiveService.compressTextWithStatistics(text);
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate compressed archive: " + e.getMessage(), e);
        }

        return new CompressionFileResponse(result.archiveBytes(), downloadFilename, result.statistics());
    }

    /**
     * Validates that the uploaded file is present, has a valid name, and has a .txt extension.
     */
    private void validateFile(MultipartFile file) {
        if (file == null) {
            throw new InvalidFileException("Uploaded file is required");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new InvalidFileException("Uploaded file must have a non-empty filename");
        }

        // Sanitize path separators to prevent path traversal in filename checks
        String cleanName = sanitizeFilename(filename);

        if (!cleanName.toLowerCase().endsWith(".txt")) {
            throw new InvalidFileException("Only .txt files are supported for compression (received: " + cleanName + ")");
        }
    }

    /**
     * Strictly decodes raw byte content as UTF-8, rejecting malformed or unmappable sequences.
     */
    private String decodeUtf8Strict(byte[] fileBytes) {
        if (fileBytes.length == 0) {
            return "";
        }

        CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);

        try {
            return decoder.decode(ByteBuffer.wrap(fileBytes)).toString();
        } catch (CharacterCodingException e) {
            throw new InvalidTextEncodingException("Uploaded file contains invalid or malformed UTF-8 byte sequences");
        }
    }

    /**
     * Derives a safe download filename ending in .huf from the original file name.
     */
    private String deriveArchiveFilename(String originalFilename) {
        String cleanName = sanitizeFilename(originalFilename);
        if (cleanName.toLowerCase().endsWith(".txt")) {
            cleanName = cleanName.substring(0, cleanName.length() - 4);
        }
        if (cleanName.isBlank()) {
            cleanName = "archive";
        }
        return cleanName + ".huf";
    }

    /**
     * Strips directory components and path traversal characters from a filename.
     */
    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "file";
        }
        // Normalize backslashes to forward slashes
        String normalized = filename.replace('\\', '/');
        // Extract the trailing filename component
        int lastSlash = normalized.lastIndexOf('/');
        String base = (lastSlash >= 0) ? normalized.substring(lastSlash + 1) : normalized;
        // Strip any leading dots or control characters
        base = base.replaceAll("^[.\\s]+", "");
        return base.isBlank() ? "file" : base;
    }
}
