# Huffman Coding Algorithm — Comprehensive Engineering Guide

This document provides a university-level, viva-ready explanation of the **Huffman Coding Algorithm** implemented in **Huffman Studio**. It covers foundational theory, step-by-step mechanics, mathematical complexity, and critical edge cases.

---

## 1. Introduction & Theoretical Foundation

**Huffman Coding** is a lossless data compression algorithm introduced by David A. Huffman in his 1952 paper, *"A Method for the Construction of Minimum-Redundancy Codes"*.

### The Core Problem
Standard character representations (like ASCII or fixed-width Unicode) assign a uniform number of bits to every character:
- Standard ASCII uses **8 bits** per character (`'e'` = 8 bits, `'z'` = 8 bits).
- In natural language text, character frequencies vary drastically. For instance, in English, `'e'`, `'t'`, and `'a'` appear far more frequently than `'q'`, `'x'`, or `'z'`.
- Using 8 bits for high-frequency characters wastes bandwidth and storage.

### The Huffman Solution
Huffman coding uses **variable-length prefix codes**:
- **Frequent characters** receive **short binary codes** (e.g., 2 to 4 bits).
- **Infrequent characters** receive **longer binary codes** (e.g., 8 to 12 bits).
- On average, the total number of bits required to represent the message is minimized, achieving compression while guaranteeing 100% lossless reconstruction.

---

## 2. Step-by-Step Algorithm Pipeline

```
+------------------------------------------------------------------------------------+
| 1. Frequency Analysis                                                              |
|    Count occurrences of each unique Unicode code point in the text.                |
+-----------------------------------------+------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 2. Priority Queue Initialization                                                   |
|    Wrap every symbol into a leaf node and insert into a min-heap priority queue.   |
+-----------------------------------------+------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 3. Greedy Tree Construction                                                        |
|    Iteratively poll the two lowest-frequency nodes, merge under a parent node,     |
|    and re-insert until only the root node remains.                                 |
+-----------------------------------------+------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 4. Prefix-Free Code Generation (DFS)                                               |
|    Traverse root-to-leaf: assign '0' to left edges and '1' to right edges.         |
|    Record binary strings at each leaf node.                                        |
+-----------------------------------------+------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 5. Text Encoding                                                                   |
|    Substitute each character in original text with its generated prefix code.      |
+-----------------------------------------+------------------------------------------+
                                          |
                                          v
+------------------------------------------------------------------------------------+
| 6. Text Decoding                                                                   |
|    Traverse tree from root using each bit: emit character at leaf, reset to root.  |
+------------------------------------------------------------------------------------+
```

---

### Step 1: Frequency Calculation (`FrequencyCounter.java`)
The algorithm inspects the text and computes how many times each character occurs.

```java
Map<Integer, Integer> frequencies = FrequencyCounter.countFrequencies(text);
```

#### Unicode Code Point Handling
In Java, a `char` is a 16-bit UTF-16 code unit. Supplementary characters (like emojis `🌍` or rare historical scripts) require two surrogate `char` units.
* If a program naively counts `char`s, supplementary characters get split into two invalid surrogate frequencies.
* `HuffmanStudio` solves this by iterating through **Unicode code points** (`int` values from `0x0` to `0x10FFFF`):
  ```java
  int codePoint = text.codePointAt(offset);
  offset += Character.charCount(codePoint);
  ```
* All spaces, tabs, newlines, symbols, and multi-byte characters are preserved with full fidelity.

---

### Step 2: The Min-Heap (`PriorityQueue<HuffmanNode>`)
A **min-heap** is an optimal data structure for finding and removing the minimum element in $O(\log N)$ time.
* Each unique character becomes a `HuffmanNode.createLeaf(codePoint, frequency)`.
* All leaf nodes are added to `java.util.PriorityQueue<HuffmanNode>`.

#### Deterministic Tie-Breaking Strategy
In standard Huffman coding, if multiple characters have the same frequency, tie-breaking is arbitrary. However, in an academic software system, **determinism is mandatory**: the same input must always produce the exact same tree and codes on every platform and run.

