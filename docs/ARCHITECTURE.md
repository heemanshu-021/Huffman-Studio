# Huffman Studio — System Architecture Specification

## 1. Architectural Philosophy

Huffman Studio is engineered as an enterprise-grade academic software project adhering to the principles of **Separation of Concerns (SoC)**, **Single Responsibility Principle (SRP)**, and **Clean Layered Architecture**.

The project explicitly bifurcates the system into two completely decoupled tiers:
1. **Frontend Presentation Tier (Client)**: A reactive, single-page application built with React, TypeScript, and Tailwind CSS. Its sole obligation is user interaction, reactive state management, data visualization, and asynchronous API communication.
2. **Backend Engine Tier (Server)**: A high-performance Java 21 Spring Boot service. It is solely responsible for CPU-bound algorithmic computation, bit-level data streaming, binary serialization, validation, and REST API exposure.

```
+-------------------------------------------------------------------------+
|                         CLIENT: React + Vite SPA                        |
|                                                                         |
|   +-------------------+    +--------------------+    +--------------+   |
|   | Pages (Route Views)|<---| Layouts & Nav     |<---| Components   |   |
|   +---------+---------+    +--------------------+    +--------------+   |
|             |                                                           |
|             v                                                           |
|   +-------------------+    +--------------------+                       |
|   | Custom Hooks      |--->| API Services Layer |                       |
|   +-------------------+    +---------+----------+                       |
+--------------------------------------|----------------------------------+
                                       |
                   HTTP REST / JSON / Multipart Streams
                                       |
+--------------------------------------v----------------------------------+
|                      SERVER: Java 21 / Spring Boot                      |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   | Controller Layer (@RestController)                              |   |
|   | - Thin HTTP routing, payload validation, status mapping        |   |
|   +--------------------------------+--------------------------------+   |
|                                    |                                    |
|   +--------------------------------v--------------------------------+   |
|   | Service Layer (@Service)                                        |   |
|   | - Business logic orchestration, DTO assembly, audit metrics    |   |
|   +--------------------------------+--------------------------------+   |
|                                    |                                    |
|   +--------------------------------v--------------------------------+   |
|   | Algorithm & Model Layer (Pure Java Core)                        |   |
|   | - Min-Heap, HuffmanNode, HuffmanTree, BitWriter / BitReader     |   |
|   | - .huf Binary Archive Serialization & Deserialization           |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
```

---

## 2. Backend Layered Architecture (`backend/src/main/java/com/huffmanstudio/`)

The backend codebase is structured into clear, non-overlapping packages:

