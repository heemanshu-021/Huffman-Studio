package com.huffmanstudio.dto;

import com.huffmanstudio.model.ArchiveStatistics;

/**
 * Result of a file decompression operation, ready to be dispatched as an HTTP response.
 *
 * @param textBytes        the restored plain text encoded in UTF-8
 * @param downloadFilename sanitized download filename (e.g. "sample.txt")
 * @param statistics       the full archive-level decompression statistics
 */
public record DecompressionFileResponse(
        byte[] textBytes,
        String downloadFilename,
        ArchiveStatistics statistics
) {
}
