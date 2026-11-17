package com.huffmanstudio.controller;

import com.huffmanstudio.dto.DecompressionFileResponse;
import com.huffmanstudio.model.ArchiveStatistics;
import com.huffmanstudio.service.DecompressionApiService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * REST controller for decompressing binary .huf archives back into plain text files.
 */
@RestController
@RequestMapping("/api/decompress")
public class DecompressionController {

    private final DecompressionApiService decompressionService;

    public DecompressionController(DecompressionApiService decompressionService) {
        this.decompressionService = decompressionService;
    }

    /**
     * Accepts a multipart .huf binary archive, independently reconstructs the Huffman tree,
     * verifies checksum and integrity, and streams the restored plain text file (.txt).
     *
     * @param file the uploaded .huf archive file
     * @return 200 OK with restored text payload and statistics headers
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> decompressFile(@RequestParam("file") MultipartFile file) {
        DecompressionFileResponse response = decompressionService.decompress(file);

        HttpHeaders headers = createHeaders(
                response.downloadFilename(),
                MediaType.parseMediaType("text/plain; charset=UTF-8"),
                response.textBytes().length,
                response.statistics()
        );

        return ResponseEntity.ok()
                .headers(headers)
                .body(response.textBytes());
    }

    private HttpHeaders createHeaders(
            String filename,
            MediaType mediaType,
            long contentLength,
            ArchiveStatistics stats
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentLength(contentLength);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build());

        if (stats != null) {
            headers.set("X-Original-Bytes", String.valueOf(stats.originalUtf8Bytes()));
            headers.set("X-Archive-Bytes", String.valueOf(stats.totalArchiveBytes()));
            headers.set("X-Payload-Bits", String.valueOf(stats.huffmanPayloadBits()));
            headers.set("X-Payload-Bytes", String.valueOf(stats.payloadBytes()));
            headers.set("X-Tree-Bytes", String.valueOf(stats.treeMetadataBytes()));
            headers.set("X-Header-Bytes", String.valueOf(stats.headerBytes()));
            headers.set("X-Bytes-Saved", String.valueOf(stats.bytesSavedOrAdded()));
            headers.set("X-Compression-Ratio", String.format(Locale.US, "%.4f", stats.archiveCompressionRatio()));
            headers.set("X-Percentage-Saved", String.format(Locale.US, "%.2f", stats.percentageSaved()));
        }

        return headers;
    }
}
