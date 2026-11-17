package com.huffmanstudio.service;

import com.huffmanstudio.archive.HuffmanArchiveService;
import com.huffmanstudio.dto.DecompressionFileResponse;
import com.huffmanstudio.exception.CorruptedArchiveException;
import com.huffmanstudio.exception.InvalidFileException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Service orchestrating HTTP archive decompression workflows.
 *
 * <p>Handles multipart archive validation, filename sanitization,
 * and calls {@link HuffmanArchiveService} to restore original plain text files.
 */
@Service
public class DecompressionApiService {

    private final HuffmanArchiveService archiveService;

    public DecompressionApiService(HuffmanArchiveService archiveService) {
        this.archiveService = archiveService;
    }

    /**
     * Validates and decompresses an uploaded .huf binary archive into original plain text.
     *
     * @param file the multipart .huf archive uploaded by the client
     * @return {@link DecompressionFileResponse} containing UTF-8 plain text bytes, download filename, and statistics
     * @throws InvalidFileException      if the file is missing, empty, or not a .huf file
     * @throws CorruptedArchiveException if the archive is malformed, corrupt, or fails integrity checks
     */
    public DecompressionFileResponse decompress(MultipartFile file) {
        validateArchiveFile(file);

        String originalFilename = file.getOriginalFilename();
        String downloadFilename = deriveTextFilename(originalFilename);

        byte[] archiveBytes;
        try {
            archiveBytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidFileException("Failed to read uploaded archive: " + e.getMessage());
        }

        HuffmanArchiveService.DecompressionResult result;
        try {
            result = archiveService.decompressBytesWithStatistics(archiveBytes);
        } catch (IOException | IllegalArgumentException e) {
            throw new CorruptedArchiveException("The uploaded archive is invalid or corrupted: " + e.getMessage(), e);
        }

        byte[] textBytes = result.text().getBytes(StandardCharsets.UTF_8);
        return new DecompressionFileResponse(textBytes, downloadFilename, result.statistics());
    }

    /**
     * Validates that the uploaded file is present, not empty, and has a .huf extension.
     */
    private void validateArchiveFile(MultipartFile file) {
        if (file == null) {
            throw new InvalidFileException("Uploaded archive file is required");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new InvalidFileException("Uploaded archive must have a non-empty filename");
        }

        String cleanName = sanitizeFilename(filename);

        if (!cleanName.toLowerCase().endsWith(".huf")) {
            throw new InvalidFileException("Only .huf archive files are supported for decompression (received: " + cleanName + ")");
        }

        if (file.isEmpty()) {
            throw new InvalidFileException("Uploaded archive file is empty (0 bytes). A valid .huf archive must contain at least a header.");
        }
    }

    /**
     * Derives a safe download filename ending in .txt from the archive file name.
     */
    private String deriveTextFilename(String originalFilename) {
        String cleanName = sanitizeFilename(originalFilename);
        if (cleanName.toLowerCase().endsWith(".huf")) {
            cleanName = cleanName.substring(0, cleanName.length() - 4);
        }
        if (cleanName.isBlank()) {
            cleanName = "recovered";
        }
        return cleanName + ".txt";
    }

    /**
     * Strips directory components and path traversal characters from a filename.
     */
    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "archive";
        }
        String normalized = filename.replace('\\', '/');
        int lastSlash = normalized.lastIndexOf('/');
        String base = (lastSlash >= 0) ? normalized.substring(lastSlash + 1) : normalized;
        base = base.replaceAll("^[.\\s]+", "");
        return base.isBlank() ? "archive" : base;
    }
}
