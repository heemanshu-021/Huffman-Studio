package com.huffmanstudio.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link AnalysisController} using MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/analyze (JSON) with standard text should return full analysis")
    void analyzeStandardText() throws Exception {
        String json = "{\"text\":\"AB RACADABRA\"}";

        mockMvc.perform(post("/api/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalText").value("AB RACADABRA"))
                .andExpect(jsonPath("$.characterCount").value(12))
                .andExpect(jsonPath("$.uniqueCharacterCount").value(6))
                .andExpect(jsonPath("$.frequencies", hasSize(6)))
                .andExpect(jsonPath("$.codeTable", hasSize(6)))
                .andExpect(jsonPath("$.tree").isMap())
                .andExpect(jsonPath("$.tree.isLeaf").value(false))
                .andExpect(jsonPath("$.tree.left").isMap())
                .andExpect(jsonPath("$.tree.right").isMap())
                .andExpect(jsonPath("$.encodedBitString").isNotEmpty())
                .andExpect(jsonPath("$.compressionRatio").isNumber());
    }

    @Test
    @DisplayName("POST /api/analyze (JSON) with single-character text should return leaf root")
    void analyzeSingleCharacter() throws Exception {
        String json = "{\"text\":\"AAAAA\"}";

        mockMvc.perform(post("/api/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.characterCount").value(5))
                .andExpect(jsonPath("$.uniqueCharacterCount").value(1))
                .andExpect(jsonPath("$.tree.isLeaf").value(true))
                .andExpect(jsonPath("$.tree.character").value("A"))
                .andExpect(jsonPath("$.tree.code").value("0"))
                .andExpect(jsonPath("$.codeTable[0].code").value("0"));
    }

    @Test
    @DisplayName("POST /api/analyze (JSON) with empty text should return empty response with null tree")
    void analyzeEmptyText() throws Exception {
        String json = "{\"text\":\"\"}";

        mockMvc.perform(post("/api/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.characterCount").value(0))
                .andExpect(jsonPath("$.uniqueCharacterCount").value(0))
                .andExpect(jsonPath("$.tree").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/analyze (JSON) with Unicode Hindi text should preserve code points")
    void analyzeUnicodeHindi() throws Exception {
        String json = "{\"text\":\"नमस्ते\"}";

        mockMvc.perform(post("/api/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.frequencies", not(empty())))
                .andExpect(jsonPath("$.codeTable", not(empty())));
    }

    @Test
    @DisplayName("POST /api/analyze (JSON) with emojis should preserve surrogate code points")
    void analyzeEmojis() throws Exception {
        String json = "{\"text\":\"🚀✨🔥\"}";

        mockMvc.perform(post("/api/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uniqueCharacterCount").value(3))
                .andExpect(jsonPath("$.frequencies", hasSize(3)));
    }

    @Test
    @DisplayName("POST /api/analyze (Multipart) with valid text file should return analysis")
    void analyzeMultipartFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "Huffman Studio".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/analyze").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalText").value("Huffman Studio"))
                .andExpect(jsonPath("$.tree").exists());
    }

    @Test
    @DisplayName("POST /api/analyze (Multipart) with text param should return analysis")
    void analyzeMultipartTextParam() throws Exception {
        mockMvc.perform(multipart("/api/analyze").param("text", "Hello World"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalText").value("Hello World"));
    }

    @Test
    @DisplayName("POST /api/analyze (Multipart) without file or text should return 400 Bad Request")
    void analyzeMultipartMissingParams() throws Exception {
        mockMvc.perform(multipart("/api/analyze"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_FILE"));
    }

    @Test
    @DisplayName("POST /api/analyze (Multipart) with invalid UTF-8 should return 422")
    void analyzeMultipartInvalidUtf8() throws Exception {
        byte[] invalidUtf8 = new byte[] { (byte) 0xC3, (byte) 0x28 };
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "broken.txt",
                "text/plain",
                invalidUtf8
        );

        mockMvc.perform(multipart("/api/analyze").file(file))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_TEXT_ENCODING"));
    }
}
