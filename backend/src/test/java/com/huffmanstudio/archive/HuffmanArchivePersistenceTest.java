package com.huffmanstudio.archive;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Persistence tests for the Huffman archive system.
 *
 * These tests verify that a {@code .huf} archive written to disk can be fully
 * decompressed independently — without any in-memory Huffman tree or compression result.
 * This is the core property that makes the archive format self-contained.
 */
@DisplayName("Huffman Archive File Persistence")
class HuffmanArchivePersistenceTest {

    private final HuffmanArchiveService service = new HuffmanArchiveService();

    @TempDir
    Path tempDir;

    @Test
    @DisplayName("Archive written to disk can be decompressed without the original in-memory tree")
    void archiveIsIndependentOfInMemoryTree() throws Exception {
        String original = "The quick brown fox jumps over the lazy dog.";
        Path archivePath = tempDir.resolve("test.huf");

        // Step 1: compress and write to disk
        service.compressTextToFile(original, archivePath);
        assertTrue(Files.exists(archivePath), "Archive file must exist after compression");
        assertTrue(Files.size(archivePath) > 0, "Archive file must not be empty");

        // Step 2: discard all in-memory state — simulate a fresh JVM start by using
        //         a brand-new service instance and fresh reader
        HuffmanArchiveService freshService = new HuffmanArchiveService();

        // Step 3: read and decompress using only the file bytes
        byte[] archiveBytes = Files.readAllBytes(archivePath);
        String restored = freshService.decompressBytes(archiveBytes);

        // Step 4: verify exact match
        assertEquals(original, restored,
                "Decompressed text must equal the original without any in-memory tree");
    }

    @Test
    @DisplayName("Archive survives write-to-disk and read-back for empty input")
    void emptyArchivePersistence() throws Exception {
        Path archivePath = tempDir.resolve("empty.huf");
        service.compressTextToFile("", archivePath);

        byte[] archiveBytes = Files.readAllBytes(archivePath);
        assertEquals(ArchiveFormat.FIXED_HEADER_SIZE, archiveBytes.length,
                "Empty archive must be exactly " + ArchiveFormat.FIXED_HEADER_SIZE + " bytes");

        String restored = service.decompressBytes(archiveBytes);
        assertEquals("", restored);
    }

    @Test
    @DisplayName("Archive for single-character input is self-contained and round-trips correctly")
    void singleCharacterPersistence() throws Exception {
        String original = "AAAAAAAAAA"; // 10 'A's, single unique character
        Path archivePath = tempDir.resolve("single-char.huf");

        service.compressTextToFile(original, archivePath);

        byte[] archiveBytes = Files.readAllBytes(archivePath);
        String restored = new HuffmanArchiveService().decompressBytes(archiveBytes);
        assertEquals(original, restored);
    }

    @Test
    @DisplayName("Archive for Unicode text (Hindi) persists correctly")
    void unicodePersistence() throws Exception {
        String original = "नमस्ते दुनिया! हफ़मैन कोडिंग।";
        Path archivePath = tempDir.resolve("hindi.huf");

        service.compressTextToFile(original, archivePath);
        String restored = new HuffmanArchiveService()
                .decompressBytes(Files.readAllBytes(archivePath));
        assertEquals(original, restored);
    }

    @Test
    @DisplayName("Archive for emoji text persists correctly")
    void emojiPersistence() throws Exception {
        String original = "😀🎉🌍🚀✨🔥💡";
        Path archivePath = tempDir.resolve("emoji.huf");

        service.compressTextToFile(original, archivePath);
        String restored = new HuffmanArchiveService()
                .decompressBytes(Files.readAllBytes(archivePath));
        assertEquals(original, restored);
    }

    @Test
    @DisplayName("compressFile and decompressFile produce identical text via file-based API")
    void compressFileThenDecompressFile() throws Exception {
        String original = "Huffman coding is a lossless data compression algorithm. "
                + "It was developed by David A. Huffman while he was a PhD student at MIT in 1952.";

        Path sourceTxt = tempDir.resolve("original.txt");
        Path archivePath = tempDir.resolve("compressed.huf");
        Path restoredPath = tempDir.resolve("restored.txt");

        // Write original text as UTF-8 file
        Files.writeString(sourceTxt, original);

        // Compress the file
        service.compressFile(sourceTxt, archivePath);
        assertTrue(Files.exists(archivePath), "Archive file must be created");

        // Decompress the archive back to a text file
        service.decompressFile(archivePath, restoredPath);
        assertTrue(Files.exists(restoredPath), "Restored file must be created");

        // Verify byte-exact equality
        String restored = Files.readString(restoredPath);
        assertEquals(original, restored, "Round trip via file-based API must preserve content exactly");
    }

    @Test
    @DisplayName("Source .txt file is unchanged after compression")
    void sourceTxtFileIsUnchangedAfterCompression() throws Exception {
        String original = "Do not modify the source file.";
        Path sourceTxt = tempDir.resolve("source.txt");
        Path archivePath = tempDir.resolve("out.huf");

        Files.writeString(sourceTxt, original);
        byte[] beforeBytes = Files.readAllBytes(sourceTxt);

        service.compressFile(sourceTxt, archivePath);

        byte[] afterBytes = Files.readAllBytes(sourceTxt);
        assertArrayEquals(beforeBytes, afterBytes,
                "Source text file must not be modified during compression");
    }

    @Test
    @DisplayName("Source .huf file is unchanged after decompression")
    void sourceHufFileIsUnchangedAfterDecompression() throws Exception {
        String original = "Do not modify the archive.";
        Path archivePath = tempDir.resolve("src.huf");
        Path restoredPath = tempDir.resolve("restored.txt");

        service.compressTextToFile(original, archivePath);
        byte[] beforeBytes = Files.readAllBytes(archivePath);

        service.decompressFile(archivePath, restoredPath);

        byte[] afterBytes = Files.readAllBytes(archivePath);
        assertArrayEquals(beforeBytes, afterBytes,
                "Source archive file must not be modified during decompression");
    }

    @Test
    @DisplayName("ArchiveStatistics from compressTextToFile has correct original byte count")
    void archiveStatisticsAreCorrect() throws Exception {
        String original = "Hello World";
        Path archivePath = tempDir.resolve("stats.huf");

        com.huffmanstudio.model.ArchiveStatistics stats =
                service.compressTextToFile(original, archivePath);

        assertNotNull(stats);
        // "Hello World" in UTF-8 is 11 bytes
        assertEquals(11L, stats.originalUtf8Bytes(), "Original UTF-8 byte count must be 11");
        assertTrue(stats.totalArchiveBytes() > 0, "Archive must have a positive size");
    }

    @Test
    @DisplayName("Large text round-trips correctly via file API")
    void largeTextFilePersistence() throws Exception {
        String unit = "Pack my box with five dozen liquor jugs. ";
        String original = unit.repeat(100); // ~4100 chars

        Path sourceTxt = tempDir.resolve("large.txt");
        Path archivePath = tempDir.resolve("large.huf");
        Path restoredPath = tempDir.resolve("large-restored.txt");

        Files.writeString(sourceTxt, original);
        service.compressFile(sourceTxt, archivePath);
        service.decompressFile(archivePath, restoredPath);

        String restored = Files.readString(restoredPath);
        assertEquals(original, restored, "Large text must survive a full file-based round trip");
    }
}
