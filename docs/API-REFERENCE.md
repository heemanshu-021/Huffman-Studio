# Huffman Studio — REST API Reference

**Huffman Studio Phase 4 | Version 1.0.0**

This document provides complete, production-grade documentation for the **Huffman Studio** REST API.

---

## 1. General Information

- **Base URL**: `http://localhost:8080`
- **Default Port**: `8080`
- **Supported Protocols**: HTTP/1.1
- **File Upload Format**: `multipart/form-data`
- **Configured Maximum File Size**: `50 MB` (`spring.servlet.multipart.max-file-size: 50MB`)
- **CORS Allowed Origins**:
  - `http://localhost:5173` (Vite development server)
  - `http://127.0.0.1:5173`
  - `http://localhost:3000`
- **CORS Allowed Methods**: `GET`, `POST`, `OPTIONS`
- **CORS Exposed Headers**:
  - `Content-Disposition`
  - `Content-Length`
  - `Content-Type`
  - `X-Original-Bytes`
  - `X-Archive-Bytes`
  - `X-Payload-Bits`
  - `X-Payload-Bytes`
  - `X-Tree-Bytes`
  - `X-Header-Bytes`
  - `X-Bytes-Saved`
  - `X-Compression-Ratio`
  - `X-Percentage-Saved`

---

## 2. Endpoints Overview

| Method | Endpoint | Consumes | Produces | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/api/health` | *None* | `application/json` | Health check & readiness probe |
| `POST` | `/api/compress` | `multipart/form-data` | `application/octet-stream` | Compresses a `.txt` file into binary `.huf` |
| `POST` | `/api/decompress` | `multipart/form-data` | `text/plain; charset=UTF-8` | Decompresses a `.huf` archive into `.txt` |
| `POST` | `/api/analyze` | `application/json` \| `multipart/form-data` | `application/json` | Analyzes text or file for tree visualization, codes & frequencies |

---

## 3. Endpoint Details

### 3.1 Health Check

```http
GET /api/health
```

Verifies backend operational status, runtime version, and connectivity.

#### Request
- Headers: `Accept: application/json`

#### Response (`200 OK`)
```json
{
  "status": "UP",
  "message": "Huffman Studio Backend is operational",
  "timestamp": "2026-11-18T00:43:44.241281Z",
  "version": "1.0.0"
}
```

#### Example cURL
```bash
curl -X GET http://localhost:8080/api/health
```

---

### 3.2 Compress File

```http
POST /api/compress
```

Accepts an uploaded plain text file (`.txt`), performs greedy Huffman tree construction and bit-level packing via the Java 21 compression engine, and streams an authentic binary `.huf` archive.

#### Request
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file` (*required*, `MultipartFile`): The `.txt` text file to compress.

