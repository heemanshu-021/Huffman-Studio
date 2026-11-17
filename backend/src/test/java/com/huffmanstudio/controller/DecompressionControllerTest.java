package com.huffmanstudio.controller;

import com.huffmanstudio.archive.ArchiveFormat;
import com.huffmanstudio.archive.HuffmanArchiveService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link DecompressionController} using MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
class DecompressionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private HuffmanArchiveService archiveService;

    @Test
    @DisplayName("POST /api/decompress should decompress valid .huf archive and restore exact text")
    void decompressValidArchive() throws Exception {
        String originalText = "Huffman Studio is an enterprise-grade compression platform with real binary packing.";
        byte[] archiveBytes = archiveService.compressText(originalText);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.huf",
                "application/octet-stream",
                archiveBytes
        );

        MvcResult result = mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("test-document.txt")))
                .andExpect(header().exists("X-Original-Bytes"))
                .andExpect(header().exists("X-Archive-Bytes"))
                .andExpect(header().exists("X-Compression-Ratio"))
                .andReturn();

        String restoredText = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals(originalText, restoredText, "Restored text must exactly match original");
    }

    @Test
    @DisplayName("POST /api/decompress should decompress Unicode text (Hindi, Chinese, Cyrillic) with byte fidelity")
    void decompressUnicodeArchive() throws Exception {
        String originalText = "नमस्ते दुनिया! 霍夫曼编码. Привет мир!";
        byte[] archiveBytes = archiveService.compressText(originalText);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "multilingual.huf",
                "application/octet-stream",
                archiveBytes
        );

        MvcResult result = mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isOk())
                .andReturn();

        String restoredText = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals(originalText, restoredText);
    }

    @Test
    @DisplayName("POST /api/decompress should decompress emojis accurately")
    void decompressEmojiArchive() throws Exception {
        String originalText = "Emojis round trip: 😀🎉🌍🚀✨🔥💡🎵🦄";
        byte[] archiveBytes = archiveService.compressText(originalText);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "emojis.huf",
                "application/octet-stream",
                archiveBytes
        );

        MvcResult result = mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isOk())
                .andReturn();

        String restoredText = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals(originalText, restoredText);
    }

    @Test
    @DisplayName("POST /api/decompress should decompress empty archive returning empty string")
    void decompressEmptyArchive() throws Exception {
        byte[] emptyArchiveBytes = archiveService.compressText("");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.huf",
                "application/octet-stream",
                emptyArchiveBytes
        );

        MvcResult result = mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Original-Bytes", "0"))
                .andReturn();

        String restoredText = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals("", restoredText);
    }

    @Test
    @DisplayName("POST /api/decompress should decompress single-character text correctly")
    void decompressSingleCharacterArchive() throws Exception {
        String originalText = "AAAAAAAAAAAAAAAAAAAA";
        byte[] archiveBytes = archiveService.compressText(originalText);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "single.huf",
                "application/octet-stream",
                archiveBytes
        );

        MvcResult result = mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isOk())
                .andReturn();

        String restoredText = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertEquals(originalText, restoredText);
    }

    @Test
    @DisplayName("POST /api/decompress should sanitize path traversal in archive filename")
    void sanitizePathTraversalInArchiveFilename() throws Exception {
        String originalText = "Protected path content";
        byte[] archiveBytes = archiveService.compressText(originalText);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../../../../secret/data.huf",
                "application/octet-stream",
                archiveBytes
        );

        mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("data.txt")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(".."))));
    }

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    @Test
    @DisplayName("POST /api/decompress without file part should return 400 Bad Request")
    void missingFilePart() throws Exception {
        mockMvc.perform(multipart("/api/decompress"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/decompress with empty file (0 bytes) should return 400 Bad Request")
    void emptyFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "zero-bytes.huf",
                "application/octet-stream",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_FILE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("empty")));
    }

    @Test
    @DisplayName("POST /api/decompress with non-.huf extension should return 400 Bad Request")
    void invalidExtension() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "archive.zip",
                "application/zip",
                new byte[] { 0x50, 0x4B, 0x03, 0x04 }
        );

        mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_FILE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(".huf")));
    }

    @Test
    @DisplayName("POST /api/decompress with corrupted magic header should return 422 Unprocessable Entity")
    void corruptedMagicHeader() throws Exception {
        byte[] validArchive = archiveService.compressText("Sample content");
        byte[] corrupted = validArchive.clone();
        // Overwrite magic "HUFN" with "BAD!"
        corrupted[0] = 'B';
        corrupted[1] = 'A';
        corrupted[2] = 'D';
        corrupted[3] = '!';

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "corrupted-magic.huf",
                "application/octet-stream",
                corrupted
        );

        mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_ARCHIVE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("magic")));
    }

    @Test
    @DisplayName("POST /api/decompress with truncated archive should return 422 Unprocessable Entity")
    void truncatedArchive() throws Exception {
        byte[] validArchive = archiveService.compressText("Content for truncated test");
        // Truncate to just 10 bytes (header is 29 bytes)
        byte[] truncated = new byte[10];
        System.arraycopy(validArchive, 0, truncated, 0, 10);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "truncated.huf",
                "application/octet-stream",
                truncated
        );

        mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_ARCHIVE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Truncated")));
    }

    @Test
    @DisplayName("POST /api/decompress with tampered CRC32 checksum should return 422 Unprocessable Entity")
    void tamperedChecksum() throws Exception {
        byte[] validArchive = archiveService.compressText("Integrity validation content");
        byte[] tampered = validArchive.clone();

        // Alter the CRC32 checksum in the header (offset 25..28)
        ByteBuffer buf = ByteBuffer.wrap(tampered).order(ByteOrder.BIG_ENDIAN);
        int originalCrc = buf.getInt(ArchiveFormat.OFFSET_CRC32);
        buf.putInt(ArchiveFormat.OFFSET_CRC32, originalCrc ^ 0xFFFFFFFF);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "tampered-crc.huf",
                "application/octet-stream",
                tampered
        );

        mockMvc.perform(multipart("/api/decompress").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_ARCHIVE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("CRC32")));
    }
}
