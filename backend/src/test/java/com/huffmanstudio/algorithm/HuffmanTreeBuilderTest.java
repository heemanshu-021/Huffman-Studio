package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("HuffmanTreeBuilder Unit Tests")
class HuffmanTreeBuilderTest {

    @Test
    @DisplayName("Should return null for null or empty input")
    void buildTreeEmpty() {
        assertThat(HuffmanTreeBuilder.buildTree((Map<Integer, Integer>) null)).isNull();
        assertThat(HuffmanTreeBuilder.buildTree(new HashMap<>())).isNull();
        assertThat(HuffmanTreeBuilder.buildTree("")).isNull();
        assertThat(HuffmanTreeBuilder.buildTree((String) null)).isNull();
    }

    @Test
    @DisplayName("Should construct single-leaf tree for single unique character")
    void buildTreeSingleCharacter() {
        HuffmanNode root = HuffmanTreeBuilder.buildTree("AAAAAA");

        assertThat(root).isNotNull();
        assertThat(root.isLeaf()).isTrue();
        assertThat(root.getCodePoint()).isEqualTo((int) 'A');
        assertThat(root.getFrequency()).isEqualTo(6);
        assertThat(root.getLeft()).isNull();
        assertThat(root.getRight()).isNull();
    }

    @Test
    @DisplayName("Should construct tree for two distinct characters")
    void buildTreeTwoCharacters() {
        HuffmanNode root = HuffmanTreeBuilder.buildTree("AB");

        assertThat(root).isNotNull();
        assertThat(root.isLeaf()).isFalse();
        assertThat(root.getFrequency()).isEqualTo(2);

        // 'A' (codePoint 65) vs 'B' (codePoint 66)
        // With equal frequencies of 1, 'A' has lower code point so it is left child
        assertThat(root.getLeft().isLeaf()).isTrue();
        assertThat(root.getLeft().getCodePoint()).isEqualTo((int) 'A');

        assertThat(root.getRight().isLeaf()).isTrue();
        assertThat(root.getRight().getCodePoint()).isEqualTo((int) 'B');
    }

    @Test
    @DisplayName("Root frequency must equal total character count")
    void rootFrequencyMatchesTotalChars() {
        String text = "the quick brown fox jumps over the lazy dog";
        HuffmanNode root = HuffmanTreeBuilder.buildTree(text);

        assertThat(root).isNotNull();
        assertThat(root.getFrequency()).isEqualTo(text.length());
    }

    @Test
    @DisplayName("Tree construction must be strictly deterministic across repeated runs")
    void treeConstructionIsDeterministic() {
        String text = "deterministic tree construction test with various character frequencies 12345!@#";

        HuffmanNode firstRun = HuffmanTreeBuilder.buildTree(text);

        for (int i = 0; i < 50; i++) {
            HuffmanNode subsequentRun = HuffmanTreeBuilder.buildTree(text);
            assertThat(subsequentRun).isEqualTo(firstRun);
        }
    }
}
