package com.huffmanstudio.model;

import java.nio.charset.StandardCharsets;

/**
 * Encapsulates the actual file-level compression statistics for a {@code .huf} archive.
 *
 * <p>Unlike {@link HuffmanStatistics} (which measures theoretical payload compression),
 * this record captures the complete picture including archive overhead: the fixed header,
 * serialized tree metadata, and the packed payload together.
 *
 * <h2>Field Formulas</h2>
 * <ul>
 *   <li><b>originalUtf8Bytes</b>: UTF-8 byte length of the original text.</li>
 *   <li><b>huffmanPayloadBits</b>: number of meaningful encoded bits (payload only).</li>
 *   <li><b>payloadBytes</b>: {@code ceil(huffmanPayloadBits / 8)}.</li>
 *   <li><b>treeMetadataBytes</b>: bytes used by the serialized Huffman tree.</li>
 *   <li><b>headerBytes</b>: fixed header size ({@value com.huffmanstudio.archive.ArchiveFormat#FIXED_HEADER_SIZE} bytes).</li>
 *   <li><b>totalArchiveBytes</b>: {@code headerBytes + treeMetadataBytes + payloadBytes}.</li>
 *   <li><b>bytesSavedOrAdded</b>: {@code originalUtf8Bytes - totalArchiveBytes};
 *       negative means the archive is <em>larger</em> than the original (normal for short texts).</li>
 *   <li><b>archiveCompressionRatio</b>: {@code originalUtf8Bytes / (double) totalArchiveBytes};
 *       {@code 0.0} when originalUtf8Bytes is 0.</li>
 *   <li><b>percentageSaved</b>: {@code (bytesSavedOrAdded / (double) originalUtf8Bytes) * 100};
 *       {@code 0.0} when originalUtf8Bytes is 0; negative if archive is larger.</li>
 * </ul>
 *
 * @param originalUtf8Bytes      UTF-8 byte size of the original plain text
 * @param huffmanPayloadBits     number of meaningful bits in the compressed payload
 * @param payloadBytes           bytes in the compressed payload section of the archive
 * @param treeMetadataBytes      bytes used by the serialized Huffman tree
 * @param headerBytes            bytes used by the fixed archive header
 * @param totalArchiveBytes      complete archive size in bytes
 * @param bytesSavedOrAdded      original bytes minus archive bytes (positive = saved, negative = overhead)
 * @param archiveCompressionRatio original / archive ratio (e.g. 2.0 = 2:1)
 * @param percentageSaved        percentage of original size saved (negative = expanded)
 */
public record ArchiveStatistics(
        long   originalUtf8Bytes,
        long   huffmanPayloadBits,
        long   payloadBytes,
        long   treeMetadataBytes,
        long   headerBytes,
        long   totalArchiveBytes,
        long   bytesSavedOrAdded,
        double archiveCompressionRatio,
        double percentageSaved
) {

    /**
     * Calculates {@link ArchiveStatistics} from the original text and the produced archive bytes.
     *
     * @param originalText  the uncompressed text; {@code null} treated as empty
     * @param archiveBytes  the complete {@code .huf} archive bytes; must not be null
     * @param payloadBits   number of meaningful bits in the payload section
     * @param treeBytes     number of bytes occupied by the serialized tree
     * @return a fully populated {@link ArchiveStatistics} record
     */
    public static ArchiveStatistics calculate(
            String originalText,
            byte[] archiveBytes,
            long   payloadBits,
            long   treeBytes
    ) {
        long origBytes = (originalText != null && !originalText.isEmpty())
                ? originalText.getBytes(StandardCharsets.UTF_8).length
                : 0L;

        long archiveSize = (archiveBytes != null) ? archiveBytes.length : 0L;
        long payloadBytesCount = (payloadBits + 7L) / 8L;
        long headerSize = com.huffmanstudio.archive.ArchiveFormat.FIXED_HEADER_SIZE;

        long saved = origBytes - archiveSize;

        double ratio = 0.0;
        if (origBytes > 0 && archiveSize > 0) {
            ratio = (double) origBytes / (double) archiveSize;
        }

        double pctSaved = 0.0;
        if (origBytes > 0) {
            pctSaved = ((double) saved / (double) origBytes) * 100.0;
        }

        return new ArchiveStatistics(
                origBytes,
                payloadBits,
                payloadBytesCount,
                treeBytes,
                headerSize,
                archiveSize,
                saved,
                ratio,
                pctSaved
        );
    }

    /**
     * Returns {@code true} when the archive is smaller than the original text.
     *
     * @return true if compression achieved a net space saving
     */
    public boolean isSpaceSaved() {
        return bytesSavedOrAdded > 0;
    }

    /**
     * Returns a human-readable summary of the statistics, useful for logging and reports.
     *
     * @return formatted multi-line summary string
     */
    public String toSummary() {
        return String.format(
                "Archive Statistics%n"
                + "  Original size       : %,d bytes%n"
                + "  Payload bits        : %,d%n"
                + "  Payload bytes       : %,d%n"
                + "  Tree metadata       : %,d bytes%n"
                + "  Header              : %,d bytes%n"
                + "  Total archive size  : %,d bytes%n"
                + "  Bytes saved/added   : %+,d bytes%n"
                + "  Compression ratio   : %.3f : 1%n"
                + "  Space saved         : %.2f%%%n",
                originalUtf8Bytes,
                huffmanPayloadBits,
                payloadBytes,
                treeMetadataBytes,
                headerBytes,
                totalArchiveBytes,
                bytesSavedOrAdded,
                archiveCompressionRatio,
                percentageSaved
        );
    }
}
