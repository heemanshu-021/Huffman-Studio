package com.huffmanstudio.model;

import java.util.Objects;

/**
 * Represents a node within a binary Huffman tree.
 *
 * <p>A {@code HuffmanNode} can be either:
 * <ul>
 *   <li>A <b>leaf node</b>: contains a specific Unicode code point and its occurrence frequency.</li>
 *   <li>An <b>internal node</b>: has no code point ({@code null}), references left and right children,
 *       and holds a frequency equal to the sum of its children's frequencies.</li>
 * </ul>
 *
 * <p>To guarantee that Huffman tree construction is 100% deterministic, this class implements
 * {@link Comparable}. Nodes are ordered primarily by frequency (ascending). When frequencies
 * are identical, ties are broken using {@code lowestCodePoint}, which tracks the minimum Unicode
 * code point present in the node's subtree.
 */
public class HuffmanNode implements Comparable<HuffmanNode> {

    private final Integer codePoint;
    private final int frequency;
    private final HuffmanNode left;
    private final HuffmanNode right;
    private final int lowestCodePoint;

    /**
     * Private constructor initializing all fields.
     * Use {@link #createLeaf(int, int)} or {@link #createInternal(HuffmanNode, HuffmanNode)}.
     */
    private HuffmanNode(Integer codePoint, int frequency, HuffmanNode left, HuffmanNode right, int lowestCodePoint) {
        this.codePoint = codePoint;
        this.frequency = frequency;
        this.left = left;
        this.right = right;
        this.lowestCodePoint = lowestCodePoint;
    }

    /**
     * Creates a leaf node containing a character and its occurrence frequency.
     *
     * @param codePoint the Unicode code point of the character
     * @param frequency the number of occurrences of this character
     * @return a new leaf HuffmanNode
     * @throws IllegalArgumentException if frequency is negative or codePoint is invalid
     */
    public static HuffmanNode createLeaf(int codePoint, int frequency) {
        if (frequency < 0) {
            throw new IllegalArgumentException("Frequency cannot be negative: " + frequency);
        }
        if (!Character.isValidCodePoint(codePoint)) {
            throw new IllegalArgumentException("Invalid Unicode code point: " + codePoint);
        }
        return new HuffmanNode(codePoint, frequency, null, null, codePoint);
    }

    /**
     * Creates an internal node combining two child nodes.
     * The internal node's frequency is the sum of its children's frequencies.
     *
     * @param left  the left child node
     * @param right the right child node
     * @return a new internal HuffmanNode
     * @throws NullPointerException if left or right child is null
     */
    public static HuffmanNode createInternal(HuffmanNode left, HuffmanNode right) {
        Objects.requireNonNull(left, "Left child node cannot be null");
        Objects.requireNonNull(right, "Right child node cannot be null");

        int combinedFrequency = left.frequency + right.frequency;
        int minCodePoint = Math.min(left.lowestCodePoint, right.lowestCodePoint);

        return new HuffmanNode(null, combinedFrequency, left, right, minCodePoint);
    }

    /**
     * Checks whether this node is a leaf node.
     *
     * @return true if this node has no children and has a valid code point
     */
    public boolean isLeaf() {
        return left == null && right == null && codePoint != null;
    }

    /**
     * Gets the Unicode code point stored in this node.
     *
     * @return the code point integer, or null if this is an internal node
     */
    public Integer getCodePoint() {
        return codePoint;
    }

    /**
     * Gets the character representation of this node's code point.
     *
     * @return string containing the Unicode character, or empty string if internal node
     */
    public String getCharacterAsString() {
        if (codePoint == null) {
            return "";
        }
        return Character.toString(codePoint);
    }

    /**
     * Gets a human-readable display string for this node's character,
     * escaping control and whitespace characters for clear logging and visualization.
     *
     * @return formatted character representation
     */
    public String getCharacterDisplay() {
        if (codePoint == null) {
            return "[Internal Node]";
        }
        int cp = codePoint.intValue();
        return switch (cp) {
            case ' ' -> "[Space]";
            case '\n' -> "\\n [Newline]";
            case '\r' -> "\\r [Carriage Return]";
            case '\t' -> "\\t [Tab]";
            default -> Character.toString(cp);
        };
    }

    /**
     * Gets the frequency of this node.
     *
     * @return occurrence count
     */
    public int getFrequency() {
        return frequency;
    }

    /**
     * Gets the left child of this node.
     *
     * @return left child node, or null if leaf
     */
    public HuffmanNode getLeft() {
        return left;
    }

    /**
     * Gets the right child of this node.
     *
     * @return right child node, or null if leaf
     */
    public HuffmanNode getRight() {
        return right;
    }

    /**
     * Gets the minimum code point present in this node's subtree,
     * used for deterministic tie-breaking.
     *
     * @return lowest Unicode code point
     */
    public int getLowestCodePoint() {
        return lowestCodePoint;
    }

    /**
     * Compares this node with another node for deterministic ordering in a min-heap.
     *
     * <ol>
     *   <li>Primary sort: ascending by frequency (lowest frequency first).</li>
     *   <li>Secondary sort: ascending by lowestCodePoint in subtree (deterministic tie-breaker).</li>
     * </ol>
     *
     * @param other the other HuffmanNode to compare against
     * @return negative if this is smaller, positive if larger, zero if identical
     */
    @Override
    public int compareTo(HuffmanNode other) {
        if (other == null) {
            return 1;
        }

        // Primary: compare frequencies
        int frequencyComparison = Integer.compare(this.frequency, other.frequency);
        if (frequencyComparison != 0) {
            return frequencyComparison;
        }

        // Secondary: deterministic tie-breaker using lowest code point
        return Integer.compare(this.lowestCodePoint, other.lowestCodePoint);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof HuffmanNode that)) return false;
        return frequency == that.frequency
                && lowestCodePoint == that.lowestCodePoint
                && Objects.equals(codePoint, that.codePoint)
                && Objects.equals(left, that.left)
                && Objects.equals(right, that.right);
    }

    @Override
    public int hashCode() {
        return Objects.hash(codePoint, frequency, left, right, lowestCodePoint);
    }

    @Override
    public String toString() {
        if (isLeaf()) {
            return "LeafNode{symbol=" + getCharacterDisplay() + " (" + codePoint + "), freq=" + frequency + "}";
        }
        return "InternalNode{freq=" + frequency + ", lowestCodePoint=" + lowestCodePoint + "}";
    }
}
