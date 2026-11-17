package com.huffmanstudio.archive;

import com.huffmanstudio.model.HuffmanNode;
import com.huffmanstudio.model.HuffmanResult;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.zip.CRC32;

/**
 * Serializes a Huffman compression result into a self-contained binary {@code .huf} archive.
 *
 * <h2>Archive Layout (see {@link ArchiveFormat} for byte offsets)</h2>
 * <ol>
 *   <li>Fixed-size header (magic, version, codePointCount, bitCount, treeNodeCount, CRC32)</li>
 *   <li>Serialized Huffman tree in preorder DFS</li>
 *   <li>Packed binary payload (bit-packed, MSB-first, zero-padded to byte boundary)</li>
 * </ol>
 *
 * <h2>File Safety</h2>
 * <p>{@link #writeToFile(HuffmanResult, String, Path)} writes to a temporary file first,
 * then atomically moves it to the destination. This prevents partially-written archives
 * from appearing at the target path if the JVM or OS crashes during the write.
 *
 * <h2>Thread Safety</h2>
 * <p>All public methods are stateless and can be called concurrently.
 */
public class HuffmanArchiveWriter {

    /**
     * Serializes a Huffman compression result into a {@code .huf} archive and returns
     * the archive as a byte array.
     *
     * @param result       the completed Huffman compression result from Phase 2
     * @param originalText the original uncompressed text
     * @return a complete binary {@code .huf} archive as a byte array
     * @throws IOException              if an I/O error occurs during byte assembly
     * @throws IllegalArgumentException if {@code result} is null
     */
    public byte[] writeToBytes(HuffmanResult result, String originalText) throws IOException {
        if (result == null) {
            throw new IllegalArgumentException("HuffmanResult cannot be null");
        }

        // Handle empty input: produce a header-only archive with zero counts
        if (originalText == null || originalText.isEmpty()) {
            return buildEmptyArchive();
        }

        // --- Serialize tree ---
        TreeSerializationResult treeResult = serializeTree(result.getRootNode());

        // --- Pack bits ---
        BitWriter bitWriter = new BitWriter();
        bitWriter.writeCode(result.getEncodedBitString());
        byte[] payloadBytes = bitWriter.toBytes();
        long meaningfulBitCount = bitWriter.getBitCount();

        // --- Compute CRC32 of original UTF-8 bytes ---
        byte[] originalUtf8 = originalText.getBytes(StandardCharsets.UTF_8);
        long crc32 = computeCrc32(originalUtf8);

        // --- Count original Unicode code points ---
        long codePointCount = countCodePoints(originalText);

        // --- Assemble archive ---
        ByteArrayOutputStream out = new ByteArrayOutputStream(
                ArchiveFormat.FIXED_HEADER_SIZE
                + treeResult.treeBytes().length
                + payloadBytes.length
        );
        DataOutputStream dos = new DataOutputStream(out);

        writeHeader(dos, codePointCount, meaningfulBitCount, treeResult.nodeCount(), crc32);
        dos.write(treeResult.treeBytes());
        dos.write(payloadBytes);
        dos.flush();

        return out.toByteArray();
    }

