package com.huffmanstudio.archive;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * File operation safety tests for the Huffman archive service.
 *
 * Tests cover: missing input files, null paths, same-path source/destination,
 * no partial output on failure, and correct behavior for the file-based compress/decompress API.
 */
@DisplayName("Huffman Archive File Operations")
class HuffmanArchiveFileOpsTest {

    private final HuffmanArchiveService service = new HuffmanArchiveService();

    @TempDir
    Path tempDir;

    // =========================================================================
    // compressFile safety
    // =========================================================================

    @Test
    @DisplayName("compressFile with null source path throws IllegalArgumentException")
    void compressFileNullSourceThrows() {
        Path dest = tempDir.resolve("out.huf");
        assertThrows(IllegalArgumentException.class,
                () -> service.compressFile(null, dest));
    }

    @Test
    @DisplayName("compressFile with null destination path throws IllegalArgumentException")
    void compressFileNullDestThrows() throws Exception {
        Path src = tempDir.resolve("src.txt");
        Files.writeString(src, "hello");
        assertThrows(IllegalArgumentException.class,
                () -> service.compressFile(src, null));
    }

    @Test
    @DisplayName("compressFile with non-existent source file throws IOException")
    void compressFileMissingSourceThrows() {
        Path missing = tempDir.resolve("does-not-exist.txt");
        Path dest    = tempDir.resolve("out.huf");
        assertThrows(IOException.class,
                () -> service.compressFile(missing, dest));
    }

    @Test
    @DisplayName("compressFile with same source and destination path throws IOException")
    void compressFileSameSourceAndDestThrows() throws Exception {
        Path same = tempDir.resolve("same.txt");
        Files.writeString(same, "hello");
        // Both source and dest point to the same file
        assertThrows(IOException.class,
                () -> service.compressFile(same, same));
    }

    @Test
    @DisplayName("compressTextToFile with null destination throws IllegalArgumentException")
    void compressTextToFileNullDestThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> service.compressTextToFile("hello", null));
    }

    // =========================================================================
    // decompressFile safety
    // =========================================================================

    @Test
    @DisplayName("decompressFile with null source path throws IllegalArgumentException")
    void decompressFileNullSourceThrows() {
        Path dest = tempDir.resolve("out.txt");
        assertThrows(IllegalArgumentException.class,
                () -> service.decompressFile(null, dest));
    }

    @Test
    @DisplayName("decompressFile with null destination path throws IllegalArgumentException")
    void decompressFileNullDestThrows() throws Exception {
        Path archivePath = tempDir.resolve("test.huf");
        service.compressTextToFile("hello", archivePath);
        assertThrows(IllegalArgumentException.class,
                () -> service.decompressFile(archivePath, null));
    }

    @Test
    @DisplayName("decompressFile with non-existent archive throws IOException")
    void decompressFileMissingArchiveThrows() {
        Path missing = tempDir.resolve("missing.huf");
        Path dest    = tempDir.resolve("out.txt");
        assertThrows(IOException.class,
                () -> service.decompressFile(missing, dest));
    }

    @Test
    @DisplayName("decompressFile with same source and destination path throws IOException")
    void decompressFileSameSourceAndDestThrows() throws Exception {
        Path archivePath = tempDir.resolve("archive.huf");
        service.compressTextToFile("hello", archivePath);
        assertThrows(IOException.class,
                () -> service.decompressFile(archivePath, archivePath));
    }

    // =========================================================================
    // Correct file I/O behavior
    // =========================================================================

    @Test
    @DisplayName("compressFile and decompressFile produce identical text for a plain .txt file")
    void compressAndDecompressFile() throws Exception {
        String original = "Huffman Studio — Phase 3 file operations test.";
        Path sourceTxt  = tempDir.resolve("original.txt");
        Path archivePath = tempDir.resolve("compressed.huf");
        Path restoredPath = tempDir.resolve("restored.txt");

        Files.writeString(sourceTxt, original, java.nio.charset.StandardCharsets.UTF_8);

        service.compressFile(sourceTxt, archivePath);
        assertTrue(Files.exists(archivePath), "Archive must be created");
        assertTrue(Files.size(archivePath) > 0, "Archive must not be empty");

        service.decompressFile(archivePath, restoredPath);
        assertTrue(Files.exists(restoredPath), "Restored file must be created");

        String restored = Files.readString(restoredPath, java.nio.charset.StandardCharsets.UTF_8);
        assertEquals(original, restored);
    }

    @Test
    @DisplayName("No partial output file is left when decompressBytes throws on corrupt data")
    void noPartialOutputOnFailure() throws Exception {
        Path destTxt = tempDir.resolve("restored.txt");
        // Does not exist before the failing call
        assertFalse(Files.exists(destTxt));

        byte[] corrupt = new byte[] { 0x00, 0x01, 0x02, 0x03 }; // wrong magic
        assertThrows(IOException.class,
                () -> service.decompressBytes(corrupt));

        // The destination file should NOT have been created
        assertFalse(Files.exists(destTxt),
                "No output file should be created when decompression fails");
    }

    @Test
    @DisplayName("Compressing an empty .txt file produces a valid empty archive")
    void compressEmptyFile() throws Exception {
        Path emptyTxt = tempDir.resolve("empty.txt");
        Path archivePath = tempDir.resolve("empty.huf");

        Files.writeString(emptyTxt, "");

        service.compressFile(emptyTxt, archivePath);
        assertTrue(Files.exists(archivePath));
        assertEquals(ArchiveFormat.FIXED_HEADER_SIZE, Files.size(archivePath),
                "Empty archive must be exactly " + ArchiveFormat.FIXED_HEADER_SIZE + " bytes");
    }

    @Test
    @DisplayName("Decompressing an empty archive produces an empty .txt file")
    void decompressEmptyArchive() throws Exception {
        Path emptyHuf  = tempDir.resolve("empty.huf");
        Path restoredPath = tempDir.resolve("restored.txt");

        service.compressTextToFile("", emptyHuf);
        service.decompressFile(emptyHuf, restoredPath);

        assertTrue(Files.exists(restoredPath));
        assertEquals("", Files.readString(restoredPath));
    }

    @Test
    @DisplayName("compressFile overwrites an existing destination file cleanly")
    void compressFileOverwritesExisting() throws Exception {
        String original = "Second compression.";
        Path sourceTxt  = tempDir.resolve("src.txt");
        Path archivePath = tempDir.resolve("out.huf");

        // First compression with different content
        Files.writeString(sourceTxt, "First compression.");
        service.compressFile(sourceTxt, archivePath);

        // Overwrite with new content
        Files.writeString(sourceTxt, original);
        service.compressFile(sourceTxt, archivePath);

        // Verify decompression of the overwritten archive is correct
        byte[] archiveBytes = Files.readAllBytes(archivePath);
        String restored = service.decompressBytes(archiveBytes);
        assertEquals(original, restored, "Overwritten archive must decompress to the latest original");
    }
}