```
com.huffmanstudio/
|-- HuffmanStudioApplication.java  # Spring Boot entry point
|-- config/                        # Cross-cutting configurations (CORS, Jackson, WebMvc)
|-- controller/                    # Thin REST controllers handling HTTP requests
|-- service/                       # Application business logic & coordination
|-- algorithm/                     # Pure Java Huffman algorithm components & bit streams
|-- model/                         # Core domain entities (HuffmanNode, HuffmanTree)
|-- dto/                           # Data Transfer Objects (Request/Response contracts)
`-- exception/                     # Centralized exception hierarchy & global advice
```

### Layer Responsibilities

| Package | Responsibility | Rules & Invariants |
| :--- | :--- | :--- |
| `controller` | Receives HTTP requests, triggers validation, delegates to services, returns HTTP status codes. | Must remain thin. No algorithm or file processing logic allowed. |
| `service` | Coordinates data transfer, converts between domain models and DTOs, orchestrates algorithm execution. | Stateless. Depends on algorithm classes and models. |
| `algorithm` | Pure computational engine: byte frequency counting, priority-queue tree construction, code table generation, bit packing. | Framework-agnostic. No Spring dependencies (`@Component` etc.) to guarantee high portability and unit testability. |
| `model` | Domain data structures: `HuffmanNode` (comparable by frequency), `HuffmanTree`, and in-memory representation of compressed archives. | Immutable where feasible; clear equals/hashCode/compareTo contracts. |
| `dto` | Strongly-typed transfer objects exchanged with the client (e.g. `HealthResponse`, `CompressionResultDto`, `TreeStructureDto`). | Validated with `jakarta.validation` annotations. |
| `exception` | Custom domain exceptions (`InvalidArchiveException`, `CompressionException`) and `@RestControllerAdvice` handler. | Maps all unexpected and business exceptions to consistent JSON error schemas. |
| `config` | CORS profiles (allowing Vite frontend on port `5173`), JSON serialization configurations. | Centralized and environment-aware. |

---

## 3. Frontend Architecture (`frontend/src/`)

The React frontend utilizes a modular folder layout that segregates presentation, routing, state, and networking:

```
frontend/src/
|-- assets/       # Static assets, SVG logos, brand elements
|-- components/   # Reusable atomic and composite UI elements (buttons, cards, badges)
|-- layouts/      # App scaffolding: MainLayout, Header, Navigation Sidebar, Footer
|-- pages/        # Route page controllers (Dashboard, Compressor, Visualizer, etc.)
|-- services/     # Centralized network clients (Axios / Fetch) and REST API methods
|-- hooks/        # Custom React hooks encapsulating stateful logic and API queries
|-- types/        # TypeScript interfaces, unions, and API contract types
|-- utils/        # Pure helper utilities (size formatters, bit string formatters)
|-- App.tsx       # Root router configuration
|-- main.tsx      # Application bootstrapper
`-- index.css     # Tailwind CSS base and utility directives
```

### Layer Responsibilities

* **`layouts/`**: Houses `MainLayout.tsx`, which provides a unified navigation header, dynamic status indicator reflecting backend health, and responsive content area.
* **`pages/`**: Top-level views mapped to React Router paths (`/`, `/compress`, `/decompress`, `/visualizer`, `/how-it-works`).
* **`services/`**: Centralized API abstraction (`apiClient.ts`, `healthService.ts`). UI components **never** invoke `fetch()` directly; all network calls route through dedicated service modules.
* **`hooks/`**: Provides reusable lifecycle logic (e.g., `useHealthCheck` for backend polling and status reporting).
* **`types/`**: Single source of truth for data structures mirroring backend DTOs to enforce strict compile-time type safety.

---

## 4. Communication & Protocol Contracts

The frontend and backend interact exclusively via standard HTTP REST conventions:

| Endpoint | Method | Request Payload | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | *None* | `application/json` | System health status, timestamp, and version check. |
| `/api/compress` *(Phase 4)* | `POST` | `multipart/form-data` | `application/octet-stream` or `JSON` | Encodes text file into `.huf` binary stream with compression metrics. |
| `/api/decompress` *(Phase 4)* | `POST` | `multipart/form-data` (`.huf` file) | `text/plain` | Decodes `.huf` archive and streams original restored text. |
| `/api/visualize` *(Phase 4)* | `POST` | `multipart/form-data` or `raw text` | `application/json` | Emits hierarchical tree nodes, character frequencies, and prefix codes. |

### Standard Health Response JSON Format:
```json
{
  "status": "UP",
  "message": "Huffman Studio Backend is operational",
  "timestamp": "2026-11-17T17:00:00Z",
  "version": "1.0.0"
}
```

