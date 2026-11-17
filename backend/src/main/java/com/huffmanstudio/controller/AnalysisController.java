package com.huffmanstudio.controller;

import com.huffmanstudio.dto.AnalysisRequest;
import com.huffmanstudio.dto.AnalysisResponse;
import com.huffmanstudio.exception.InvalidFileException;
import com.huffmanstudio.service.AnalysisApiService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for inspecting and analyzing text and generating Huffman tree structures.
 */
@RestController
@RequestMapping("/api/analyze")
public class AnalysisController {

    private final AnalysisApiService analysisService;

    public AnalysisController(AnalysisApiService analysisService) {
        this.analysisService = analysisService;
    }

    /**
     * Analyzes JSON text payload, computing frequencies, codes, metrics, and hierarchical tree.
     *
     * @param request request containing text
     * @return 200 OK with full AnalysisResponse
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AnalysisResponse> analyzeJson(@RequestBody AnalysisRequest request) {
        String text = (request != null && request.text() != null) ? request.text() : "";
        AnalysisResponse response = analysisService.analyzeText(text);
        return ResponseEntity.ok(response);
    }

    /**
     * Analyzes multipart file or form text payload.
     *
     * @param file optional uploaded text file
     * @param text optional form text parameter
     * @return 200 OK with full AnalysisResponse
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisResponse> analyzeMultipart(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text
    ) {
        if (file != null && !file.isEmpty()) {
            AnalysisResponse response = analysisService.analyzeFile(file);
            return ResponseEntity.ok(response);
        }

        if (text != null) {
            AnalysisResponse response = analysisService.analyzeText(text);
            return ResponseEntity.ok(response);
        }

        throw new InvalidFileException("Either 'file' or 'text' must be provided for analysis");
    }
}
