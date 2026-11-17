package com.huffmanstudio.service;

import com.huffmanstudio.algorithm.HuffmanCompressor;
import com.huffmanstudio.dto.AnalysisResponse;
import com.huffmanstudio.dto.CharacterFrequencyDto;
import com.huffmanstudio.dto.CodeTableEntryDto;
import com.huffmanstudio.dto.TreeNodeDto;
import com.huffmanstudio.exception.InvalidFileException;
import com.huffmanstudio.exception.InvalidTextEncodingException;
import com.huffmanstudio.model.HuffmanNode;
import com.huffmanstudio.model.HuffmanResult;
import com.huffmanstudio.model.HuffmanStatistics;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Service providing detailed algorithmic analysis of text using the Java 21 Huffman engine.
 *
 * <p>Produces full character frequencies, prefix code mappings, hierarchical tree topology,
 * and compression metrics for interactive visualization and inspection.
 */
@Service
public class AnalysisApiService {

    /**
     * Analyzes raw text string using the authentic Huffman algorithm.
     *
     * @param text input text to analyze
     * @return populated {@link AnalysisResponse} containing tree, codes, frequencies, and metrics
     */
    public AnalysisResponse analyzeText(String text) {
        String safeText = (text != null) ? text : "";

        if (safeText.isEmpty()) {
            return new AnalysisResponse(
                    "",
                    0,
                    0,
                    0L,
                    0L,
                    0L,
                    0.0,
                    0.0,
                    "",
                    Collections.emptyList(),
                    Collections.emptyList(),
                    null
            );
        }

        // 1. Run authentic Huffman compression pipeline
        HuffmanResult result = HuffmanCompressor.compress(safeText);
        HuffmanStatistics stats = result.getStatistics();
        int totalCodePoints = (int) stats.originalCodePointCount();

        // 2. Build sorted frequency table
        List<CharacterFrequencyDto> frequencies = buildFrequencies(result.getFrequencyMap(), totalCodePoints);

        // 3. Build sorted code table
        List<CodeTableEntryDto> codeTable = buildCodeTable(result.getCodeTable(), result.getFrequencyMap());

        // 4. Build hierarchical tree topology
        TreeNodeDto tree = buildTreeHierarchy(result.getRootNode(), result.getCodeTable());

        return new AnalysisResponse(
                safeText,
                totalCodePoints,
                stats.uniqueCharacterCount(),
                stats.originalByteSize(),
                stats.encodedBitCount(),
                stats.encodedByteCount(),
                stats.compressionRatio(),
                stats.percentageSaved(),
                result.getEncodedBitString(),
                frequencies,
                codeTable,
                tree
        );
    }

