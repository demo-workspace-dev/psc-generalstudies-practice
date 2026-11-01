# History and polity/economy research and editorial record

Prepared and accessed: 1 November 2026. Shared Parallel research session: `3c18e7f400d9488d9557803237e274ab`.

## Delivered content

- Indian history: exactly **750** four-option questions, **559** short factual notes, 13 topic groups.
- Polity and economy: exactly **650** four-option questions, **655** short factual notes, 9 topic groups.
- Rebuild with `python3 tools/history_polity_build.py` from the reading folder. The script contains the authored fact tables and explicit individual questions; IDs and answer-order shuffling are deterministic.
- The history source contains 781 substantive candidate questions; polity contains 727. Selection is balanced across topic groups and across the full range within each group. It excludes literal answer disclosures and does not generate reverse or option-permutation copies.

## Research actually performed

Parallel web searches located official educational and legal material. Relevant pages and full chapter extracts were then opened using Parallel web fetch, including:

- [NCERT: Bricks, Beads and Bones](https://ncert.nic.in/textbook/pdf/lehs101.pdf), [Kings, Farmers and Towns](https://ncert.nic.in/textbook/pdf/lehs102.pdf), and [Thinkers, Beliefs and Buildings](https://ncert.nic.in/textbook/pdf/lehs104.pdf).
- [NCERT: Bhakti–Sufi Traditions](https://ncert.nic.in/textbook/pdf/lehs202.pdf), [Vijayanagara](https://ncert.nic.in/textbook/pdf/lehs203.pdf), [Mahatma Gandhi and the Nationalist Movement](https://ncert.nic.in/textbook/pdf/lehs303.pdf), and [Framing the Constitution](https://ncert.nic.in/textbook/pdf/lehs304.pdf).
- NIOS chapters on [Delhi Sultanate](https://digital.nios.ac.in/content/315en/315_History_Eng_Lesson9.pdf), [Mughal rule](https://digital.nios.ac.in/content/315en/315_History_Eng_Lesson10.pdf), [regional states](https://digital.nios.ac.in/content/315en/315_History_Eng_Lesson11.pdf), and [British expansion](https://digital.nios.ac.in/content/315en/315_History_Eng_Lesson16.pdf).
- NIOS [Indian Languages and Literature I](https://nios.ac.in/media/documents/SecICHCour/English/CH.06.pdf), [Indian Languages and Literature II](https://nios.ac.in/media/documents/SecICHCour/English/CH.07.pdf), and [Indian Architecture](https://nios.ac.in/media/documents/SecICHCour/English/CH.13.pdf).
- The Legislative Department's [official Constitution with English text](https://www.legislative.gov.in/static/uploads/2025/07/359f70a69695affb9d72f8393102bd2e.pdf), incorporating amendments through the 106th Amendment. The linked edition bears a November 2025 revision date; this is a constitutional reference edition, not a claim that every subsequent legal development has been exhaustively audited.
- NCERT [National Income Accounting](https://www.ncert.nic.in/textbook/pdf/leec102.pdf), [Money and Banking](https://ncert.nic.in/textbook/pdf/leec103.pdf), [Government Budget and the Economy](https://ncert.nic.in/textbook/pdf/leec105.pdf), [Open Economy Macroeconomics](https://ncert.nic.in/textbook/pdf/leec106.pdf), and [Introductory Microeconomics](https://ncert.nic.in/textbook/pdf/leec201.pdf).
- UNESCO's [Taj Mahal](https://whc.unesco.org/en/list/252) and [Ellora](https://whc.unesco.org/en/list/243) descriptions were opened to verify monument associations.

The National Portal culture page failed to fetch and was replaced with accessible NIOS references. Search and fetch findings informed the original questions; online MCQs were not copied.

## Editorial fixes completed

- Replaced the misleading generic battle-winner template with a question naming the opposing side; no Haldighati decisive-victory claim is made.
- Removed questions whose answers were directly supplied by a place or dynasty in the stem.
- Removed ruler-capital questions where more than one historical capital could be valid.
- Removed generic archaeological/monument-feature choice pools whose descriptions could overlap.
- Removed broad British India distractors from city/region questions and omitted trivial location questions with that keyed answer.
- Corrected the Muslim League item to **foundation in 1906**, rather than an incorrect first-annual-session claim.
- Corrected the first Independence Day observance to a nationwide event in 1930.
- Replaced amendment-title-year questions with substantive amendment changes, avoiding confusion between Act-title, assent and commencement years.
- Replaced overlapping appointment and tenure synonym pools with curated choices for constitutional offices; age questions explicitly ask the minimum age.
- Included meaningful qualifier wording for Yashovarman of Khajuraho and the Uttarapatha/Dakshinapatha trade-route terminology.
- Independent review by the geography/Bengal author produced additional corrections recorded in `tests/history-polity-independent-review.md`.

## Verification scope and limits

Automated checks cover exact counts, unique stems and IDs, four distinct options, valid zero-based keys, linked source IDs and literal answer clues. The bank was editorially inspected by its author and independently sampled for ambiguity and factual issues. Sources are chapter-level references; **this is not a claim of 1,400 separate online fact checks**. Some explanations are concise definitions appropriate to the user's one-line reading preference. No formal full-bank British English spellchecker audit was performed by this worker.