    /**
     * Writes a {@code .huf} archive to the given destination {@link Path}.
     *
     * <p>Uses an atomic write strategy: data is first written to a sibling temp file,
     * then moved to {@code destination} atomically. The source file is never modified.
     *
     * @param result      the completed Huffman compression result
     * @param originalText the original text string
     * @param destination  path where the final archive file should appear
     * @throws IOException              if any I/O error occurs
     * @throws IllegalArgumentException if {@code result} or {@code destination} is null
     */
    public void writeToFile(HuffmanResult result, String originalText, Path destination) throws IOException {
        if (destination == null) {
            throw new IllegalArgumentException("Destination path cannot be null");
        }

        byte[] archiveBytes = writeToBytes(result, originalText);

        // Write to a temporary sibling file, then move atomically
        Path tempFile = Files.createTempFile(
                destination.toAbsolutePath().getParent() != null
                        ? destination.toAbsolutePath().getParent()
                        : Path.of(System.getProperty("java.io.tmpdir")),
                ".huf-write-",
                ".tmp"
        );

        try {
            Files.write(tempFile, archiveBytes);
            atomicMove(tempFile, destination);
        } catch (Exception e) {
            // Clean up the temp file if the move failed
            try { Files.deleteIfExists(tempFile); } catch (IOException ignored) { }
            throw e;
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Writes the fixed-size archive header to the output stream.
     */
    private void writeHeader(
            DataOutputStream dos,
            long codePointCount,
            long bitCount,
            int  treeNodeCount,
            long crc32
    ) throws IOException {
        // Magic: "HUFN"
        dos.write(ArchiveFormat.MAGIC);

        // Format version
        dos.writeByte(ArchiveFormat.FORMAT_VERSION);

        // Original Unicode code-point count (8 bytes, big-endian)
        dos.writeLong(codePointCount);

        // Meaningful encoded bit count (8 bytes, big-endian)
        dos.writeLong(bitCount);

        // Serialized tree node count (4 bytes, big-endian)
        dos.writeInt(treeNodeCount);

        // CRC32 of original UTF-8 bytes stored as an unsigned 32-bit big-endian int
        dos.writeInt((int) (crc32 & 0xFFFFFFFFL));
    }

    /**
     * Builds a minimal valid archive representing empty input.
     * Header only: all counts zero, no tree data, no payload.
     */
    private byte[] buildEmptyArchive() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(ArchiveFormat.FIXED_HEADER_SIZE);
        DataOutputStream dos = new DataOutputStream(out);
        writeHeader(dos, 0L, 0L, 0, 0L);
        dos.flush();
        return out.toByteArray();
    }

    /**
     * Serializes a Huffman tree into bytes using preorder DFS traversal.
     * Returns the serialized bytes and the total node count.
     */
    private TreeSerializationResult serializeTree(HuffmanNode root) throws IOException {
        if (root == null) {
            return new TreeSerializationResult(new byte[0], 0);
        }

        ByteArrayOutputStream treeOut = new ByteArrayOutputStream();
        DataOutputStream treeDos = new DataOutputStream(treeOut);
        int[] nodeCounter = { 0 };

        serializeNode(root, treeDos, nodeCounter);
        treeDos.flush();

        return new TreeSerializationResult(treeOut.toByteArray(), nodeCounter[0]);
    }

    /**
     * Recursively serializes a single node (preorder: root, left, right).
     */
    private void serializeNode(HuffmanNode node, DataOutputStream out, int[] nodeCounter)
            throws IOException {
        nodeCounter[0]++;

        if (node.isLeaf()) {
            // Leaf: 0x01 marker + 4-byte Unicode code point
            out.writeByte(ArchiveFormat.LEAF_MARKER);
            out.writeInt(node.getCodePoint());
        } else {
            // Internal: 0x00 marker, then recurse left then right
            out.writeByte(ArchiveFormat.INTERNAL_MARKER);
            serializeNode(node.getLeft(), out, nodeCounter);
            serializeNode(node.getRight(), out, nodeCounter);
        }
    }

    /**
     * Computes the CRC32 checksum of a byte array.
     *
     * @param data the bytes to checksum
     * @return unsigned CRC32 value as a {@code long}
     */
    private long computeCrc32(byte[] data) {
        CRC32 crc = new CRC32();
        crc.update(data);
        return crc.getValue(); // already unsigned [0, 2^32)
    }

    /**
     * Counts the number of Unicode code points in a string.
     */
    private long countCodePoints(String text) {
        return text.codePoints().count();
    }

    /**
     * Atomically moves {@code source} to {@code target}.
     * Falls back to a copy-then-delete strategy when the OS does not support atomic moves
     * across file-system boundaries.
     */
    private void atomicMove(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    // =========================================================================
    // Internal result type for tree serialization
    // =========================================================================

    /**
     * Holds the results of tree serialization: the bytes and the node count.
     */
    private record TreeSerializationResult(byte[] treeBytes, int nodeCount) { }
}
