package com.huffmanstudio.archive;

/**
 * Immutable record holding the metadata fields parsed from a {@code .huf} archive header.
 *
 * <p>These values are read directly from the fixed-size header section of the archive and are
 * used to guide subsequent reading of the serialized tree and binary payload.
 *
 * @param originalCodePointCount number of Unicode code points in the original text
 * @param encodedBitCount        number of meaningful bits in the packed binary payload
 * @param treeNodeCount          total count of tree nodes (leaves + internal) as declared in the header
 * @param crc32Checksum          CRC32 of the original UTF-8 bytes, stored as an unsigned 32-bit value
 *                               in a {@code long} to avoid sign confusion
 */
public record ArchiveMetadata(
        long originalCodePointCount,
        long encodedBitCount,
        int  treeNodeCount,
        long crc32Checksum
) {

    /**
     * Validates that all metadata values are within acceptable bounds.
     *
     * @throws IllegalArgumentException if any field is out of range
     */
    public ArchiveMetadata {
        if (originalCodePointCount < 0) {
            throw new IllegalArgumentException(
                    "originalCodePointCount cannot be negative: " + originalCodePointCount);
        }
        if (encodedBitCount < 0) {
            throw new IllegalArgumentException(
                    "encodedBitCount cannot be negative: " + encodedBitCount);
        }
        if (treeNodeCount < 0) {
            throw new IllegalArgumentException(
                    "treeNodeCount cannot be negative: " + treeNodeCount);
        }
        if (crc32Checksum < 0 || crc32Checksum > 0xFFFFFFFFL) {
            throw new IllegalArgumentException(
                    "crc32Checksum must be an unsigned 32-bit value: " + crc32Checksum);
        }
    }

    /**
     * Calculates the number of payload bytes in the archive based on the encoded bit count.
     * The last byte may be partially filled and zero-padded.
     *
     * @return number of bytes needed to hold all meaningful bits
     */
    public long payloadByteCount() {
        return (encodedBitCount + 7L) / 8L;
    }

    /**
     * Returns {@code true} when the archive represents empty input (no tree and no payload).
     *
     * @return true if the original text had no code points
     */
    public boolean isEmpty() {
        return originalCodePointCount == 0 && encodedBitCount == 0 && treeNodeCount == 0;
    }
}
