package com.huffmanstudio.archive;

import java.io.ByteArrayOutputStream;

/**
 * Packs individual bits into a byte array using MSB-first ordering.
 *
 * <h2>Bit Packing Strategy</h2>
 * <p>Bits are accumulated in a single {@code int} buffer. The most-significant bit
 * of each byte is filled first. For example, writing bits [1, 0, 1] into the
 * first byte produces {@code 1010_0000} (0xA0) once that byte is flushed.
 *
 * <h2>Padding</h2>
 * <p>When {@link #toBytes()} is called, the final partially-filled byte is zero-padded
 * on the right so that it forms a complete byte. The number of meaningful bits
 * (available via {@link #getBitCount()}) tells the reader exactly when to stop.
 *
 * <h2>Thread Safety</h2>
 * <p>Not thread-safe. Instances are single-use: construct, write bits, call {@link #toBytes()}.
 */
public class BitWriter {

    /** Accumulates bits for the byte currently being assembled. */
    private int currentByte;

    /** Number of bits already placed into {@code currentByte} (0–7). */
    private int bitsInCurrentByte;

    /** Collects completed bytes. */
    private final ByteArrayOutputStream buffer;

    /** Total number of bits written (before padding). */
    private long bitCount;

    /**
     * Creates a new, empty BitWriter ready to accept bits.
     */
    public BitWriter() {
        this.buffer = new ByteArrayOutputStream();
        this.currentByte = 0;
        this.bitsInCurrentByte = 0;
        this.bitCount = 0L;
    }

    /**
     * Writes a single bit to the bit stream.
     *
     * @param bit the bit to write: must be {@code 0} or {@code 1}
     * @throws IllegalArgumentException if {@code bit} is not 0 or 1
     * @throws IllegalStateException    if {@link #toBytes()} has already been called
     */
    public void writeBit(int bit) {
        if (bit != 0 && bit != 1) {
            throw new IllegalArgumentException("Bit value must be 0 or 1, got: " + bit);
        }

        // Place bit in the MSB-first position within the current byte
        currentByte = (currentByte << 1) | bit;
        bitsInCurrentByte++;
        bitCount++;

        // Once 8 bits have been accumulated, flush the byte
        if (bitsInCurrentByte == 8) {
            buffer.write(currentByte);
            currentByte = 0;
            bitsInCurrentByte = 0;
        }
    }

    /**
     * Writes all bits from a Huffman code string (a string of '0' and '1' characters).
     *
     * @param code a non-null string of '0' and '1' characters
     * @throws IllegalArgumentException if {@code code} contains characters other than '0' or '1'
     */
    public void writeCode(String code) {
        if (code == null) {
            return;
        }
        for (int i = 0; i < code.length(); i++) {
            char ch = code.charAt(i);
            if (ch == '0') {
                writeBit(0);
            } else if (ch == '1') {
                writeBit(1);
            } else {
                throw new IllegalArgumentException(
                        "Invalid character '" + ch + "' at index " + i + " in Huffman code string");
            }
        }
    }

    /**
     * Finalizes the bit stream and returns the packed byte array.
     *
     * <p>If the total bit count is not a multiple of 8, the last byte is zero-padded
     * on the right (LSB side) so it becomes a full byte.
     *
     * @return the complete packed byte array; empty array if no bits were written
     */
    public byte[] toBytes() {
        if (bitsInCurrentByte > 0) {
            // Shift remaining bits to MSB and flush with zero padding
            int paddedByte = currentByte << (8 - bitsInCurrentByte);
            buffer.write(paddedByte);
        }
        return buffer.toByteArray();
    }

    /**
     * Returns the total number of meaningful bits written (excluding padding).
     *
     * @return exact bit count
     */
    public long getBitCount() {
        return bitCount;
    }

    /**
     * Convenience: returns the number of bytes that {@link #toBytes()} will produce.
     * This is {@code ceil(bitCount / 8)}.
     *
     * @return byte count
     */
    public long getByteCount() {
        return (bitCount + 7L) / 8L;
    }
}
