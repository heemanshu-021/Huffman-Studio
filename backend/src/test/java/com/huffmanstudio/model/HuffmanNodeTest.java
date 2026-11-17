package com.huffmanstudio.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("HuffmanNode Unit Tests")
class HuffmanNodeTest {

    @Test
    @DisplayName("Should create leaf node with valid properties")
    void createLeafNode() {
        HuffmanNode leaf = HuffmanNode.createLeaf('A', 5);

        assertThat(leaf.isLeaf()).isTrue();
        assertThat(leaf.getCodePoint()).isEqualTo((int) 'A');
        assertThat(leaf.getFrequency()).isEqualTo(5);
        assertThat(leaf.getLeft()).isNull();
        assertThat(leaf.getRight()).isNull();
        assertThat(leaf.getLowestCodePoint()).isEqualTo((int) 'A');
        assertThat(leaf.getCharacterAsString()).isEqualTo("A");
        assertThat(leaf.getCharacterDisplay()).isEqualTo("A");
    }

    @Test
    @DisplayName("Should create internal node combining two children")
    void createInternalNode() {
        HuffmanNode left = HuffmanNode.createLeaf('B', 3);
        HuffmanNode right = HuffmanNode.createLeaf('A', 2);
        HuffmanNode internal = HuffmanNode.createInternal(left, right);

        assertThat(internal.isLeaf()).isFalse();
        assertThat(internal.getCodePoint()).isNull();
        assertThat(internal.getFrequency()).isEqualTo(5); // 3 + 2
        assertThat(internal.getLeft()).isEqualTo(left);
        assertThat(internal.getRight()).isEqualTo(right);
        assertThat(internal.getLowestCodePoint()).isEqualTo((int) 'A'); // Math.min('B', 'A') = 'A'
        assertThat(internal.getCharacterDisplay()).isEqualTo("[Internal Node]");
    }

    @Test
    @DisplayName("Should format whitespace and escape characters in character display")
    void characterDisplayFormatting() {
        assertThat(HuffmanNode.createLeaf(' ', 1).getCharacterDisplay()).isEqualTo("[Space]");
        assertThat(HuffmanNode.createLeaf('\n', 1).getCharacterDisplay()).isEqualTo("\\n [Newline]");
        assertThat(HuffmanNode.createLeaf('\t', 1).getCharacterDisplay()).isEqualTo("\\t [Tab]");
    }

    @Test
    @DisplayName("Should compare nodes primarily by frequency and break ties with lowestCodePoint")
    void compareToDeterministicOrder() {
        HuffmanNode lowFreq = HuffmanNode.createLeaf('Z', 1);
        HuffmanNode highFreq = HuffmanNode.createLeaf('A', 5);

        // Lower frequency comes first
        assertThat(lowFreq.compareTo(highFreq)).isNegative();
        assertThat(highFreq.compareTo(lowFreq)).isPositive();

        // Equal frequency: tie broken by lowestCodePoint ('A' < 'B')
        HuffmanNode nodeA = HuffmanNode.createLeaf('A', 3);
        HuffmanNode nodeB = HuffmanNode.createLeaf('B', 3);

        assertThat(nodeA.compareTo(nodeB)).isNegative();
        assertThat(nodeB.compareTo(nodeA)).isPositive();
    }

    @Test
    @DisplayName("Should reject invalid leaf parameters")
    void invalidLeafParameters() {
        assertThatThrownBy(() -> HuffmanNode.createLeaf('A', -1))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> HuffmanNode.createLeaf(-1, 1))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
