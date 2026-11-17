package com.huffmanstudio.archive;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link BitWriter} and {@link BitReader}.
 *
 * Tests cover: zero bits, one bit, 8 bits, more than 8 bits, partial last byte,
 * padding zeros, symmetry, boundary cases, and reading beyond the meaningful bit count.
 */
@DisplayName("BitWriter and BitReader")
class BitWriterReaderTest {

    // =========================================================================
    // BitWriter tests
    // =========================================================================

    @Test
    @DisplayName("Writing zero bits produces an empty byte array")
    void writingZeroBitsProducesEmptyArray() {
        BitWriter writer = new BitWriter();
        byte[] bytes = writer.toBytes();
        assertEquals(0, bytes.length, "No bytes written when no bits written");
        assertEquals(0L, writer.getBitCount());
        assertEquals(0L, writer.getByteCount());
    }

    @Test
    @DisplayName("Writing a single '1' bit produces one byte with MSB set and 7 zero padding bits")
    void writingSingleOneBit() {
        BitWriter writer = new BitWriter();
        writer.writeBit(1);
        byte[] bytes = writer.toBytes();

        assertEquals(1, bytes.length);
        assertEquals(1L, writer.getBitCount());
        assertEquals(1L, writer.getByteCount());
        // MSB-first: bit '1' goes into position 7 → byte = 1000_0000 = 0x80
        assertEquals((byte) 0x80, bytes[0]);
    }

    @Test
    @DisplayName("Writing a single '0' bit produces one byte of all zeros")
    void writingSingleZeroBit() {
        BitWriter writer = new BitWriter();
        writer.writeBit(0);
        byte[] bytes = writer.toBytes();

        assertEquals(1, bytes.length);
        // 0 bit in MSB position → 0000_0000
        assertEquals((byte) 0x00, bytes[0]);
    }

    @Test
    @DisplayName("Writing exactly 8 bits produces exactly one byte with no padding")
    void writingEightBitsProducesOneByte() {
        BitWriter writer = new BitWriter();
        // 1010_0101 = 0xA5
        int[] bits = { 1, 0, 1, 0, 0, 1, 0, 1 };
        for (int b : bits) writer.writeBit(b);

        byte[] bytes = writer.toBytes();
        assertEquals(1, bytes.length);
        assertEquals(8L, writer.getBitCount());
        assertEquals(1L, writer.getByteCount());
        assertEquals((byte) 0xA5, bytes[0]);
    }

    @Test
    @DisplayName("Writing 9 bits produces two bytes; second byte has 7 zero padding bits")
    void writingNineBitsProducesTwoBytes() {
        BitWriter writer = new BitWriter();
        // First byte: 1111_1111 = 0xFF
        for (int i = 0; i < 8; i++) writer.writeBit(1);
        // Bit 9: '1' → goes to MSB of second byte → 1000_0000 = 0x80
        writer.writeBit(1);

        byte[] bytes = writer.toBytes();
        assertEquals(2, bytes.length);
        assertEquals(9L, writer.getBitCount());
        assertEquals(2L, writer.getByteCount());
        assertEquals((byte) 0xFF, bytes[0]);
        assertEquals((byte) 0x80, bytes[1]);
    }

    @Test
    @DisplayName("Padding bits in the last byte are zero when bit count is not a multiple of 8")
    void paddingBitsAreZero() {
        BitWriter writer = new BitWriter();
        // Write 3 bits: 1, 0, 1
        writer.writeBit(1);
        writer.writeBit(0);
        writer.writeBit(1);

        byte[] bytes = writer.toBytes();
        assertEquals(1, bytes.length);
        // 1010_0000 = 0xA0 (last 5 bits are zero padding)
        assertEquals((byte) 0xA0, bytes[0]);
        // Mask lower 5 bits to verify padding is zero
        assertEquals(0, bytes[0] & 0x1F, "Padding bits must be zero");
    }

    @Test
    @DisplayName("writeBit rejects values other than 0 or 1")
    void writeBitRejectsInvalidValues() {
        BitWriter writer = new BitWriter();
        assertThrows(IllegalArgumentException.class, () -> writer.writeBit(2));
        assertThrows(IllegalArgumentException.class, () -> writer.writeBit(-1));
    }

    @Test
    @DisplayName("writeCode correctly encodes a string of '0' and '1' characters")
    void writeCodeEncodesCodeString() {
        BitWriter writer = new BitWriter();
        // 0xCA = 1100_1010
        writer.writeCode("11001010");
        byte[] bytes = writer.toBytes();
        assertEquals(1, bytes.length);
        assertEquals((byte) 0xCA, bytes[0]);
        assertEquals(8L, writer.getBitCount());
    }

    @Test
    @DisplayName("writeCode rejects strings with characters other than '0' or '1'")
    void writeCodeRejectsInvalidCharacters() {
        BitWriter writer = new BitWriter();
        assertThrows(IllegalArgumentException.class, () -> writer.writeCode("102"));
    }