### Standard Error Response JSON Format:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "The uploaded archive has an invalid magic header.",
  "timestamp": "2026-11-17T17:00:00Z",
  "path": "/api/decompress"
}
```

---

## 5. Proprietary `.huf` Binary Container Specification *(Phases 2 & 3)*

To achieve genuine text compression without external dependencies or ephemeral state, Huffman Studio utilizes a self-contained binary file structure:

```
+-----------------------------------------------------------------------------+
|                           HUFFMAN ARCHIVE (.huf)                            |
+-----------------------------------------------------------------------------+
| Offset (Bytes) | Field Name        | Type     | Description                 |
+----------------+-------------------+----------+-----------------------------+
| 0 .. 3         | Magic Identifier  | 4 Bytes  | ASCII "HUFF" (0x48554646)   |
| 4              | Format Version    | 1 Byte   | 0x01                        |
| 5              | Padding Bit Count | 1 Byte   | Unused bits in final byte   |
| 6 .. 7         | Tree Table Size   | 2 Bytes  | Number of unique symbols    |
| 8 .. N         | Frequency Header  | Variable | Serialized symbol frequencies|
| (N+1) .. End   | Bitstream Payload | Variable | Packed Huffman encoded bits |
+-----------------------------------------------------------------------------+
```

### Self-Contained Decompression Invariant:
Any `.huf` file generated by Huffman Studio contains all information required to reconstruct the identical Huffman tree and fully decode the content without reference to cached server memory.

---

## 6. Cross-Origin Resource Sharing (CORS) Architecture

The backend implements `CorsConfig` enabling credentials, HTTP methods (`GET`, `POST`, `OPTIONS`), and explicit origins (`http://localhost:5173` and `http://127.0.0.1:5173`) so frontend developers experience frictionless local iteration.

---

## 7. Huffman Core Algorithm Engine Design & Data Flow (Phase 2)

The algorithmic core of Huffman Studio lives in `com.huffmanstudio.algorithm` and `com.huffmanstudio.model`, deliberately decoupled from Spring MVC and HTTP concerns.

### 7.1 Algorithmic Component Data Flow

```
Input Text String
      |
      v
[FrequencyCounter] ----------------> Map<Integer, Integer> (CodePoint -> Frequency)
                                            |
                                            v
                                   [HuffmanTreeBuilder] (PriorityQueue Min-Heap)
                                            |
                                            v
                                    Root HuffmanNode
                                            |
                                            +---------------------------+
                                            |                           |
                                            v                           v
                                  [HuffmanCodeGenerator]        [HuffmanDecoder]
                                            |                           ^
                                            v                           |
                                   Map<Integer, String>                 |
                                            |                           |
                                            v                           |
Input Text String -------------> [HuffmanEncoder]                       |
                                            |                           |
                                            v                           |
                                   Encoded Bit String ------------------+
                                            |
                                            v
                                  [HuffmanStatistics]
                                            |
                                            v
                                      HuffmanResult
```

### 7.2 Core Classes & Responsibilities

1. **`HuffmanNode` (`model`)**:
   - Represents either a leaf node (with a non-null Unicode `codePoint` and `frequency`) or an internal node (with `left` and `right` child references and sum of frequencies).
   - Implements `Comparable<HuffmanNode>` with a two-tier ordering:
     1. Primary: `frequency` ascending.
     2. Secondary (Deterministic Tie-Breaker): `lowestCodePoint` ascending.
2. **`FrequencyCounter` (`algorithm`)**:
   - Iterates across Unicode code points (`Character.codePointAt`), ensuring emojis, non-English alphabets, and whitespace are counted without surrogate-pair corruption.
3. **`HuffmanTreeBuilder` (`algorithm`)**:
   - Uses a Java `PriorityQueue<HuffmanNode>` min-heap.
   - Repeatedly polls the two smallest nodes, creates an internal parent node with their sum, and reinserts until one root remains.
   - Handles single unique characters by returning a single leaf root.
4. **`HuffmanCodeGenerator` (`algorithm`)**:
   - Traverses the tree depth-first: `'0'` for left branches, `'1'` for right branches.
   - For a single-character tree (root is leaf), explicitly assigns code `"0"`.
5. **`HuffmanEncoder` (`algorithm`)**:
   - Translates raw input text into a continuous binary string (`"010011..."`) using the generated code table.
   - Rejects text containing characters missing from the code table.
6. **`HuffmanDecoder` (`algorithm`)**:
   - Traverses the Huffman tree root-to-leaf using each bit in the encoded stream.
   - Emits restored characters when leaves are reached and resets traversal to the root.
   - Rejects invalid bit characters and premature stream terminations mid-tree.
