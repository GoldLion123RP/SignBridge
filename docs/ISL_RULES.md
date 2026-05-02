# Indian Sign Language (ISL) Linguistic Rulebook

> Synthesized from technical documentation and linguistic surveys. This document serves as the foundational knowledge for the SignBridge AI translation logic and data collection queries.

---

## 1. Core Syntax & Word Order
ISL is a natural, rule-governed language with a structure distinct from English.

*   **Subject-Object-Verb (SOV)**: The primary word order.
    *   *English*: "I am eating an apple."
    *   *ISL*: **I APPLE EAT**
*   **Time-First**: Time markers (Today, Yesterday, Tomorrow) usually appear at the very beginning of a sentence.
    *   *ISL*: **YESTERDAY I MARKET GO**
*   **Clause-Final Particles**: Negative markers, possessive markers, and question words are placed at the end of the sentence.
    *   *Negation*: **I APPLE EAT NOT**
    *   *Possession*: **BOOK MY HAVE**
    *   *Interrogative*: **NAME YOUR WHAT?**

## 2. Temporal Logic (The Timeline)
Tense is indicated by spatial movement relative to the shoulder.
*   **Past**: Movement behind the shoulder (e.g., YESTERDAY).
*   **Present**: Movement in the neutral space immediately in front of the chest (e.g., NOW).
*   **Future**: Movement forward, away from the body (e.g., TOMORROW).

## 3. Non-Manual Markers (NMMs)
Grammatical meaning is conveyed through facial expressions and body posture.
*   **WH-Questions**: Raised eyebrows + head tilted back.
*   **Yes/No Questions**: Raised eyebrows held during the verb.
*   **Negation**: Mandatory side-to-side headshake (must accompany the "NOT" sign).
*   **Cognitive Signs**: Signs related to thinking or memory are located near the temple/head.

## 4. Verb Agreement & Space
*   **Directionality**: Verbs like "HELP" or "GIVE" encode the subject and object through the direction of movement.
    *   *Help me*: Movement toward the signer.
    *   *Help you*: Movement away from the signer.
*   **Simultaneity**: The use of both hands to represent two independent concepts or clauses occurring at once.

---

## 5. Core Vocabulary List (Target for YouTube Data Mining)
This list contains 80+ core everyday signs identified for the LSTM training dataset.

### A. Personal & Kinship
1. I / Me
2. You
3. He / She / It
4. Name
5. Mother
6. Father
7. Brother
8. Sister
9. Son
10. Daughter
11. Husband
12. Wife

### B. Time & Frequency
13. Time
14. Today / Now
15. Yesterday
16. Tomorrow
17. Morning
18. Night
19. Day
20. Month
21. Year
22. Hour

### C. Actions & States
23. Eat
24. Work
25. Help
26. Exist
27. Done (Completive)
28. Understand
29. Forget
30. Remember
31. Think
32. Worry
33. Dream
34. Inform
35. Tell
36. Complain
37. Sing
38. Say
39. Pass (Exam)

### D. Emotions & Descriptors
40. Happy
41. Sad
42. Enjoy
43. Shock
44. Angry
45. Easy
46. Difficult
47. Possible
48. Impossible
49. Large / Many
50. Good
51. Bad

### E. Environment & Objects
52. Water
53. House
54. City
55. Village
56. Tree
57. Snake
58. Chess
59. Bottle
60. Chalk
61. Book
62. Table
63. Gift
64. Flood
65. Sun
66. Moon

### F. Technology & Finance
67. Wi-Fi
68. Computer
69. WhatsApp
70. Laptop
71. Mobile
72. CCTV Camera
73. Money
74. Rich
75. Expensive
76. Cheap
77. Pay

### G. Functional & Interrogative
78. Hello
79. No / Not
80. Who
81. Where
82. What
83. Why
84. How
