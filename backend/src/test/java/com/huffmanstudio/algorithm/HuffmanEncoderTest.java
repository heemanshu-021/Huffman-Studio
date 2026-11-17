package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("HuffmanEncoder Unit Tests")
class HuffmanEncoderTest {

    @Test
    @DisplayName("Should return empty bit string for null or empty text")
    void encodeEmptyText() {
        Map<Integer, String> table = Map.of((int) 'A', "0");
        assertThat(HuffmanEncoder.encode(null, table)).isEmpty();
        assertThat(HuffmanEncoder.encode("", table)).isEmpty();
    }

    @Test
    @DisplayName("Should reject encoding with null or empty code table")
    void encodeWithEmptyCodeTable() {
        assertThatThrownBy(() -> HuffmanEncoder.encode("hello", null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> HuffmanEncoder.encode("hello", Map.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Should encode single character repeated string")
    void encodeSingleCharacter() {
        String text = "AAAA";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(text);
        Map<Integer, String> codeTable = HuffmanCodeGenerator.generateCodes(root);

        String encoded = HuffmanEncoder.encode(text, codeTable);
        assertThat(encoded).isEqualTo("0000");
    }

    @Test
    @DisplayName("Should encode two characters correctly")
    void encodeTwoCharacters() {
        String text = "AB";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(text);
        Map<Integer, String> codeTable = HuffmanCodeGenerator.generateCodes(root);

        String encoded = HuffmanEncoder.encode(text, codeTable);
        // 'A' is "0", 'B' is "1"
        assertThat(encoded).isEqualTo("01");
    }

    @Test
    @DisplayName("Should throw exception when character is missing from code table")
    void encodeMissingCharacter() {
        Map<Integer, String> incompleteTable = Map.of((int) 'A', "0");

        assertThatThrownBy(() -> HuffmanEncoder.encode("AB", incompleteTable))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Character 'B'")
                .hasMessageContaining("not found in Huffman code table");
    }

    @Test
    @DisplayName("Should encode multi-byte Unicode and emoji characters")
    void encodeUnicodeAndEmoji() {
        String text = "Hi 🌍";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(text);
        Map<Integer, String> codeTable = HuffmanCodeGenerator.generateCodes(root);

        String encoded = HuffmanEncoder.encode(text, codeTable);
        assertThat(encoded).matches("^[01]+$");
    }
}
