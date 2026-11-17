package com.huffmanstudio.archive;

import com.huffmanstudio.algorithm.HuffmanCompressor;
import com.huffmanstudio.algorithm.HuffmanDecoder;
import com.huffmanstudio.model.ArchiveStatistics;
import com.huffmanstudio.model.HuffmanNode;
import com.huffmanstudio.model.HuffmanResult;

import java.io.IOException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.CRC32;

/**
 * High-level service that orchestrates the full Huffman archive compression and decompression
 * workflow, delegating to the Phase 2 algorithm and Phase 3 archive I/O components.
 *
 * <h2>Compression Flow</h2>
 * <ol>
 *   <li>Run the Huffman algorithm ({@link HuffmanCompressor}) to build the tree and bit string.</li>
 *   <li>Serialize the result into a {@code .huf} archive ({@link HuffmanArchiveWriter}).</li>
 *   <li>Optionally write the archive to a file and return {@link ArchiveStatistics}.</li>
 * </ol>
 *
 * <h2>Decompression Flow</h2>
 * <ol>
 *   <li>Read and validate the archive ({@link HuffmanArchiveReader}).</li>
 *   <li>Extract the packed payload and reconstruct the Huffman tree from archive data alone.</li>
 *   <li>Decode the bit stream ({@link HuffmanDecoder}) back to the original string.</li>
 *   <li>Verify the CRC32 of the restored UTF-8 bytes against the value stored in the header.</li>
 *   <li>Verify the decoded code-point count matches the declared count.</li>
 * </ol>
 *
 * <h2>Thread Safety</h2>
 * <p>All methods are stateless. Multiple threads can call any method concurrently.
 */
public class HuffmanArchiveService {

    private final HuffmanArchiveWriter archiveWriter = new HuffmanArchiveWriter();
    private final HuffmanArchiveReader archiveReader = new HuffmanArchiveReader();

    // =========================================================================
    // Compression
    // =========================================================================

    /**
     * Compresses a text string and returns the binary {@code .huf} archive as a byte array.
     *
     * @param text the original text to compress; {@code null} or empty returns a minimal
     *             empty archive
     * @return complete binary archive bytes
     * @throws IOException if archive assembly fails
     */
    public byte[] compressText(String text) throws IOException {
        if (text == null || text.isEmpty()) {
            HuffmanResult emptyResult = HuffmanResult.empty();
            return archiveWriter.writeToBytes(emptyResult, "");
        }

        HuffmanResult result = HuffmanCompressor.compress(text);
        return archiveWriter.writeToBytes(result, text);
    }

    /**
     * Compresses a text string and writes the resulting archive to {@code destination}.
     *
     * @param text        the original text to compress
     * @param destination path where the {@code .huf} archive will be written
     * @return {@link ArchiveStatistics} describing the compression outcome
     * @throws IOException              if compression or file writing fails
     * @throws IllegalArgumentException if {@code destination} is null
     */
    public ArchiveStatistics compressTextToFile(String text, Path destination) throws IOException {
        if (destination == null) {
            throw new IllegalArgumentException("destination path cannot be null");
        }

        HuffmanResult result = (text == null || text.isEmpty())
                ? HuffmanResult.empty()
                : HuffmanCompressor.compress(text);

        archiveWriter.writeToFile(result, (text != null) ? text : "", destination);
        byte[] archiveBytes = Files.readAllBytes(destination);

        return buildArchiveStatistics(text, result, archiveBytes);
    }

    /**
     * Compresses a plain text file and writes the resulting archive to {@code destinationHuf}.
     *
     * <p>The source file is read using strict UTF-8 decoding. Any byte sequence that is
     * not valid UTF-8 causes an {@link IOException}.
     *
     * @param sourceTxt      path to the UTF-8 encoded source text file
     * @param destinationHuf path where the {@code .huf} archive will be written
     * @return {@link ArchiveStatistics} describing the compression outcome
     * @throws IOException if the source file cannot be read, is not valid UTF-8,
     *                     or if archive writing fails
     */
    public ArchiveStatistics compressFile(Path sourceTxt, Path destinationHuf) throws IOException {
        validateFileArgs(sourceTxt, destinationHuf, "source", "destination");
        requireNotSamePath(sourceTxt, destinationHuf);

        String text = readUtf8Strict(sourceTxt);
        return compressTextToFile(text, destinationHuf);
    }

    // =========================================================================
    // Decompression
    // =========================================================================

    /**
     * Decompresses a {@code .huf} archive given as an in-memory byte array and returns
     * the original text string.
     *
     * @param archiveBytes the full archive content
     * @return the restored original text; empty string for empty archives
     * @throws IOException if the archive is malformed, corrupt, or fails integrity checks
     */
    public String decompressBytes(byte[] archiveBytes) throws IOException {
        if (archiveBytes == null) {
            throw new IllegalArgumentException("archiveBytes cannot be null");
        }

        HuffmanArchiveReader.ReadResult readResult = archiveReader.readFromBytes(archiveBytes);

        if (readResult.isEmpty()) {
            return "";
        }

        return decodeAndVerify(readResult);
    }