`HuffmanNode` implements `Comparable<HuffmanNode>` with two criteria:
1. **Primary Sort**: Frequency ascending (`Integer.compare(this.frequency, other.frequency)`).
2. **Secondary Tie-Breaker**: Lowest Unicode code point in the node's subtree (`Integer.compare(this.lowestCodePoint, other.lowestCodePoint)`).

Because every unique character belongs to disjoint subtrees in the forest, `lowestCodePoint` is strictly unique across all active nodes in the queue, providing a **mathematically total, unambiguous ordering**.

---

### Step 3: Huffman Tree Construction (`HuffmanTreeBuilder.java`)
The construction loop repeatedly takes the two lightest nodes and merges them:

```java
while (queue.size() > 1) {
    HuffmanNode leftChild = queue.poll();   // Lowest weight
    HuffmanNode rightChild = queue.poll();  // Second-lowest weight

    HuffmanNode parent = HuffmanNode.createInternal(leftChild, rightChild);
    queue.add(parent);
}
return queue.poll(); // Root of the tree
```

#### Walkthrough Example
Suppose our text is `"BCAADDD"`:
* Frequencies: `'D': 3`, `'A': 2`, `'B': 1`, `'C': 1`
* Queue initial state: `[B:1, C:1, A:2, D:3]`
1. Poll `B:1` and `C:1` $\rightarrow$ Merge into internal node `(BC):2`. Queue: `[A:2, (BC):2, D:3]`
2. Poll `A:2` and `(BC):2` $\rightarrow$ Merge into internal node `(A(BC)):4`. Queue: `[D:3, (A(BC)):4]`
3. Poll `D:3` and `(A(BC)):4` $\rightarrow$ Merge into root node `(D(A(BC))):7`.
4. Queue has 1 element $\rightarrow$ Done.

---

### Step 4: Recursive Code Generation (`HuffmanCodeGenerator.java`)
Once the tree is built, we assign binary prefix codes using Depth-First Search (DFS):
- Every step to a **left child** appends bit `'0'`.
- Every step to a **right child** appends bit `'1'`.
- When a **leaf node** is reached, the accumulated bit sequence is recorded in `Map<Integer, String>`.

#### Prefix-Free Property
A prefix code guarantees that **no code is a prefix of any other code**.
* For example, if `'A'` is `"01"`, no other character can have code `"0"`, `"01"`, or `"011"`.
* This ensures that during decompression, bitstreams can be decoded instantly from left to right without needing commas or delimiters between characters.

#### Single Unique Character Edge Case
If the input text is `"AAAAAA"`:
- There is only 1 unique symbol (`'A'`).
- The tree contains only 1 leaf node.
- If we followed standard left/right branching, the path would be empty (`""`), which cannot be decoded.
- `HuffmanStudio` handles this by explicitly assigning code `"0"` to the single character.

---

### Step 5: Text Encoding (`HuffmanEncoder.java`)
Encoding transforms the human-readable text into a continuous sequence of `'0'` and `'1'` characters:
1. Initialize a `StringBuilder`.
2. For each Unicode code point in the text, look up its code in `Map<Integer, String>`.
3. If a character is missing, throw an `IllegalArgumentException`.
4. Append the code bits to the output string.

---

### Step 6: Text Decoding (`HuffmanDecoder.java`)
Decoding reverses the process by walking the tree from root to leaf:
1. Start at `current = root`.
2. For each bit:
   - If bit is `'0'`, move `current = current.getLeft()`.
   - If bit is `'1'`, move `current = current.getRight()`.
   - If `current.isLeaf()`, append its character to output, then reset `current = root`.
3. **Integrity Checks**:
   - Rejects non-binary characters (e.g. `'2'`, spaces).
   - Verifies that the stream ends with `current == root`. If the stream ends while `current` is an internal node, it detects that the bitstream was truncated/corrupted and throws an exception.

---

## 3. Mathematical & Complexity Analysis

Let $N$ be the total length of the text (number of characters) and $K$ be the number of unique characters ($K \le N$, $K \le 256$ for ASCII, or up to the distinct Unicode alphabet size).

