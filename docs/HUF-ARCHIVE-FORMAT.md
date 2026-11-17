# HUF Archive Format — Binary Specification

**Huffman Studio Phase 3 | Version 1.0**

---

## Overview

A `.huf` file is a self-contained binary archive produced by the Huffman Studio compression engine. It contains everything needed to decompress the original text without any external data: a fixed-size header, a serialized Huffman coding tree, and a packed binary payload.

No third-party compression libraries are used. All byte-level packing and tree serialization is implemented from scratch in Java 21.

---

## 1. File Extension

```
.huf
```

Huffman Studio archives always use this extension by convention.

---

## 2. Byte Order

All multi-byte integer fields are stored in **big-endian** (network/Java) byte order.

---

## 3. Full Archive Layout

```
Offset   Size (bytes)   Field
------   ------------   ------------------------------------------------
     0            4     Magic signature: ASCII "HUFN"
     4            1     Format version  (currently 0x01)
     5            8     Original Unicode code-point count  (long)
    13            8     Meaningful encoded bit count        (long)
    21            4     Serialized tree node count          (int)
    25            4     CRC32 of original UTF-8 bytes       (unsigned int)
    29            ?     Serialized Huffman tree             (variable)
     ?            ?     Packed binary payload               (variable)
```

> **Fixed header size:** 29 bytes.
>
> Tree and payload sizes are variable and are determined by the header fields.

---

## 4. Field Descriptions

### 4.1 Magic Signature (bytes 0–3)

| Byte | Value  | ASCII |
|------|--------|-------|
| 0    | `0x48` | H     |
| 1    | `0x55` | U     |
| 2    | `0x46` | F     |
| 3    | `0x4E` | N     |

The reader rejects any archive whose first four bytes do not exactly match `HUFN`.

---

### 4.2 Format Version (byte 4)

| Value  | Meaning                 |
|--------|-------------------------|
| `0x01` | Current supported version |

The reader rejects archives with any version value other than `0x01`. Future versions will increment this field.

---

### 4.3 Original Code-Point Count (bytes 5–12)

8-byte big-endian signed `long`.  
The number of Unicode **code points** (not Java `char` units) in the original text.

- Used after decompression to verify that the correct number of code points was reconstructed.
- Zero for empty input.

---

### 4.4 Meaningful Encoded Bit Count (bytes 13–20)

8-byte big-endian signed `long`.  
The number of **data bits** in the packed binary payload section.

- The last byte of the payload may contain up to 7 zero-padding bits; this field tells the reader exactly where data ends.
- Zero for empty input.

---

### 4.5 Serialized Tree Node Count (bytes 21–24)

4-byte big-endian signed `int`.  
The total count of nodes (both leaf and internal) in the serialized Huffman tree.

- Used to detect truncated or malformed trees during deserialization.
- Zero for empty input.

---

### 4.6 CRC32 Checksum (bytes 25–28)

4-byte big-endian value storing the **unsigned CRC32** (ISO 3309 / RFC 1952) of the original text's **UTF-8 bytes**.

- Stored as a 4-byte big-endian integer (unsigned 32-bit value written as a Java `int`).
- Zero for empty input.
- Verified during decompression: the CRC32 of the restored UTF-8 bytes must match this value. A mismatch indicates corruption.

---

## 5. Serialized Huffman Tree

Immediately follows the fixed header (at byte offset 29).

### Traversal Order

**Preorder DFS** (root → left → right).

### Node Encoding

| Node Type | Bytes | Layout                          |
|-----------|-------|---------------------------------|
| Leaf      | 5     | `0x01` + 4-byte Unicode code point (big-endian int) |
| Internal  | 1     | `0x00` (followed recursively by left child then right child) |

### Tree Node Count

The total serialized node count must equal `Fixed Header → treeNodeCount`. The reader counts nodes during deserialization and rejects archives where the counts disagree.

### Validation

- Duplicate leaf code points → rejected.
- Code point values outside the valid Unicode range (`0` to `0x10FFFF`) → rejected.
- Unknown marker bytes (not `0x00` or `0x01`) → rejected.
- Tree depth exceeding `MAX_TREE_DEPTH` (128) → rejected.
- Node count exceeding `MAX_TREE_NODES` (131 072) → rejected.

---

## 6. Packed Binary Payload

Immediately follows the serialized tree section.

### Bit Packing

- Bits are packed **MSB-first** (most-significant bit of each byte is used first).
- When the total meaningful bit count is not a multiple of 8, the last byte is **zero-padded** on the right (LSB side).
- The reader reads exactly `encodedBitCount` bits and ignores the padding bits.
- Padding bits that are non-zero indicate corruption and are rejected.

