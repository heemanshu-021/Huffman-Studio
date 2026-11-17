package com.huffmanstudio.archive;

/**
 * Reads individual bits from a packed byte array using MSB-first ordering.
 *
 * <h2>Bit Ordering</h2>
 * <p>Uses the same MSB-first ordering as {@link BitWriter}. Bit 7 of each byte is
 * returned first, then bit 6, ..., then bit 0.
 *
 * <h2>Meaningful Bit Count</h2>
 * <p>The constructor requires the exact number of meaningful bits in the byte array.
 * {@link #readBit()} respects this boundary and will throw
 * {@link java.util.NoSuchElementException} when all meaningful bits have been read,
 * preventing accidental consumption of zero-padding from the last byte.
 *
 * <h2>Thread Safety</h2>
 * <p>Not thread-safe. Use one instance per decoding operation.
 */
public class BitReader {

    /** The underlying byte data containing the packed bits. */
    private final byte[] data;

    /** Number of meaningful bits to expose (excludes padding in the last byte). */
    private final long meaningfulBitCount;

    /** Index of the current byte being read (0-based). */
    private int byteIndex;

    /** Bit mask for the next bit to read within {@code data[byteIndex]} (starts at 0x80 = MSB). */
    private int bitMask;

    /** Number of meaningful bits that have been read so far. */
    private long bitsRead;

    /**
     * Creates a new BitReader over the provided byte array.
     *
     * @param data              the packed byte array to read from; must not be null
     * @param meaningfulBitCount the number of actual data bits in the array (must be ≥ 0 and
     *                           must not exceed {@code data.length * 8})
     * @throws IllegalArgumentException if {@code meaningfulBitCount} is negative or greater than
     *                                  the number of bits available in {@code data}
     * @throws NullPointerException     if {@code data} is null
     */
    public BitReader(byte[] data, long meaningfulBitCount) {
        if (data == null) {
            throw new NullPointerException("data byte array cannot be null");
        }
        if (meaningfulBitCount < 0) {
            throw new IllegalArgumentException(
                    "meaningfulBitCount cannot be negative: " + meaningfulBitCount);
        }
        long maxBits = (long) data.length * 8L;
        if (meaningfulBitCount > maxBits) {
            throw new IllegalArgumentException(
                    "meaningfulBitCount " + meaningfulBitCount
                    + " exceeds available bits " + maxBits + " in a " + data.length + "-byte array");
        }

        this.data = data;
        this.meaningfulBitCount = meaningfulBitCount;
        this.byteIndex = 0;
        this.bitMask = 0x80; // MSB first
        this.bitsRead = 0L;
    }

    /**
     * Reads and returns the next meaningful bit from the stream.
     *
     * @return {@code 0} or {@code 1}
     * @throws java.util.NoSuchElementException if all meaningful bits have already been read
     */
    public int readBit() {
        if (!hasNextBit()) {
            throw new java.util.NoSuchElementException(
                    "All " + meaningfulBitCount + " meaningful bits have been consumed. No more bits to read.");
        }

        // Extract the bit at the current position (MSB-first)
        int bit = ((data[byteIndex] & bitMask) != 0) ? 1 : 0;

        // Advance to the next bit position
        bitMask >>= 1;
        bitsRead++;

        // When all bits in the current byte have been read, move to the next byte
        if (bitMask == 0) {
            byteIndex++;
            bitMask = 0x80;
        }

        return bit;
    }

    /**
     * Returns {@code true} if there are still meaningful bits left to read.
     *
     * @return true when at least one meaningful bit remains
     */
    public boolean hasNextBit() {
        return bitsRead < meaningfulBitCount;
    }

    /**
     * Returns the total number of meaningful bits this reader was initialized with.
     *
     * @return the declared meaningful bit count
     */
    public long getMeaningfulBitCount() {
        return meaningfulBitCount;
    }

    /**
     * Returns the number of meaningful bits that have been read so far.
     *
     * @return bits consumed count
     */
    public long getBitsRead() {
        return bitsRead;
    }

    /**
     * Returns the number of meaningful bits that have not yet been read.
     *
     * @return remaining bit count
     */
    public long getRemainingBits() {
        return meaningfulBitCount - bitsRead;
    }

    /**
     * Reconstructs the bit stream as a string of '0' and '1' characters,
     * reading all remaining meaningful bits.
     *
     * <p>This is a convenience method used during decompression when {@link com.huffmanstudio.algorithm.HuffmanDecoder}
     * expects a {@code String} bit stream.
     *
     * @return a string of '0' and '1' characters containing all remaining bits
     */
    public String readAllBitsAsString() {
        long remaining = getRemainingBits();
        if (remaining == 0) {
            return "";
        }
        StringBuilder sb = new StringBuilder((int) Math.min(remaining, Integer.MAX_VALUE));
        while (hasNextBit()) {
            sb.append(readBit() == 1 ? '1' : '0');
        }
        return sb.toString();
    }
}
