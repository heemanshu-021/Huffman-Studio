package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("HuffmanCodeGenerator Unit Tests")
class HuffmanCodeGeneratorTest {

    @Test
    @DisplayName("Should return empty map for null root")
    void generateCodesNullRoot() {
        assertThat(HuffmanCodeGenerator.generateCodes(null)).isEmpty();
    }

    @Test
    @DisplayName("Should assign code '0' for single unique character tree")
    void generateCodesSingleCharacter() {
        HuffmanNode singleLeaf = HuffmanNode.createLeaf('A', 5);
        Map<Integer, String> codes = HuffmanCodeGenerator.generateCodes(singleLeaf);

        assertThat(codes)
                .hasSize(1)
                .containsEntry((int) 'A', "0");
    }

    @Test
    @DisplayName("Should generate prefix-free codes for multiple characters")
    void generateCodesPrefixFreeProperty() {
        String text = "abracadabra";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(text);
        Map<Integer, String> codes = HuffmanCodeGenerator.generateCodes(root);

        // Every character must have a unique non-empty binary code
        assertThat(codes).isNotEmpty();

        // Check Prefix-Free Property: No code is a prefix of any other code
        for (Map.Entry<Integer, String> entry1 : codes.entrySet()) {
            for (Map.Entry<Integer, String> entry2 : codes.entrySet()) {
                if (!entry1.getKey().equals(entry2.getKey())) {
                    String code1 = entry1.getValue();
                    String code2 = entry2.getValue();

                    assertThat(code1.startsWith(code2))
                            .as("Code '%s' should not be a prefix of code '%s'", code2, code1)
                            .isFalse();
                }
            }
        }
    }

    @Test
    @DisplayName("Higher frequency characters should receive shorter or equal length codes")
    void higherFrequencyShorterCodes() {
        // 'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1
        String text = "abracadabra";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(text);
        Map<Integer, String> codes = HuffmanCodeGenerator.generateCodes(root);

        String codeA = codes.get((int) 'a');
        String codeD = codes.get((int) 'd');

        assertThat(codeA.length()).isLessThanOrEqualTo(codeD.length());
    }

    @Test
    @DisplayName("Should format code table for display")
    void formatCodeTable() {
        HuffmanNode root = HuffmanTreeBuilder.buildTree("AB");
        Map<Integer, String> codes = HuffmanCodeGenerator.generateCodes(root);
        Map<String, String> display = HuffmanCodeGenerator.formatCodeTableForDisplay(codes);

        assertThat(display).containsKeys("A", "B");
    }
}
