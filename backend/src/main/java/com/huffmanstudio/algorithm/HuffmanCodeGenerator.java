package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * Generates variable-length, prefix-free binary codes by traversing a binary Huffman tree.
 *
 * <p>Algorithmic Rules:
 * <ul>
 *   <li>Traverse recursively from root to leaf.</li>
 *   <li>Assign binary bit {@code '0'} to every left edge traversal.</li>
 *   <li>Assign binary bit {@code '1'} to every right edge traversal.</li>
 *   <li>When a leaf is reached, register the accumulated bit sequence as that character's prefix code.</li>
 *   <li><b>Single unique character case:</b> Assigns code {@code "0"} rather than an empty string.</li>
 * </ul>
 */
public final class HuffmanCodeGenerator {

    private HuffmanCodeGenerator() {
        // Static utility class
    }

    /**
     * Traverses the given Huffman tree and generates a mapping from Unicode code points
     * to their respective binary Huffman prefix codes.
     *
     * @param root the root node of the Huffman tree (may be null)
     * @return an unmodifiable map where key is Unicode code point (Integer) and value is binary string (e.g. "010")
     */
    public static Map<Integer, String> generateCodes(HuffmanNode root) {
        if (root == null) {
            return Collections.emptyMap();
        }

        // Handle single unique character tree
        if (root.isLeaf()) {
            Map<Integer, String> singleCodeTable = new LinkedHashMap<>();
            singleCodeTable.put(root.getCodePoint(), "0");
            return Collections.unmodifiableMap(singleCodeTable);
        }

        // Use TreeMap so codes are naturally sorted by Unicode code point for clean inspection
        Map<Integer, String> codeTable = new TreeMap<>();
        StringBuilder pathBuilder = new StringBuilder();

        traverseAndAssignCodes(root, pathBuilder, codeTable);

        return Collections.unmodifiableMap(codeTable);
    }

    /**
     * Recursive depth-first traversal to accumulate bit paths and assign codes at leaves.
     *
     * @param node        current tree node being visited
     * @param pathBuilder accumulated path of '0' and '1' characters
     * @param codeTable   map accumulating code assignments
     */
    private static void traverseAndAssignCodes(
            HuffmanNode node,
            StringBuilder pathBuilder,
            Map<Integer, String> codeTable
    ) {
        if (node == null) {
            return;
        }

        // When a leaf is reached, record the accumulated bit path
        if (node.isLeaf()) {
            codeTable.put(node.getCodePoint(), pathBuilder.toString());
            return;
        }

        // Traverse left branch: append '0'
        if (node.getLeft() != null) {
            pathBuilder.append('0');
            traverseAndAssignCodes(node.getLeft(), pathBuilder, codeTable);
            pathBuilder.deleteCharAt(pathBuilder.length() - 1); // Backtrack
        }

        // Traverse right branch: append '1'
        if (node.getRight() != null) {
            pathBuilder.append('1');
            traverseAndAssignCodes(node.getRight(), pathBuilder, codeTable);
            pathBuilder.deleteCharAt(pathBuilder.length() - 1); // Backtrack
        }
    }

    /**
     * Converts a code point table into a human-readable map with string character keys.
     *
     * @param codeTable code table with Integer code point keys
     * @return map with human-readable String character representations
     */
    public static Map<String, String> formatCodeTableForDisplay(Map<Integer, String> codeTable) {
        if (codeTable == null || codeTable.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, String> displayMap = new LinkedHashMap<>();
        for (Map.Entry<Integer, String> entry : codeTable.entrySet()) {
            String charDisplay = Character.toString(entry.getKey());
            displayMap.put(charDisplay, entry.getValue());
        }
        return Collections.unmodifiableMap(displayMap);
    }
}
