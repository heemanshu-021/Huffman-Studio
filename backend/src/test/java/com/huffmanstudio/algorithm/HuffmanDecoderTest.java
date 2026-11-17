package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("HuffmanDecoder Unit Tests")
class HuffmanDecoderTest {

    @Test
    @DisplayName("Should return empty string for null or empty bit string")
    void decodeEmpty() {
        HuffmanNode dummyNode = HuffmanNode.createLeaf('A', 1);
        assertThat(HuffmanDecoder.decode(null, dummyNode)).isEmpty();
        assertThat(HuffmanDecoder.decode("", dummyNode)).isEmpty();
    }

    @Test
    @DisplayName("Should reject decoding non-empty bits with null root")
    void decodeNullRoot() {
        assertThatThrownBy(() -> HuffmanDecoder.decode("0101", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot decode non-empty bit string with a null Huffman tree");
    }

    @Test
    @DisplayName("Should decode single character tree")
    void decodeSingleCharacter() {
        HuffmanNode root = HuffmanNode.createLeaf('A', 5);
        String decoded = HuffmanDecoder.decode("00000", root);

        assertThat(decoded).isEqualTo("AAAAA");
    }

    @Test
    @DisplayName("Should reject invalid bit in single character tree")
    void decodeSingleCharacterInvalidBit() {
        HuffmanNode root = HuffmanNode.createLeaf('A', 5);

        assertThatThrownBy(() -> HuffmanDecoder.decode("0010", root))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid bit '1'");
    }

    @Test
    @DisplayName("Should decode ASCII string correctly")
    void decodeAscii() {
        String original = "hello world";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(original);
        Map<Integer, String> codeTable = HuffmanCodeGenerator.generateCodes(root);
        String encoded = HuffmanEncoder.encode(original, codeTable);

        String decoded = HuffmanDecoder.decode(encoded, root);
        assertThat(decoded).isEqualTo(original);
    }

    @Test
    @DisplayName("Should reject invalid characters in bit string")
    void decodeInvalidCharacters() {
        HuffmanNode root = HuffmanTreeBuilder.buildTree("ABC");

        assertThatThrownBy(() -> HuffmanDecoder.decode("01021", root))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid bit character '2'");

        assertThatThrownBy(() -> HuffmanDecoder.decode("01 01", root))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid bit character ' '");
    }

    @Test
    @DisplayName("Should reject bit streams terminating mid-tree prematurely")
    void decodePrematureTermination() {
        String original = "ABCDEF";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(original);
        Map<Integer, String> codeTable = HuffmanCodeGenerator.generateCodes(root);
        String encoded = HuffmanEncoder.encode(original, codeTable);

        // Strip off the last bit so it terminates mid-tree
        String incomplete = encoded.substring(0, encoded.length() - 1);

        assertThatThrownBy(() -> HuffmanDecoder.decode(incomplete, root))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Encoded bit stream ended prematurely mid-tree");
    }

    @Test
    @DisplayName("Should decode multi-byte Unicode and emoji characters with full fidelity")
    void decodeUnicodeAndEmoji() {
        String original = "Greetings 🌍! नमस्ते 你好 ✨";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(original);
        Map<Integer, String> codeTable = HuffmanCodeGenerator.generateCodes(root);
        String encoded = HuffmanEncoder.encode(original, codeTable);

        String decoded = HuffmanDecoder.decode(encoded, root);
        assertThat(decoded).isEqualTo(original);
    }
}