7. **`HuffmanStatistics` (`model`)**:
   - Immutable record computing character count, original UTF-8 bytes, encoded bits, ceil byte count, compression ratio, and percentage saved.
8. **`HuffmanCompressor` (`algorithm`)**:
   - Orchestrates the entire pipeline, returning an immutable `HuffmanResult`.

---

## 8. Binary Archive Engine Design (Phase 3)

The archive layer lives in `com.huffmanstudio.archive` and `com.huffmanstudio.model.ArchiveStatistics`. It is fully decoupled from Spring MVC.

### 8.1 Package: `com.huffmanstudio.archive`

| Class | Responsibility |
|---|---|
| `ArchiveFormat` | Constants: magic bytes, field offsets, sizes, safety limits. No logic. |
| `ArchiveMetadata` | Immutable record of the five header fields parsed from an archive. |
| `BitWriter` | Packs individual bits into bytes, MSB-first. Tracks meaningful bit count. |
| `BitReader` | Reads individual bits from a byte array, respecting the declared meaningful bit count. Never exposes padding bits. |
| `HuffmanArchiveWriter` | Serializes a `HuffmanResult` into a `.huf` byte array or file. Uses atomic temp-file strategy for safe file writes. |
| `HuffmanArchiveReader` | Reads and validates a `.huf` archive; reconstructs the Huffman tree; extracts payload bytes. |
| `HuffmanArchiveService` | High-level orchestrator: `compressText`, `compressFile`, `decompressBytes`, `decompressFile`. |

### 8.2 Archive Data Flow

```
Input Text
     |
     v
[HuffmanCompressor.compress(text)]
     |
     v
HuffmanResult ─────────────────────────────────────────┐
(root, codeTable, encodedBitString, stats)             │
     |                                                  │
     v                                                  v
[BitWriter]                                [HuffmanArchiveWriter.serializeTree(root)]
  → packs bit string into bytes              → preorder DFS: 0x01+codePoint or 0x00
     |                                                  │
     v                                                  v
payloadBytes                                       treeBytes
     |                                                  │
     └──────────────────── [write header] ──────────────┘
                                  |
                                  v
                       .huf binary archive bytes
```

```
.huf binary archive bytes
     |
     v
[HuffmanArchiveReader.readFromBytes]
  → validate magic, version, metadata limits
  → readNode (preorder DFS, recursively reconstruct HuffmanNode tree)
  → verify treeNodeCount, no duplicates, valid code points
  → extract payloadBytes
     |
     v
HuffmanArchiveReader.ReadResult {metadata, root, payloadBytes}
     |
     v
[BitReader(payloadBytes, encodedBitCount).readAllBitsAsString()]
     |
     v
[HuffmanDecoder.decode(bitString, root)]
     |
     v
restoredText → verify CRC32 → verify codePointCount → ✓
```

### 8.3 Self-Contained Decompression Guarantee

The archive contains the full Huffman coding tree encoded in its binary structure. Decompression requires **only the archive bytes** — no original frequency map, no in-memory `HuffmanResult`, no server session state. This makes `.huf` files portable across machines and JVM restarts.

### 8.4 Key Design Decisions

- **Big-endian byte order** for all multi-byte fields (matches Java `DataOutputStream` defaults).
- **Preorder tree serialization**: root written first simplifies recursive deserialization — read a marker byte, then recurse for children.
- **CRC32 integrity check** catches bit-flips in transit. The checksum covers the original UTF-8 bytes, not the archive bytes.
- **Atomic file writes**: archives are written to a `.tmp` sibling file, then atomically moved to the destination, preventing partial writes from appearing at the target path.
- **Safety limits** (`MAX_TREE_NODES`, `MAX_TREE_DEPTH`, `MAX_BIT_COUNT`, `MAX_ARCHIVE_BYTES`) protect against maliciously crafted archives causing memory exhaustion or stack overflow.
- **Zero-padding validation**: padding bits in the last payload byte must be zero; non-zero padding indicates corruption.

