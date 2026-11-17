package com.huffmanstudio.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link CompressionController} using MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CompressionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/compress should compress standard English text file and return .huf with headers")
    void compressStandardTextFile() throws Exception {
        String text = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.txt",
                "text/plain",
                text.getBytes(StandardCharsets.UTF_8)
        );

        MvcResult result = mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("sample.huf")))
                .andExpect(header().exists("X-Original-Bytes"))
                .andExpect(header().exists("X-Archive-Bytes"))
                .andExpect(header().exists("X-Payload-Bits"))
                .andExpect(header().exists("X-Payload-Bytes"))
                .andExpect(header().exists("X-Tree-Bytes"))
                .andExpect(header().exists("X-Header-Bytes"))
                .andExpect(header().exists("X-Bytes-Saved"))
                .andExpect(header().exists("X-Compression-Ratio"))
                .andExpect(header().exists("X-Percentage-Saved"))
                .andReturn();

        byte[] archiveBytes = result.getResponse().getContentAsByteArray();
        assertTrue(archiveBytes.length >= 29, "Archive must be at least 29 bytes");

        // Verify magic signature "HUFN"
        assertEquals('H', (char) archiveBytes[0]);
        assertEquals('U', (char) archiveBytes[1]);
        assertEquals('F', (char) archiveBytes[2]);
        assertEquals('N', (char) archiveBytes[3]);
        assertEquals(1, archiveBytes[4], "Version must be 1");

        // Verify X-Original-Bytes equals actual text length
        long originalBytes = Long.parseLong(result.getResponse().getHeader("X-Original-Bytes"));
        assertEquals(text.getBytes(StandardCharsets.UTF_8).length, originalBytes);
    }

    @Test
    @DisplayName("POST /api/compress should handle text with spaces, punctuation, tabs, and newlines")
    void compressTextWithFormatting() throws Exception {
        String text = "Line 1: Special chars !@#$%^&*()_+\nLine 2:\tTabbed line\r\nLine 3: Final line.";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "formatted.txt",
                "text/plain",
                text.getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("formatted.huf")));
    }

    @Test
    @DisplayName("POST /api/compress should compress single-character text correctly")
    void compressSingleCharacterText() throws Exception {
        String text = "ZZZZZZZZZZZZZZZZZZZZ";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "single.txt",
                "text/plain",
                text.getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
                .andExpect(header().string("X-Original-Bytes", "20"));
    }

    @Test
    @DisplayName("POST /api/compress should compress multilingual Unicode text (Hindi, Chinese)")
    void compressUnicodeText() throws Exception {
        String text = "नमस्ते दुनिया! 霍夫曼编码是一種数据压缩算法。";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "unicode.txt",
                "text/plain",
                text.getBytes(StandardCharsets.UTF_8)
        );

        MvcResult result = mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
                .andReturn();

        byte[] bytes = result.getResponse().getContentAsByteArray();
        assertEquals('H', (char) bytes[0]);
        assertEquals('U', (char) bytes[1]);
        assertEquals('F', (char) bytes[2]);
        assertEquals('N', (char) bytes[3]);
    }

    @Test
    @DisplayName("POST /api/compress should compress emojis (supplementary code points)")
    void compressEmojiText() throws Exception {
        String text = "Coding with AI 🚀✨🔥! Huffman Studio is awesome 🎉🌍💡";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "emojis.txt",
                "text/plain",
                text.getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM));
    }

    @Test
    @DisplayName("POST /api/compress should compress empty text file and report honest statistics")
    void compressEmptyTextFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        MvcResult result = mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Original-Bytes", "0"))
                .andExpect(header().string("X-Archive-Bytes", "29"))
                .andExpect(header().string("X-Payload-Bits", "0"))
                .andExpect(header().string("X-Tree-Bytes", "0"))
                .andExpect(header().string("X-Header-Bytes", "29"))
                .andReturn();

        byte[] bytes = result.getResponse().getContentAsByteArray();
        assertEquals(29, bytes.length, "Empty archive must be exactly 29 bytes (fixed header only)");
    }

    @Test
    @DisplayName("POST /api/compress should report negative bytes saved honestly for tiny inputs")
    void smallFileOverheadReportedHonestly() throws Exception {
        String text = "hi";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "tiny.txt",
                "text/plain",
                text.getBytes(StandardCharsets.UTF_8)
        );

        MvcResult result = mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andReturn();

        long bytesSaved = Long.parseLong(result.getResponse().getHeader("X-Bytes-Saved"));
        assertTrue(bytesSaved < 0, "Tiny file archive must report negative bytes saved due to container overhead");
    }

    @Test
    @DisplayName("POST /api/compress should sanitize path traversal in filename")
    void sanitizePathTraversalInFilename() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../../../../etc/passwd.txt",
                "text/plain",
                "hello world".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("passwd.huf")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(".."))));
    }

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    @Test
    @DisplayName("POST /api/compress without 'file' part should return 400 Bad Request")
    void missingFilePart() throws Exception {
        mockMvc.perform(multipart("/api/compress"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errorCode").isNotEmpty())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/compress with empty filename should return 400 Bad Request")
    void emptyFilename() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "",
                "text/plain",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_FILE"));
    }

    @Test
    @DisplayName("POST /api/compress with non-.txt extension should return 400 Bad Request")
    void nonTxtExtension() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "dummy content".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_FILE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(".txt")));
    }

    @Test
    @DisplayName("POST /api/compress with invalid UTF-8 bytes should return 422 Unprocessable Entity")
    void invalidUtf8Content() throws Exception {
        // 0xC3 followed by 0x28 is an illegal UTF-8 sequence
        byte[] invalidUtf8 = new byte[] { (byte) 0xC3, (byte) 0x28 };
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "broken.txt",
                "text/plain",
                invalidUtf8
        );

        mockMvc.perform(multipart("/api/compress").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_TEXT_ENCODING"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("UTF-8")));
    }

    @Test
    @DisplayName("POST /api/compress with unsupported Content-Type should return 415")
    void unsupportedMediaType() throws Exception {
        mockMvc.perform(post("/api/compress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"hello\"}"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("UNSUPPORTED_MEDIA_TYPE"));
    }
}
