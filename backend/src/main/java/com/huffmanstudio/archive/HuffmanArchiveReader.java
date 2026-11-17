package com.huffmanstudio.archive;

import com.huffmanstudio.model.HuffmanNode;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Reads and validates a binary {@code .huf} archive, reconstructing the Huffman tree
 * and extracting the packed bit payload.
 *
 * <h2>Validation Performed</h2>
 * <ul>
 *   <li>Magic signature must be {@code HUFN}.</li>
 *   <li>Format version must be {@code 0x01}.</li>
 *   <li>Archive must not be truncated at any header or tree field.</li>
 *   <li>Tree node count must match the declared value in the header.</li>
 *   <li>No duplicate leaf code points are allowed.</li>
 *   <li>All leaf code points must be valid Unicode.</li>
 *   <li>Tree markers must be {@code 0x00} or {@code 0x01}.</li>
 *   <li>Tree depth must not exceed {@link ArchiveFormat#MAX_TREE_DEPTH}.</li>
 *   <li>No unexpected trailing bytes after the payload.</li>
 *   <li>Padding bits in the last payload byte must be zero.</li>
 *   <li>Metadata values must be within security limits.</li>
 * </ul>
 *
 * <h2>Thread Safety</h2>
 * <p>All public methods are stateless and can be called concurrently.
 */
public class HuffmanArchiveReader {

    /**
     * Encapsulates the data extracted from a valid {@code .huf} archive.
     *
     * @param metadata      the parsed header metadata
     * @param root          the reconstructed Huffman tree root (null for empty archives)
     * @param payloadBytes  the raw packed payload bytes
     */
    public record ReadResult(ArchiveMetadata metadata, HuffmanNode root, byte[] payloadBytes) {

        /**
         * Returns {@code true} when the archive represented empty input.
         */
        public boolean isEmpty() {
            return metadata.isEmpty();
        }

        /**
         * Creates a {@link BitReader} over the payload bytes, configured to read exactly
         * the declared number of meaningful bits.
         *
         * @return a new BitReader ready to read the payload bits
         */
        public BitReader createBitReader() {
            return new BitReader(payloadBytes, metadata.encodedBitCount());
        }
    }

    /**
     * Reads and validates a {@code .huf} archive from an in-memory byte array.
     *
     * @param archiveBytes the full archive content
     * @return a {@link ReadResult} containing metadata, reconstructed tree, and payload
     * @throws IOException              if the archive is malformed or violates any validation rule
     * @throws IllegalArgumentException if {@code archiveBytes} is null
     */
    public ReadResult readFromBytes(byte[] archiveBytes) throws IOException {
        if (archiveBytes == null) {
            throw new IllegalArgumentException("archiveBytes cannot be null");
        }
        if (archiveBytes.length > ArchiveFormat.MAX_ARCHIVE_BYTES) {
            throw new IOException("Archive size " + archiveBytes.length
                    + " bytes exceeds the maximum allowed " + ArchiveFormat.MAX_ARCHIVE_BYTES + " bytes");
        }

        ByteBuffer buf = ByteBuffer.wrap(archiveBytes).order(ByteOrder.BIG_ENDIAN);

        // --- Read and validate fixed header ---
        ArchiveMetadata metadata = readHeader(buf);
        validateMetadataLimits(metadata);

        if (metadata.isEmpty()) {
            requireExactlyAtEnd(buf, archiveBytes.length, "empty archive");
            return new ReadResult(metadata, null, new byte[0]);
        }

        // --- Read and reconstruct Huffman tree ---
        int[] nodeCounter = { 0 };
        Set<Integer> seenCodePoints = new HashSet<>();
        HuffmanNode root = readNode(buf, nodeCounter, seenCodePoints, 0);

        // Verify declared node count matches actual node count
        if (nodeCounter[0] != metadata.treeNodeCount()) {
            throw new IOException(
                    "Tree node count mismatch: header declared " + metadata.treeNodeCount()
                    + " but deserialized " + nodeCounter[0] + " nodes");
        }

        // --- Read payload bytes ---
        long expectedPayloadBytes = metadata.payloadByteCount();
        int remaining = buf.remaining();
        if (remaining < expectedPayloadBytes) {
            throw new IOException("Truncated payload: expected " + expectedPayloadBytes
                    + " bytes but only " + remaining + " remain in archive");
        }
        byte[] payloadBytes = new byte[(int) expectedPayloadBytes];
        buf.get(payloadBytes);

        // --- Validate no trailing bytes ---
        requireExactlyAtEnd(buf, archiveBytes.length, "after payload");

        // --- Validate padding bits in last byte are zero ---
        validatePaddingBits(payloadBytes, metadata.encodedBitCount());

        return new ReadResult(metadata, root, payloadBytes);
    }

    /**
     * Reads and validates a {@code .huf} archive from a file on disk.
     *
     * @param path path to the {@code .huf} file
     * @return a {@link ReadResult} containing metadata, reconstructed tree, and payload
     * @throws IOException              if the file cannot be read or the archive is invalid
     * @throws IllegalArgumentException if {@code path} is null
     */
    public ReadResult readFromFile(Path path) throws IOException {
        if (path == null) {
            throw new IllegalArgumentException("path cannot be null");
        }
        if (!Files.exists(path)) {
            throw new IOException("Archive file does not exist: " + path);
        }

        long fileSize = Files.size(path);
        if (fileSize > ArchiveFormat.MAX_ARCHIVE_BYTES) {
            throw new IOException("Archive file " + path + " is " + fileSize
                    + " bytes, exceeding the maximum " + ArchiveFormat.MAX_ARCHIVE_BYTES + " bytes");
        }

        byte[] archiveBytes = Files.readAllBytes(path);
        return readFromBytes(archiveBytes);
    }

    // =========================================================================
    // Private reading helpers
    // =========================================================================

    /**
     * Reads the fixed-size header from the buffer and returns an {@link ArchiveMetadata} record.
     */
    private ArchiveMetadata readHeader(ByteBuffer buf) throws IOException {
        requireBytes(buf, ArchiveFormat.FIXED_HEADER_SIZE, "fixed header");

        // Magic
        byte[] magic = new byte[ArchiveFormat.MAGIC_SIZE];
        buf.get(magic);
        if (!Arrays.equals(magic, ArchiveFormat.MAGIC)) {
            throw new IOException(
                    "Invalid magic signature. Expected HUFN (0x48 0x55 0x46 0x4E) but got: "
                    + bytesToHex(magic));
        }

        // Version
        byte version = buf.get();
        if (version != ArchiveFormat.FORMAT_VERSION) {
            throw new IOException(
                    "Unsupported archive version: " + (version & 0xFF)
                    + ". This reader supports only version " + (ArchiveFormat.FORMAT_VERSION & 0xFF));
        }

        // Original code-point count (8 bytes)
        long codePointCount = buf.getLong();
        if (codePointCount < 0) {
            throw new IOException("Corrupt header: originalCodePointCount is negative: " + codePointCount);
        }

        // Encoded bit count (8 bytes)
        long bitCount = buf.getLong();
        if (bitCount < 0) {
            throw new IOException("Corrupt header: encodedBitCount is negative: " + bitCount);
        }

        // Tree node count (4 bytes)
        int treeNodeCount = buf.getInt();
        if (treeNodeCount < 0) {
            throw new IOException("Corrupt header: treeNodeCount is negative: " + treeNodeCount);
        }

        // CRC32 checksum (4 bytes) — read as int, store as unsigned long
        long crc32 = buf.getInt() & 0xFFFFFFFFL;

        return new ArchiveMetadata(codePointCount, bitCount, treeNodeCount, crc32);
    }

    /**
     * Recursively reads a tree node from the buffer using preorder DFS.
     *
     * @param buf           the buffer positioned at the start of the next node
     * @param nodeCounter   a single-element array tracking total nodes deserialized
     * @param seenCodePoints set of code points already encountered (for duplicate detection)
     * @param depth         current recursion depth
     * @return the deserialized {@link HuffmanNode}
     */
    private HuffmanNode readNode(ByteBuffer buf, int[] nodeCounter,
                                  Set<Integer> seenCodePoints, int depth) throws IOException {
        if (depth > ArchiveFormat.MAX_TREE_DEPTH) {
            throw new IOException(
                    "Huffman tree depth exceeded the maximum allowed depth of "
                    + ArchiveFormat.MAX_TREE_DEPTH + ". The archive may be corrupt.");
        }

        if (nodeCounter[0] >= ArchiveFormat.MAX_TREE_NODES) {
            throw new IOException(
                    "Tree node count exceeded the safety limit of " + ArchiveFormat.MAX_TREE_NODES);
        }

        requireBytes(buf, 1, "tree node marker");
        byte marker = buf.get();
        nodeCounter[0]++;

        if (marker == ArchiveFormat.LEAF_MARKER) {
            // Leaf: read 4-byte Unicode code point
            requireBytes(buf, ArchiveFormat.LEAF_CODE_POINT_SIZE, "leaf code point");
            int codePoint = buf.getInt();

            if (!Character.isValidCodePoint(codePoint)) {
                throw new IOException(
                        "Invalid Unicode code point in leaf node: " + codePoint
                        + " (0x" + Integer.toHexString(codePoint) + ")");
            }

            if (!seenCodePoints.add(codePoint)) {
                throw new IOException(
                        "Duplicate leaf code point in tree: " + codePoint
                        + " ('" + Character.toString(codePoint) + "')");
            }

            // Frequency is not stored in the archive; use 1 as a placeholder.
            // The frequency does not affect decoding (only tree shape matters).
            return HuffmanNode.createLeaf(codePoint, 1);

        } else if (marker == ArchiveFormat.INTERNAL_MARKER) {
            // Internal: read left child then right child
            HuffmanNode left  = readNode(buf, nodeCounter, seenCodePoints, depth + 1);
            HuffmanNode right = readNode(buf, nodeCounter, seenCodePoints, depth + 1);
            return HuffmanNode.createInternal(left, right);

        } else {
            throw new IOException(
                    "Unknown tree node marker byte: 0x" + String.format("%02X", marker & 0xFF)
                    + ". Expected 0x00 (internal) or 0x01 (leaf).");
        }
    }

    /**
     * Verifies that the padding bits in the last payload byte are zero.
     *
     * <p>If the total meaningful bit count is not a multiple of 8, the least-significant
     * {@code (8 - bitCount % 8)} bits of the last byte must be zero.
     *
     * @param payload     the packed payload bytes
     * @param bitCount    the number of meaningful bits
     * @throws IOException if any padding bit is non-zero
     */
    private void validatePaddingBits(byte[] payload, long bitCount) throws IOException {
        if (payload.length == 0 || bitCount == 0) {
            return;
        }

        int usedBitsInLastByte = (int) (bitCount % 8);
        if (usedBitsInLastByte == 0) {
            // Last byte is fully occupied — no padding to check
            return;
        }

        int paddingBits = 8 - usedBitsInLastByte;
        int lastByte = payload[payload.length - 1] & 0xFF;
        int paddingMask = (1 << paddingBits) - 1;

        if ((lastByte & paddingMask) != 0) {
            throw new IOException(
                    "Non-zero padding bits in last payload byte: 0x"
                    + String.format("%02X", lastByte)
                    + ". Expected the last " + paddingBits + " bit(s) to be zero.");
        }
    }

    /**
     * Validates that metadata values are within the safety limits defined in {@link ArchiveFormat}.
     */
    private void validateMetadataLimits(ArchiveMetadata metadata) throws IOException {
        if (metadata.originalCodePointCount() > ArchiveFormat.MAX_CODE_POINT_COUNT) {
            throw new IOException(
                    "originalCodePointCount " + metadata.originalCodePointCount()
                    + " exceeds safety limit " + ArchiveFormat.MAX_CODE_POINT_COUNT);
        }
        if (metadata.encodedBitCount() > ArchiveFormat.MAX_BIT_COUNT) {
            throw new IOException(
                    "encodedBitCount " + metadata.encodedBitCount()
                    + " exceeds safety limit " + ArchiveFormat.MAX_BIT_COUNT);
        }
        if (metadata.treeNodeCount() > ArchiveFormat.MAX_TREE_NODES) {
            throw new IOException(
                    "treeNodeCount " + metadata.treeNodeCount()
                    + " exceeds safety limit " + ArchiveFormat.MAX_TREE_NODES);
        }

        // Consistency check: a non-empty archive must have all three non-zero
        boolean hasData = metadata.originalCodePointCount() > 0
                       || metadata.encodedBitCount() > 0
                       || metadata.treeNodeCount() > 0;
        if (hasData) {
            if (metadata.originalCodePointCount() == 0) {
                throw new IOException("Inconsistent metadata: treeNodeCount or bitCount > 0 but originalCodePointCount is 0");
            }
            if (metadata.treeNodeCount() == 0) {
                throw new IOException("Inconsistent metadata: originalCodePointCount > 0 but treeNodeCount is 0");
            }
        }
    }

    /**
     * Throws if the buffer does not have at least {@code count} bytes remaining.
     */
    private void requireBytes(ByteBuffer buf, int count, String field) throws IOException {
        if (buf.remaining() < count) {
            throw new IOException(
                    "Truncated archive: need " + count + " bytes for " + field
                    + " but only " + buf.remaining() + " bytes remain");
        }
    }

    /**
     * Throws if the buffer still has unread bytes remaining, indicating trailing garbage data.
     */
    private void requireExactlyAtEnd(ByteBuffer buf, int totalLength, String context) throws IOException {
        if (buf.hasRemaining()) {
            throw new IOException(
                    "Unexpected " + buf.remaining() + " trailing byte(s) " + context
                    + " in a " + totalLength + "-byte archive");
        }
    }

    /**
     * Formats a byte array as a hex string for error messages.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 3);
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }
}