#### Validation Rules
1. `file` parameter is mandatory.
2. Filename must end with `.txt` (case-insensitive).
3. Payload must be valid UTF-8. Non-UTF-8 or malformed byte sequences are rejected with HTTP 422.
4. Empty text files (0 bytes) are supported and produce a valid 29-byte archive header.
5. Path traversal sequences (`../`, `..\`) in filenames are stripped before generating download names.

#### Response (`200 OK`)
- **Content-Type**: `application/octet-stream`
- **Content-Disposition**: `attachment; filename="<sanitized-name>.huf"`
- **Body**: Raw binary `.huf` bytes starting with `HUFN` magic signature.
- **Headers**:

| Header | Type | Description | Example |
|:---|:---|:---|:---|
| `X-Original-Bytes` | Integer | Original text byte length (UTF-8) | `4380` |
| `X-Archive-Bytes` | Integer | Total binary `.huf` file size | `2568` |
| `X-Payload-Bits` | Integer | Exact count of meaningful encoded bits | `19020` |
| `X-Payload-Bytes` | Integer | Packed payload byte count (`ceil(bits/8)`) | `2378` |
| `X-Tree-Bytes` | Integer | Serialized Huffman tree metadata bytes | `161` |
| `X-Header-Bytes` | Integer | Fixed archive header size (always `29`) | `29` |
| `X-Bytes-Saved` | Integer | Net byte difference (`original - archive`) | `1812` |
| `X-Compression-Ratio` | Decimal | `original / archive` ratio (e.g. `1.7056` = 1.71:1) | `1.7056` |
| `X-Percentage-Saved` | Decimal | Percentage reduction in file size | `41.37` |

> **Note on Small Files:** For very short inputs (e.g., `< 50 bytes`), container overhead (fixed 29-byte header + serialized tree) exceeds compressed bit gains. `X-Bytes-Saved` is reported honestly as a negative number and `X-Compression-Ratio` is `< 1.0`.

#### Example cURL
```bash
curl -X POST http://localhost:8080/api/compress \
  -F "file=@sample.txt" \
  -o sample.huf
```

---

### 3.3 Decompress Archive

```http
POST /api/decompress
```

Accepts an authentic `.huf` binary archive, reconstructs the Huffman decoding tree from the archive metadata alone, verifies the original CRC32 checksum and Unicode code-point count, and streams the restored plain text file.

#### Request
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file` (*required*, `MultipartFile`): The `.huf` binary archive to decompress.

#### Validation Rules
1. `file` parameter is mandatory.
2. Filename must end with `.huf` (case-insensitive).
3. Archive must be at least 29 bytes and contain the `HUFN` magic signature.
4. File version must equal `0x01`.
5. Preorder tree structure and node counts must match declared values.
6. Zero-padding in the last payload byte must be verified.
7. Decompressed UTF-8 bytes must match the embedded 32-bit CRC32 checksum.
8. Decompressed Unicode code points must match declared code-point count.

#### Response (`200 OK`)
- **Content-Type**: `text/plain; charset=UTF-8`
- **Content-Disposition**: `attachment; filename="<sanitized-name>.txt"`
- **Body**: Restored plain text bytes (100% byte-for-byte fidelity with original input).
- **Headers**: Same `X-*` statistics headers as compression, derived from the archive metadata.

#### Example cURL
```bash
curl -X POST http://localhost:8080/api/decompress \
  -F "file=@sample.huf" \
  -o recovered.txt
```

---

### 3.4 Analyze Text or File

```http
POST /api/analyze
```

Analyzes raw text or an uploaded text file using the pure Java Huffman engine. Computes code-point frequencies, builds the deterministic prefix tree, generates the prefix-free code table, and emits a hierarchical JSON tree model for interactive frontend visualization.

#### Request Formats

**1. JSON Request:**
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "text": "ABRACADABRA"
}
```

**2. Multipart Request:**
- **Content-Type**: `multipart/form-data`
- **Parameters**: `file` (`MultipartFile`) or `text` (form text field)

#### Response (`200 OK`)
- **Content-Type**: `application/json`
- **Body Schema**:
```json
{
  "originalText": "ABRACADABRA",
  "characterCount": 11,
  "uniqueCharacterCount": 5,
  "originalByteSize": 11,
  "encodedBitCount": 23,
  "encodedByteCount": 3,
  "compressionRatio": 3.6667,
  "percentageSaved": 72.73,
  "encodedBitString": "01101001110011110110100",
  "frequencies": [
    {
      "codePoint": 65,
      "character": "A",
      "displayCharacter": "A",
      "frequency": 5,
      "percentage": 45.45
    }
  ],
  "codeTable": [
    {
      "codePoint": 65,
      "character": "A",
      "displayCharacter": "A",
      "code": "0",
      "bitLength": 1,
      "frequency": 5
    }
  ],
  "tree": {
    "id": "node-1",
    "frequency": 11,
    "codePoint": null,
    "character": "",
    "displayCharacter": "[Internal]",
    "isLeaf": false,
    "code": "",
    "left": {
      "id": "node-2",
      "frequency": 5,
      "codePoint": 65,
      "character": "A",
      "displayCharacter": "A",
      "isLeaf": true,
      "code": "0",
      "left": null,
      "right": null
    },
    "right": {
      "id": "node-3",
      "frequency": 6,
      "codePoint": null,
      "character": "",
      "displayCharacter": "[Internal]",
      "isLeaf": false,
      "code": "1"
    }
  }
}
```

#### Example cURL
```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"Huffman Studio 2026"}'
```

---

## 4. Error Handling and Status Codes

All errors are returned in a uniform JSON format:

```json
{
  "success": false,
  "errorCode": "INVALID_FILE",
  "status": 400,
  "error": "Bad Request",
  "message": "Only .txt files are supported for compression (received: document.pdf)",
  "path": "/api/compress",
  "timestamp": "2026-11-18T00:44:50.700351Z"
}
```

### HTTP Status Codes

| Code | Status | Error Code | Trigger Condition |
|:---|:---|:---|:---|
| **400** | Bad Request | `MISSING_FILE` | Missing `file` multipart parameter |
| **400** | Bad Request | `INVALID_FILE` | Empty filename, wrong extension, or 0-byte archive upload |
| **400** | Bad Request | `INVALID_MULTIPART_REQUEST` | Malformed multipart request structure |
| **413** | Payload Too Large | `PAYLOAD_TOO_LARGE` | File exceeds maximum upload limit (50 MB) |
| **415** | Unsupported Media Type | `UNSUPPORTED_MEDIA_TYPE` | Content-Type is not `multipart/form-data` |
| **422** | Unprocessable Entity | `INVALID_TEXT_ENCODING` | Uploaded `.txt` file contains non-UTF-8 or malformed bytes |
| **422** | Unprocessable Entity | `INVALID_ARCHIVE` | Corrupt magic header, truncated file, invalid tree, or CRC32 mismatch |
| **500** | Internal Server Error | `INTERNAL_SERVER_ERROR` | Unexpected unhandled server exception |

---

## 5. End-to-End Verification Workflow

To test round-trip compression and decompression against a running backend:

```bash
# 1. Create a test file
cat << 'EOF' > test.txt
Huffman Studio Phase 4 REST API Verification.
Supports full Unicode: नमस्ते दुनिया! 霍夫曼编码.
Emojis: 🚀✨🔥
EOF

# 2. Compress via REST API
curl -s -D headers.txt -X POST http://localhost:8080/api/compress \
  -F "file=@test.txt" \
  -o test.huf

# 3. Verify magic bytes
head -c 4 test.huf  # Output: HUFN

# 4. Decompress via REST API
curl -s -X POST http://localhost:8080/api/decompress \
  -F "file=@test.huf" \
  -o test-recovered.txt

# 5. Check exact byte equality
cmp test.txt test-recovered.txt && echo "EXACT MATCH!"
```
