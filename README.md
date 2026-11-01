# General Studies — Read & remember

Open **[index.html](index.html)** in your browser. No installation, account, timer or marking scheme is needed. Keep this entire folder together. All questions, notes, scripts and the IBM Plex Sans font are local; internet is only needed when opening the linked sources.

This is a separate reading resource. It does not change the existing `psc-clerkship-practice` papers or their saved attempts.

## How to use it

1. Start in **Study notes**. Read all subjects or choose one in the subject menu. Notes are concise factual lines, grouped by topic. Search for a fact and tick lines you have read, or mark a visible topic read. Meaningful phrases receive selective colour and emphasis: blue bold for key terms, amber bold for dates and numbers, teal bold for places and factual answers, and violet italics for titles or short definitions.
2. Open **Practise questions** and choose a subject. Select one of four answers and press **Check answer** for the result, explanation and supporting links.
3. **Bookmark** saves a place, such as History question 9. **Flag for revision** keeps a difficult question in your revision list. These are separate controls.
4. Return through **Continue…**, choose a subject to resume its last question, use **Jump to bookmark**, or open the **Bookmarks** tab and jump to any saved question. The question-number box also opens any question directly.
5. Use the practice-set menu to show bookmarks, flagged/incorrect questions, or questions not yet checked. A filtered session keeps its question list while you work, so checking or removing a flag does not unexpectedly move the current question. Choosing the filter again refreshes it.
6. **Hide explanation & practise again** lets you recall a checked question. Its previous result stays saved until you check the new answer; leaving or reloading during this recall returns to the saved result.

There are **3,479 concise notes** and exactly **4,000 questions**:

| Subject | Notes | Questions |
| --- | ---: | ---: |
| Indian history | 559 | 750 |
| Polity & economy | 655 | 650 |
| Geography & environment | 589 | 750 |
| West Bengal | 307 | 500 |
| Everyday science | 1,019 | 1,000 |
| Current affairs | 350 | 350 |

Current-affairs questions include dates/years. Read that subject's description and research record for the actual coverage window. A dated bank is not a live news feed. Sources appear after checking a question and under note-topic source disclosures. Short explanations reinforce the fact; related notes provide the broader reading context.

## Saved progress and backups

Reading ticks, selected/checked answers, bookmarks, revision flags, and a last question in each subject are saved under the independent local-storage key `psc-general-studies-reading-v1`. No server receives your progress. This app makes no network requests during learning.

Use the **same browser, browser profile and address** each time. Private browsing, clearing site data, moving the folder or switching from a local file to a web-server address can make an old record unavailable. Progress does not automatically move between devices. At the foot of the page, **Download progress backup** saves a JSON file; **Restore backup** merges reading ticks/bookmarks/flags and keeps the newer answer for each question. Restoring an older backup can bring back a bookmark removed since that backup.

If storage is blocked or full, a visible message explains that new changes are only in the open tab and offers the backup route. A malformed existing record is left untouched. The normal app has no erase-all or exam-reset action.

## Web and mobile

The layout supports narrow mobile screens, tablets and desktop browsers, with comfortably sized IBM Plex Sans text, wrapping controls, keyboard-operable radio buttons and visible focus. Desktop Chrome also supports double-clicking `index.html` directly.

To serve it as a normal website locally, run this **inside this folder**:

```sh
python3 -m http.server 8001 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8001/index.html`. A phone needs an accessible web address or a browser capable of opening the complete local website; a file-preview app may not execute the scripts. When hosting, publish the whole folder as static files. There is no backend and no cloud sync. Use one stable address for saved progress. A page already open works without a connection; a hosted page must still be available when loading it again.

## Content, research and maintenance

The six source files in `data/` contain notes, questions and source records. Content was authored from curated fact and concept tables, with separate questions for distinct attributes. The generators are in `tools/`. They are useful for traceability; rebuilding them can change question numbering, so published IDs should be kept stable during later edits. Existing progress is keyed by these IDs.

The authors used Parallel MCP web search and relevant primary/educational references. Research records describe the sources consulted, known limitations and coverage. All 4,000 records receive structural validation; broad source consultation and editorial review are distinct from individually verifying every question online. The application does not claim an individual web audit of every record. Consult the linked authority when a detail needs confirmation or a dated fact has changed.

The official Clerkship 2023 General Studies paragraph covers everyday observation/science, current events/problems with special reference to India, and elementary Indian history/geography. This companion also includes polity, economic basics, environment and West Bengal following the existing practice guide. It is not an official examination paper or an assertion about a new 2026 syllabus. The original scheme is linked in `data/study-method-research.md`.

The interface follows `../PSC_PRACTICE_HANDOFF.md`: Carbon White colours, square surfaces, locally bundled IBM Plex Sans, comfortable reading sizes and aligned radio/letter/answer rows. The untimed study flow follows the new learning requirements. Font licensing is in `assets/IBM-Plex-LICENSE.txt`.

After editing content:

```sh
python3 build_study.py
node tests/browser-test.cjs
```

The builder validates exact subject counts, unique IDs/stems, option uniqueness, answer indices, explanations, date anchors in current affairs, answer-position distribution and local source references; it generates `study-data.js` for offline use and `tests/content-report.json` for review. Browser checks use disposable profiles and cover actual content, saved answers, bookmarks, subject positions, reattempts, note search/ticks, backup merge, blocked/corrupt storage, keyboard use, direct-file opening, and 320/390/768/1440px layouts. They require a local Playwright installation and Chrome; optional `PLAYWRIGHT_MODULE` and `CHROME_PATH` environment variables select alternatives.

Screenshots and the completed verification record live in `tests/`. The macOS British English screen is available as `tests/spellcheck.swift`; its JSON report retains dictionary candidates, including Indian proper names and scientific terminology. It is a screening aid, not a zero-error certificate.
