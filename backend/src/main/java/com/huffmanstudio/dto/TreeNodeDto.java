package com.huffmanstudio.dto;

/**
 * Hierarchical tree node DTO for frontend Huffman tree visualization.
 *
 * @param id               unique identifier for node (used by SVG keys)
 * @param frequency        occurrence frequency of symbol or combined subtree frequency
 * @param codePoint        Unicode code point if leaf, null if internal node
 * @param character        string character representation if leaf, empty if internal
 * @param displayCharacter human-readable label (e.g. "[Space]", "\n", "A")
 * @param isLeaf           true if leaf node, false if internal branch
 * @param code             prefix-free binary code path from root (e.g. "010")
 * @param left             left child node (branch '0')
 * @param right            right child node (branch '1')
 */
public record TreeNodeDto(
        String id,
        int frequency,
        Integer codePoint,
        String character,
        String displayCharacter,
        boolean isLeaf,
        String code,
        TreeNodeDto left,
        TreeNodeDto right
) {
}