    /**
     * Reads and analyzes an uploaded text file.
     *
     * @param file uploaded multipart text file
     * @return populated {@link AnalysisResponse}
     * @throws InvalidFileException         if file is missing or has invalid extension
     * @throws InvalidTextEncodingException if file contains invalid UTF-8 sequences
     */
    public AnalysisResponse analyzeFile(MultipartFile file) {
        if (file == null) {
            throw new InvalidFileException("Uploaded file is required for analysis");
        }

        String filename = file.getOriginalFilename();
        if (filename != null && !filename.isBlank()) {
            String lower = filename.toLowerCase();
            if (!lower.endsWith(".txt") && !lower.endsWith(".json") && !lower.endsWith(".csv") && !lower.endsWith(".md")) {
                throw new InvalidFileException("Only text files (.txt, .json, .csv, .md) are supported for analysis");
            }
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidFileException("Failed to read uploaded file: " + e.getMessage());
        }

        String text = decodeUtf8Strict(bytes);
        return analyzeText(text);
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    private List<CharacterFrequencyDto> buildFrequencies(Map<Integer, Integer> freqMap, int totalCodePoints) {
        if (freqMap == null || freqMap.isEmpty()) {
            return Collections.emptyList();
        }

        List<CharacterFrequencyDto> list = new ArrayList<>(freqMap.size());
        for (Map.Entry<Integer, Integer> entry : freqMap.entrySet()) {
            int cp = entry.getKey();
            int freq = entry.getValue();
            double pct = (totalCodePoints > 0) ? ((double) freq / totalCodePoints) * 100.0 : 0.0;

            String character = Character.toString(cp);
            String display = formatDisplayCharacter(cp);

            list.add(new CharacterFrequencyDto(cp, character, display, freq, pct));
        }

        // Sort descending by frequency, then ascending by code point
        list.sort((a, b) -> {
            int cmp = Integer.compare(b.frequency(), a.frequency());
            if (cmp != 0) return cmp;
            return Integer.compare(a.codePoint(), b.codePoint());
        });

        return list;
    }

    private List<CodeTableEntryDto> buildCodeTable(Map<Integer, String> codeTableMap, Map<Integer, Integer> freqMap) {
        if (codeTableMap == null || codeTableMap.isEmpty()) {
            return Collections.emptyList();
        }

        List<CodeTableEntryDto> list = new ArrayList<>(codeTableMap.size());
        for (Map.Entry<Integer, String> entry : codeTableMap.entrySet()) {
            int cp = entry.getKey();
            String code = entry.getValue();
            int freq = freqMap.getOrDefault(cp, 0);

            String character = Character.toString(cp);
            String display = formatDisplayCharacter(cp);

            list.add(new CodeTableEntryDto(cp, character, display, code, code.length(), freq));
        }

        // Sort ascending by bit length, then descending by frequency, then code point
        list.sort((a, b) -> {
            int cmp = Integer.compare(a.bitLength(), b.bitLength());
            if (cmp != 0) return cmp;
            int freqCmp = Integer.compare(b.frequency(), a.frequency());
            if (freqCmp != 0) return freqCmp;
            return Integer.compare(a.codePoint(), b.codePoint());
        });

        return list;
    }

    private TreeNodeDto buildTreeHierarchy(HuffmanNode root, Map<Integer, String> codeTable) {
        if (root == null) {
            return null;
        }

        int[] counter = { 0 };
        // If single-character tree (root is leaf), assign code "0"
        String rootCode = root.isLeaf() ? "0" : "";
        return toDto(root, rootCode, counter);
    }

    private TreeNodeDto toDto(HuffmanNode node, String currentCode, int[] counter) {
        String id = "node-" + (++counter[0]);

        if (node.isLeaf()) {
            int cp = node.getCodePoint();
            String character = node.getCharacterAsString();
            String display = node.getCharacterDisplay();
            return new TreeNodeDto(
                    id,
                    node.getFrequency(),
                    cp,
                    character,
                    display,
                    true,
                    currentCode,
                    null,
                    null
            );
        }

        TreeNodeDto left = toDto(node.getLeft(), currentCode + "0", counter);
        TreeNodeDto right = toDto(node.getRight(), currentCode + "1", counter);

        return new TreeNodeDto(
                id,
                node.getFrequency(),
                null,
                "",
                "[Internal]",
                false,
                currentCode,
                left,
                right
        );
    }

    private String formatDisplayCharacter(int codePoint) {
        return switch (codePoint) {
            case ' ' -> "[Space]";
            case '\n' -> "\\n [Newline]";
            case '\r' -> "\\r [Return]";
            case '\t' -> "\\t [Tab]";
            default -> Character.toString(codePoint);
        };
    }

    private String decodeUtf8Strict(byte[] fileBytes) {
        if (fileBytes.length == 0) {
            return "";
        }
        CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        try {
            return decoder.decode(ByteBuffer.wrap(fileBytes)).toString();
        } catch (CharacterCodingException e) {
            throw new InvalidTextEncodingException("Uploaded file contains invalid UTF-8 byte sequences");
        }
    }
}