    @Test
    @DisplayName("writeCode with null string is a no-op")
    void writeCodeWithNullIsNoOp() {
        BitWriter writer = new BitWriter();
        writer.writeCode(null);
        assertEquals(0L, writer.getBitCount());
        assertEquals(0, writer.toBytes().length);
    }

    // =========================================================================
    // BitReader tests
    // =========================================================================

    @Test
    @DisplayName("Reading from an empty byte array with 0 meaningful bits returns no bits")
    void readingFromEmptyArrayWithZeroBits() {
        BitReader reader = new BitReader(new byte[0], 0);
        assertFalse(reader.hasNextBit());
        assertEquals(0L, reader.getRemainingBits());
    }

    @Test
    @DisplayName("readBit throws NoSuchElementException after all meaningful bits are consumed")
    void readBeyondMeaningfulBitsThrows() {
        BitReader reader = new BitReader(new byte[] { (byte) 0xFF }, 1);
        assertEquals(1, reader.readBit()); // reads one bit
        assertFalse(reader.hasNextBit());
        assertThrows(NoSuchElementException.class, reader::readBit);
    }

    @Test
    @DisplayName("Reading 8 bits from 0xFF returns eight 1s")
    void readingEightBitsFromAllOnes() {
        BitReader reader = new BitReader(new byte[] { (byte) 0xFF }, 8);
        for (int i = 0; i < 8; i++) {
            assertEquals(1, reader.readBit(), "Bit " + i + " should be 1");
        }
        assertFalse(reader.hasNextBit());
    }

    @Test
    @DisplayName("Reading 8 bits from 0x00 returns eight 0s")
    void readingEightBitsFromAllZeros() {
        BitReader reader = new BitReader(new byte[] { 0x00 }, 8);
        for (int i = 0; i < 8; i++) {
            assertEquals(0, reader.readBit(), "Bit " + i + " should be 0");
        }
    }

    @Test
    @DisplayName("Reading only 3 meaningful bits from a byte stops after 3 bits")
    void readingThreeMeaningfulBitsStopsEarly() {
        // 0xE0 = 1110_0000 — 3 meaningful bits: 1, 1, 1
        BitReader reader = new BitReader(new byte[] { (byte) 0xE0 }, 3);
        assertEquals(1, reader.readBit());
        assertEquals(1, reader.readBit());
        assertEquals(1, reader.readBit());
        assertFalse(reader.hasNextBit());
        assertThrows(NoSuchElementException.class, reader::readBit);
    }

    @Test
    @DisplayName("BitReader constructor rejects meaningfulBitCount greater than available bits")
    void constructorRejectsTooHighMeaningfulBitCount() {
        assertThrows(IllegalArgumentException.class,
                () -> new BitReader(new byte[] { 0x00 }, 9));
    }

    @Test
    @DisplayName("BitReader constructor rejects negative meaningfulBitCount")
    void constructorRejectsNegativeMeaningfulBitCount() {
        assertThrows(IllegalArgumentException.class,
                () -> new BitReader(new byte[] { 0x00 }, -1));
    }

    @Test
    @DisplayName("BitReader constructor rejects null data")
    void constructorRejectsNullData() {
        assertThrows(NullPointerException.class,
                () -> new BitReader(null, 0));
    }

    // =========================================================================
    // Symmetry tests (write then read)
    // =========================================================================

    @Test
    @DisplayName("Writing and reading back 16 bits produces the same bit sequence")
    void symmetryFor16Bits() {
        int[] inputBits = { 1,0,1,1,0,0,0,1, 0,1,1,0,1,1,1,0 };
        BitWriter writer = new BitWriter();
        for (int b : inputBits) writer.writeBit(b);
        byte[] bytes = writer.toBytes();

        BitReader reader = new BitReader(bytes, writer.getBitCount());
        for (int i = 0; i < inputBits.length; i++) {
            assertEquals(inputBits[i], reader.readBit(),
                    "Bit at index " + i + " should match");
        }
        assertFalse(reader.hasNextBit());
    }

    @Test
    @DisplayName("readAllBitsAsString reconstructs the original code string exactly")
    void readAllBitsAsStringMatchesOriginal() {
        String original = "10110010111001";
        BitWriter writer = new BitWriter();
        writer.writeCode(original);
        byte[] bytes = writer.toBytes();

        BitReader reader = new BitReader(bytes, writer.getBitCount());
        String reconstructed = reader.readAllBitsAsString();
        assertEquals(original, reconstructed);
    }

    @Test
    @DisplayName("Single bit '0' symmetry: write and read back")
    void singleZeroBitSymmetry() {
        BitWriter writer = new BitWriter();
        writer.writeBit(0);
        byte[] bytes = writer.toBytes();

        BitReader reader = new BitReader(bytes, writer.getBitCount());
        assertEquals(0, reader.readBit());
        assertFalse(reader.hasNextBit());
    }
}