| Operation | Time Complexity | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- |
| **Frequency Counting** | $O(N)$ | $O(K)$ | Single linear scan through the text storing counts in a hash map. |
| **Priority Queue Build** | $O(K \log K)$ | $O(K)$ | Inserting $K$ leaf nodes into the min-heap. |
| **Tree Construction** | $O(K \log K)$ | $O(K)$ | Exactly $K - 1$ merges. Each merge performs two polls and one add, each taking $O(\log K)$. |
| **Code Generation** | $O(K)$ | $O(K)$ | DFS visits each of the $2K - 1$ tree nodes exactly once. |
| **Text Encoding** | $O(N)$ | $O(N)$ | Looking up each of the $N$ characters in $O(1)$ and appending bits. |
| **Text Decoding** | $O(B)$ where $B \le 8N$ | $O(N)$ | Traverses 1 tree edge per bit in the bitstream. |

* **Total Runtime Complexity**: $O(N + K \log K)$. Since $K$ is bounded by the alphabet size, Huffman coding runs in linear time $O(N)$ with respect to text length.
* **Total Auxiliary Memory**: $O(N + K)$, dominated by the output string buffer and tree storage.

---

## 4. Compression Statistics Formulas

`HuffmanStatistics.java` provides standardized metrics:

1. **Original Byte Size ($S_{orig}$)**:
   $$\text{Bytes of } text \text{ in UTF-8}$$
2. **Encoded Byte Count ($S_{enc}$)**:
   $$S_{enc} = \left\lceil \frac{\text{Encoded Bit Count}}{8} \right\rceil$$
3. **Compression Ratio ($R$)**:
   $$R = \frac{S_{orig}}{S_{enc}}$$
   *(e.g., $R = 2.50$ means the original text is 2.5 times larger than the compressed payload)*
4. **Percentage Saved ($P_{saved}$)**:
   $$P_{saved} = \left(1 - \frac{S_{enc}}{S_{orig}}\right) \times 100\%$$
   *(e.g., $P_{saved} = 60\%$ means storage requirement is reduced by 60%)*

#### Handling Division by Zero
For empty input ($N = 0$), $S_{orig} = 0$. Both $R$ and $P_{saved}$ safely return `0.0` to prevent `ArithmeticException` or `NaN`.

---

## 5. Edge Cases & Robustness Summary

| Scenario | Handled By | Expected Behavior |
| :--- | :--- | :--- |
| **Empty String (`""`)** | `FrequencyCounter`, `HuffmanTreeBuilder`, `HuffmanCompressor` | Returns empty frequency map, null root, empty bitstring, 0 statistics. Restores `""`. |
| **Single Character (`"A"`)** | `HuffmanCodeGenerator`, `HuffmanDecoder` | Assigns code `"0"`. Restores `"A"`. |
| **Repeated Character (`"AAAAAA"`)** | `HuffmanTreeBuilder`, `HuffmanCodeGenerator` | Tree has 1 leaf. Code `"0"`. Encoded `"000000"`. Restores `"AAAAAA"`. |
| **Two Characters (`"AB"`)** | `HuffmanTreeBuilder` | Left leaf `'A'` (`"0"`), right leaf `'B'` (`"1"`). Encoded `"01"`. |
| **Equal Frequencies (`"abcdef"`)** | `HuffmanNode.compareTo()` | Deterministic tie-breaking using minimum code point. |
| **Unicode & Emojis (`"Hello 🌍"`)** | Code point iteration (`Character.codePointAt`) | Preserves surrogate pairs; exact roundtrip restored. |
| **Corrupted Bits (`"010201"`)** | `HuffmanDecoder` | Throws `IllegalArgumentException` on character `'2'`. |
| **Truncated Stream (Ends mid-tree)** | `HuffmanDecoder` | Validates `current == root` at stream termination; rejects premature endings. |
| **Missing Code Table Entry** | `HuffmanEncoder` | Throws `IllegalArgumentException` explicitly naming missing character. |