### Payload Byte Count

```
payloadBytes = ceil(encodedBitCount / 8)
```

### Example — Packing 5 bits `1 0 1 1 0`

```
Bit positions in byte:  7  6  5  4  3  2  1  0
Data bits:              1  0  1  1  0
Padding bits:                           0  0  0

Resulting byte:         1010_1000  =  0xA8
```

---

## 7. Special Cases

### 7.1 Empty Input

| Field              | Value |
|--------------------|-------|
| originalCodePointCount | 0 |
| encodedBitCount    | 0     |
| treeNodeCount      | 0     |
| CRC32              | 0     |
| Tree data          | (none) |
| Payload data       | (none) |

An empty archive is exactly **29 bytes** (the fixed header with all-zero counts, preceded by the magic and version).

---

### 7.2 Single Unique Character

When the input contains exactly one distinct character:

- The Huffman tree has a **single leaf node** (the root is a leaf).
- Each occurrence of the character is encoded as the bit `0` (Huffman Studio convention).
- The payload contains exactly `codePointCount` bits, all `0`.

Example: `"AAAA"` (4 occurrences of 'A') → payload = `0000` → 1 byte `0x00`, bitCount = 4.

---

## 8. Example Archive Layout

For the input `"ab"` (characters 'a'=97, 'b'=98, one each):

```
Offset  Hex bytes             Meaning
------  --------------------  -----------------------------------------
0       48 55 46 4E           Magic "HUFN"
4       01                    Version 1
5       00 00 00 00 00 00 00 02   originalCodePointCount = 2
13      00 00 00 00 00 00 00 02   encodedBitCount = 2
21      00 00 00 03           treeNodeCount = 3 (1 internal + 2 leaves)
25      ??  ??  ??  ??        CRC32 of UTF-8 bytes of "ab"
29      00                    Internal node marker
30      01 00 00 00 61        Leaf 'a' (code point 97)
35      01 00 00 00 62        Leaf 'b' (code point 98)
40      ??                    Payload: 2 bits packed into 1 byte
```

The exact codes depend on the Huffman tree shape, which is deterministic given the tie-breaking rules.

---

## 9. CRC32 Algorithm

The CRC32 is computed using Java's `java.util.zip.CRC32` class:

```java
CRC32 crc = new CRC32();
crc.update(originalText.getBytes(StandardCharsets.UTF_8));
long checksum = crc.getValue(); // unsigned 32-bit value
```

This uses the standard ISO 3309 / IEEE 802.3 polynomial (`0xEDB88320` reflected).

---

## 10. Safety Limits

| Limit                | Value         | Reason                                     |
|----------------------|---------------|--------------------------------------------|
| `MAX_ARCHIVE_BYTES`  | 512 MB        | Prevents loading huge files into memory    |
| `MAX_TREE_NODES`     | 131 072       | Prevents unbounded tree deserialization    |
| `MAX_TREE_DEPTH`     | 128           | Prevents stack overflow during recursion   |
| `MAX_BIT_COUNT`      | 8 GB of bits  | Guards against implausibly large payloads  |
| `MAX_CODE_POINT_COUNT` | 500 000 000 | Prevents runaway memory allocation         |

---

## 11. Reading and Writing Algorithm

### Writing (Compression)

1. Run the Huffman algorithm on the input text to produce a code table and encoded bit string.
2. Pack the bit string into bytes using `BitWriter` (MSB-first).
3. Serialize the Huffman tree in preorder DFS using `HuffmanArchiveWriter`.
4. Write the fixed header, then the tree bytes, then the payload bytes.
5. Write to a temporary file, then atomically move to the destination.

### Reading (Decompression)

1. Load the archive bytes and verify the magic and version.
2. Read and validate all header fields.
3. Deserialize the Huffman tree recursively in preorder from the byte stream.
4. Verify the declared tree node count.
5. Read the payload bytes and initialize a `BitReader` with the declared bit count.
6. Convert the bit stream to a string of `'0'` and `'1'` characters.
7. Decode using `HuffmanDecoder.decode(bitString, root)`.
8. Verify the CRC32 of the restored UTF-8 bytes matches the archived CRC32.
9. Verify the restored code-point count matches the archived count.

---

## 12. Version History

| Version | Phase   | Changes                                       |
|---------|---------|-----------------------------------------------|
| 0x01    | Phase 3 | Initial release. All fields above established. |

---

*Huffman Studio — Phase 3 — Binary Archive Format v1.0*
