package com.huffmanstudio.algorithm;

import com.huffmanstudio.model.HuffmanNode;

import java.util.Map;
import java.util.PriorityQueue;

/**
 * Constructs an optimal binary prefix tree from character occurrence frequencies.
 *
 * <p>Uses the classic greedy algorithm developed by David Huffman (1952):
 * <ol>
 *   <li>Create a leaf {@link HuffmanNode} for each unique character with its frequency.</li>
 *   <li>Insert all leaf nodes into a min-heap {@link PriorityQueue}.</li>
 *   <li>Repeatedly extract the two nodes with the lowest frequencies.</li>
 *   <li>Merge them into a new internal parent node whose frequency is the sum of their frequencies.</li>
 *   <li>Re-insert the parent node into the priority queue.</li>
 *   <li>Repeat until only one root node remains.</li>
 * </ol>
 *
 * <p><b>Deterministic Invariant:</b> Tie-breaking between nodes with identical frequencies
 * is resolved using {@link HuffmanNode#getLowestCodePoint()}, ensuring that identical input
 * always produces an identical tree topology.
 */
public final class HuffmanTreeBuilder {

    private HuffmanTreeBuilder() {
        // Static utility class
    }

    /**
     * Builds a Huffman tree from a map of Unicode code points and frequencies.
     *
     * @param frequencyMap map containing code points and their occurrence counts
     * @return root node of the Huffman tree, or null if frequencyMap is null or empty
     */
    public static HuffmanNode buildTree(Map<Integer, Integer> frequencyMap) {
        if (frequencyMap == null || frequencyMap.isEmpty()) {
            return null;
        }

        // Handle single unique character
        if (frequencyMap.size() == 1) {
            Map.Entry<Integer, Integer> entry = frequencyMap.entrySet().iterator().next();
            return HuffmanNode.createLeaf(entry.getKey(), entry.getValue());
        }

        // Min-heap priority queue; uses natural Comparable ordering of HuffmanNode
        PriorityQueue<HuffmanNode> queue = new PriorityQueue<>(frequencyMap.size());

        for (Map.Entry<Integer, Integer> entry : frequencyMap.entrySet()) {
            queue.add(HuffmanNode.createLeaf(entry.getKey(), entry.getValue()));
        }

        // Greedy iterative merge
        while (queue.size() > 1) {
            HuffmanNode leftChild = queue.poll();
            HuffmanNode rightChild = queue.poll();

            // Create internal node with leftChild and rightChild
            HuffmanNode parent = HuffmanNode.createInternal(leftChild, rightChild);
            queue.add(parent);
        }

        // The remaining node is the root of the tree
        return queue.poll();
    }

    /**
     * Convenience method to build a Huffman tree directly from input text.
     *
     * @param text input text string
     * @return root node of the constructed Huffman tree, or null if text is null/empty
     */
    public static HuffmanNode buildTree(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }
        Map<Integer, Integer> frequencies = FrequencyCounter.countFrequencies(text);
        return buildTree(frequencies);
    }
}
