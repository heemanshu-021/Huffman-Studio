package com.huffmanstudio.archive;

/**
 * Constants defining the versioned binary Huffman archive format (.huf).
 *
 * <h2>Archive Binary Layout</h2>
 * <pre>
 * Offset  Size  Field
 * ------  ----  ------------------------------------------------------------------
 *      0     4  Magic signature: ASCII "HUFN" (0x48 0x55 0x46 0x4E)
 *      4     1  Format version (currently 0x01)
 *      5     8  Original Unicode code-point count (big-endian long)
 *     13     8  Meaningful encoded bit count (big-endian long)
 *     21     4  Serialized tree node count (big-endian int)
 *     25     4  CRC32 checksum of original UTF-8 bytes (big-endian int, unsigned)
 *     29     ?  Serialized Huffman tree (preorder DFS)
 *      ?     ?  Packed binary payload (bit-packed, MSB first, zero-padded to byte boundary)
 * </pre>
 *
 * <h2>Tree Serialization (Preorder DFS)</h2>
 * <ul>
 *   <li>Leaf node: 1 byte marker {@code 0x01} followed by 4-byte Unicode code point (big-endian int)</li>
 *   <li>Internal node: 1 byte marker {@code 0x00} followed by left child then right child recursively</li>
 * </ul>
 *
 * <h2>Bit Packing</h2>
 * Bits are packed MSB-first. The last byte is zero-padded when the total bit count is
 * not a multiple of 8. The declared meaningful bit count in the header defines
 * exactly how many bits to decode — padding bits are never interpreted as data.
 *
 * <h2>Special Cases</h2>
 * <ul>
 *   <li>Empty input: tree node count = 0, bit count = 0, no tree bytes, no payload bytes.</li>
 *   <li>Single unique character: tree = one leaf node, payload = N bits all '0' (one per code point).</li>
 * </ul>
 *
 * <h2>Byte Order</h2>
 * All multi-byte integer fields are stored in big-endian (network) byte order.
 */
public final class ArchiveFormat {

    private ArchiveFormat() {
        // Constants-only class
    }

    // -------------------------------------------------------------------------
    // Magic signature and version
    // -------------------------------------------------------------------------

    /** ASCII bytes for the magic header: "HUFN". */
    public static final byte[] MAGIC = { 0x48, 0x55, 0x46, 0x4E };

    /** Current supported archive format version. */
    public static final byte FORMAT_VERSION = 0x01;

    // -------------------------------------------------------------------------
    // Tree node markers
    // -------------------------------------------------------------------------

    /** Byte marker identifying a leaf node during tree serialization. */
    public static final byte LEAF_MARKER   = 0x01;

    /** Byte marker identifying an internal node during tree serialization. */
    public static final byte INTERNAL_MARKER = 0x00;

    // -------------------------------------------------------------------------
    // Header field sizes (bytes)
    // -------------------------------------------------------------------------

    /** Size of the magic signature field in bytes. */
    public static final int MAGIC_SIZE           = 4;

    /** Size of the version field in bytes. */
    public static final int VERSION_SIZE         = 1;

    /** Size of the original code-point count field in bytes. */
    public static final int CODE_POINT_COUNT_SIZE = 8;

    /** Size of the meaningful bit count field in bytes. */
    public static final int BIT_COUNT_SIZE       = 8;

    /** Size of the tree node count field in bytes. */
    public static final int TREE_NODE_COUNT_SIZE = 4;

    /** Size of the CRC32 checksum field in bytes. */
    public static final int CRC32_SIZE           = 4;

    /** Size of a leaf's code-point payload in bytes (4-byte Unicode code point). */
    public static final int LEAF_CODE_POINT_SIZE = 4;

    /**
     * Total fixed header size (bytes): magic + version + codePointCount + bitCount +
     * treeNodeCount + crc32.
     */
    public static final int FIXED_HEADER_SIZE =
            MAGIC_SIZE + VERSION_SIZE + CODE_POINT_COUNT_SIZE + BIT_COUNT_SIZE
                    + TREE_NODE_COUNT_SIZE + CRC32_SIZE;

    // -------------------------------------------------------------------------
    // Header field byte offsets
    // -------------------------------------------------------------------------

    /** Byte offset of the magic field within the archive. */
    public static final int OFFSET_MAGIC           = 0;

    /** Byte offset of the version field within the archive. */
    public static final int OFFSET_VERSION         = MAGIC_SIZE;

    /** Byte offset of the original code-point count field within the archive. */
    public static final int OFFSET_CODE_POINT_COUNT = OFFSET_VERSION + VERSION_SIZE;

    /** Byte offset of the meaningful bit count field within the archive. */
    public static final int OFFSET_BIT_COUNT       = OFFSET_CODE_POINT_COUNT + CODE_POINT_COUNT_SIZE;

    /** Byte offset of the serialized tree node count field within the archive. */
    public static final int OFFSET_TREE_NODE_COUNT = OFFSET_BIT_COUNT + BIT_COUNT_SIZE;

    /** Byte offset of the CRC32 checksum field within the archive. */
    public static final int OFFSET_CRC32           = OFFSET_TREE_NODE_COUNT + TREE_NODE_COUNT_SIZE;

    /** Byte offset where the serialized tree data starts (immediately after the fixed header). */
    public static final int OFFSET_TREE_START      = FIXED_HEADER_SIZE;

    // -------------------------------------------------------------------------
    // Safety limits
    // -------------------------------------------------------------------------

    /**
     * Maximum number of unique leaf nodes (characters) allowed in the tree.
     * Unicode code space has ~1.1M code points, but realistic texts never use
     * more than a few thousand distinct characters. 65 536 covers all BMP code
     * points generously.
     */
    public static final int MAX_TREE_NODES = 131_072;  // 2 * 65 536 (nodes = 2n-1 for n leaves)

    /**
     * Maximum recursion depth when deserializing the tree, to prevent stack overflow
     * from a maliciously deep or corrupted archive.
     */
    public static final int MAX_TREE_DEPTH = 128;

    /**
     * Maximum meaningful bit count accepted during decompression.
     * Prevents decompression of implausibly large archives.
     * 8 GB of bits = 1 GB of payload bytes.
     */
    public static final long MAX_BIT_COUNT = 8L * 1024L * 1024L * 1024L * 8L;

    /**
     * Maximum raw archive file size in bytes accepted during reading.
     * Prevents loading extremely large files into memory.
     * 512 MB is a generous upper bound for a university demo application.
     */
    public static final long MAX_ARCHIVE_BYTES = 512L * 1024L * 1024L;

    /**
     * Maximum original code-point count accepted during decompression.
     * This guards against integer overflow and runaway memory allocation.
     */
    public static final long MAX_CODE_POINT_COUNT = 500_000_000L;
}
