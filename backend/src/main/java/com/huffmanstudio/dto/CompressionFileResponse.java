package com.huffmanstudio.dto;

import com.huffmanstudio.model.ArchiveStatistics;

/**
 * Result of a file compression operation, ready to be dispatched as an HTTP response.
 *
 * @param archiveBytes     the binary .huf archive content
 * @param downloadFilename sanitized download filename (e.g. "sample.huf")
 * @param statistics       the full archive-level compression statistics
 */
public record CompressionFileResponse(
        byte[] archiveBytes,
        String downloadFilename,
        ArchiveStatistics statistics
) {
}