    /**
     * Decompresses a {@code .huf} archive file and writes the original text to
     * {@code destinationTxt} as UTF-8.
     *
     * <p>The source archive file is never modified.
     *
     * @param sourceHuf      path to the {@code .huf} archive file
     * @param destinationTxt path where the restored plain text will be written
     * @return {@link ArchiveStatistics} from the round trip (computed from decompressed output)
     * @throws IOException if reading, decompression, or writing fails
     */
    public ArchiveStatistics decompressFile(Path sourceHuf, Path destinationTxt) throws IOException {
        validateFileArgs(sourceHuf, destinationTxt, "source archive", "destination text");
        requireNotSamePath(sourceHuf, destinationTxt);

        HuffmanArchiveReader.ReadResult readResult = archiveReader.readFromFile(sourceHuf);

        String restoredText = readResult.isEmpty() ? "" : decodeAndVerify(readResult);

        // Write the restored text as UTF-8
        byte[] restoredBytes = restoredText.getBytes(StandardCharsets.UTF_8);
        writeAtomically(destinationTxt, restoredBytes);

        byte[] archiveBytes = Files.readAllBytes(sourceHuf);
        // Build a minimal-info ArchiveStatistics from the decompressed side
        long payloadBits = readResult.metadata().encodedBitCount();
        long treeBytes   = archiveBytes.length
                - ArchiveFormat.FIXED_HEADER_SIZE
                - readResult.metadata().payloadByteCount();

        return ArchiveStatistics.calculate(restoredText, archiveBytes, payloadBits, treeBytes);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Decodes the payload from a valid {@link HuffmanArchiveReader.ReadResult}, verifies
     * CRC32 and code-point count, and returns the original text.
     */
    private String decodeAndVerify(HuffmanArchiveReader.ReadResult readResult) throws IOException {
        ArchiveMetadata metadata = readResult.metadata();
        HuffmanNode root = readResult.root();
        BitReader bitReader = readResult.createBitReader();

        // Reconstruct the bit string for the HuffmanDecoder
        String bitString = bitReader.readAllBitsAsString();

        // Decode using the reconstructed tree
        String restoredText;
        try {
            restoredText = HuffmanDecoder.decode(bitString, root);
        } catch (IllegalArgumentException e) {
            throw new IOException("Huffman decoding failed: " + e.getMessage(), e);
        }

        // Verify CRC32
        byte[] restoredUtf8 = restoredText.getBytes(StandardCharsets.UTF_8);
        long actualCrc32 = computeCrc32(restoredUtf8);
        if (actualCrc32 != metadata.crc32Checksum()) {
            throw new IOException(
                    "CRC32 integrity check failed. Archive declares 0x"
                    + Long.toHexString(metadata.crc32Checksum())
                    + " but decoded text has 0x"
                    + Long.toHexString(actualCrc32)
                    + ". The archive may be corrupt.");
        }

        // Verify Unicode code-point count
        long actualCodePoints = restoredText.codePoints().count();
        if (actualCodePoints != metadata.originalCodePointCount()) {
            throw new IOException(
                    "Code-point count mismatch. Archive declares "
                    + metadata.originalCodePointCount()
                    + " but decoded text contains "
                    + actualCodePoints + " code points.");
        }

        return restoredText;
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
        return crc.getValue();
    }

    /**
     * Builds an {@link ArchiveStatistics} record from a compression result and the produced
     * archive bytes.
     */
    private ArchiveStatistics buildArchiveStatistics(
            String text,
            HuffmanResult result,
            byte[] archiveBytes
    ) {
        long payloadBits = (result.getEncodedBitString() != null)
                ? result.getEncodedBitString().length()
                : 0L;

        long treeBytes = archiveBytes.length
                - ArchiveFormat.FIXED_HEADER_SIZE
                - ((payloadBits + 7L) / 8L);

        return ArchiveStatistics.calculate(text, archiveBytes, payloadBits, Math.max(0, treeBytes));
    }

    /**
     * Reads a file as a strict UTF-8 string, failing on any malformed bytes.
     */
    private String readUtf8Strict(Path path) throws IOException {
        byte[] raw = Files.readAllBytes(path);
        CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        try {
            return decoder.decode(java.nio.ByteBuffer.wrap(raw)).toString();
        } catch (java.nio.charset.CharacterCodingException e) {
            throw new IOException("Source file is not valid UTF-8: " + path, e);
        }
    }

    /**
     * Writes bytes to a file atomically via a temp file + move strategy.
     */
    private void writeAtomically(Path destination, byte[] content) throws IOException {
        Path parent = destination.toAbsolutePath().getParent();
        Path tempFile = Files.createTempFile(
                parent != null ? parent : Path.of(System.getProperty("java.io.tmpdir")),
                ".huf-restore-", ".tmp");
        try {
            Files.write(tempFile, content);
            try {
                Files.move(tempFile, destination,
                        java.nio.file.StandardCopyOption.ATOMIC_MOVE,
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            } catch (java.nio.file.AtomicMoveNotSupportedException e) {
                Files.move(tempFile, destination,
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception e) {
            try { Files.deleteIfExists(tempFile); } catch (IOException ignored) { }
            throw e;
        }
    }

    /**
     * Validates that neither file path is null and that the source file exists.
     */
    private void validateFileArgs(Path source, Path destination,
                                   String sourceLabel, String destLabel) throws IOException {
        if (source == null) {
            throw new IllegalArgumentException(sourceLabel + " path cannot be null");
        }
        if (destination == null) {
            throw new IllegalArgumentException(destLabel + " path cannot be null");
        }
        if (!Files.exists(source)) {
            throw new IOException(sourceLabel + " file does not exist: " + source);
        }
    }

    /**
     * Throws if {@code a} and {@code b} resolve to the same absolute path.
     */
    private void requireNotSamePath(Path a, Path b) throws IOException {
        if (a.toAbsolutePath().normalize().equals(b.toAbsolutePath().normalize())) {
            throw new IOException(
                    "Source and destination paths must be different: " + a);
        }
    }
}
