# SignBridge AI - Machine Learning & Data Science Core Concepts

This document provides concise explanations for the key ML and Statistical concepts relevant to the SignBridge project and general data science practices.

## 1. Clustering Techniques
Clustering is an unsupervised learning task that groups similar data points together.

### Hierarchical Clustering vs. K-Means
| Feature | Hierarchical Clustering | K-Means |
|---------|-------------------------|---------|
| **Type** | Builds a tree of clusters (Dendrogram). | Partitions data into $K$ clusters. |
| **Number of Clusters** | Not required upfront. | Must specify $K$ in advance. |
| **Complexity** | High ($O(N^2)$); slow for large data. | Low ($O(N)$); fast for large data. |
| **Result** | Deterministic (same result every time). | Non-deterministic (depends on initialization). |

---

## 2. Decision Trees & Overfitting
Decision Trees are prone to capturing noise in the training data, leading to poor generalization.

### Pruning
Removing branches that provide little predictive power.
- **Pre-pruning:** Stop growing the tree early (e.g., max-depth).
- **Post-pruning:** Cut branches after the tree is fully grown.
- **Effect:** Reduces overfitting by simplifying the model.

### Key Hyperparameters
- **Max-Depth:** Limits how many levels the tree can have. Deep trees overfit; shallow trees underfit.
- **Min-Sample Split:** Minimum number of samples required to split a node. Higher values prevent the tree from learning specific outliers.

---

## 3. Linear Algebra in Machine Learning
Linear Algebra is the "language" of ML.
- **Vectors:** Represent single data points (e.g., coordinates of a hand landmark).
- **Matrices:** Represent datasets or transformations (e.g., a batch of 97-feature frames).
- **Matrix Operations:** Used for weight updates, dimensionality reduction (PCA), and forward passes in Neural Networks (like our LSTM).

---

## 4. Statistics Fundamentals
- **Mean:** Average value. Sensitive to outliers.
- **Median:** Middle value. Robust to outliers.
- **Mode:** Most frequent value.
- **Standard Deviation:** Measures the spread of data. Low SD means data is clustered around the mean.

---

## 5. Error Analysis & Evaluation

### Type-I vs. Type-II Errors
- **Type-I (False Positive):** Predicting a gesture when there is none (e.g., "Hello" detected from random noise).
- **Type-II (False Negative):** Failing to detect a real gesture (e.g., missing a "Thank You" sign).

### Confusion Matrix
A $N \times N$ table used to evaluate classification performance, showing True Positives, True Negatives, False Positives, and False Negatives.

---

## 6. Model Generalization
- **Overfitting:** High variance. Model fits training data perfectly but fails on test data.
- **Underfitting:** High bias. Model is too simple to capture the underlying pattern.

---

## 7. Algorithms & Frameworks

### Supervised vs. Unsupervised Learning
- **Supervised:** Labeled data (e.g., our LSTM trained on labeled ISL gestures).
- **Unsupervised:** Unlabeled data (e.g., finding new gesture patterns via clustering).

### Linear vs. Polynomial Regression
- **Linear:** $y = mx + b$. Assumes a straight-line relationship.
- **Polynomial:** $y = a + b_1x + b_2x^2 + \dots$. Captures non-linear curves.

---

## 8. Practical Applications
- **Healthcare:** Decision trees are used for diagnosis (e.g., symptom-based disease classification) due to their interpretability.
- **Time Series:** Sequential data where time is a variable. Our SignBridge LSTM is a Time Series model because it processes sequences of frames.

---

## 9. CRISP-DM Process
The Cross-Industry Standard Process for Data Mining:
1. Business Understanding
2. Data Understanding
3. Data Preparation
4. Modeling
5. Evaluation
6. Deployment
