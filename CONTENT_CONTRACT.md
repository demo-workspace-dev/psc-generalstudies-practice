# General Studies reading content

Independent, untimed learning app. Existing practice papers are separate and must stay untouched.

## Content allocation (exactly 4,000 MCQs)

| Section ID | Title | Questions | Owner |
| --- | --- | ---: | --- |
| history | Indian history | 750 | history-polity |
| polity | Polity & economy | 650 | history-polity |
| geography | Geography & environment | 750 | geography-bengal |
| bengal | West Bengal | 500 | geography-bengal |
| science | Everyday science | 1000 | science-current |
| current | Current affairs | 350 | science-current |

Write `data/<section>.json` as an object containing:

```
{
  "id": "history", "title": "Indian history", "description": "Short coverage statement",
  "notes": [{"id":"history-n001", "topic":"Ancient India", "text":"One concise factual sentence.", "sourceIds":["h-ncert"]}],
  "questions": [{"id":"history-0001", "topic":"Ancient India", "question":"Clear original question?", "options":["A","B","C","D"], "answer":0, "explanation":"Why the keyed answer is correct, with helpful context.", "sourceIds":["h-ncert"]}],
  "sources": [{"id":"h-ncert", "title":"Specific source title", "url":"https://...", "publisher":"NCERT", "accessed":"2026-11-01"}]
}
```

Questions need four distinct plausible options and one unambiguous zero-based answer. Stable section-local IDs and meaningful topic labels. Explanations teach the fact or distinction. Short, factual one-liner notes cover the section before practice. Aim for at least 150–250 substantive notes per section (science more), grouped by topic. Include economic basics, environment, and West Bengal context. English/British spelling.

Author original content from structured knowledge records if useful; generators belong in `tools/`. Do not pad to hit counts with option permutations, cosmetic paraphrases, opposite versions of the same question, or trivial metadata questions. Multiple different attributes of a historical event, institution or scientific principle are useful when they test distinct facts. Avoid ambiguous reverse lookup questions with more than one valid entity. Prefer curated plausible distractor pools within the same category. Avoid all/none-of-the-above. Do not include English-language questions.

Use Parallel MCP web research for externally verifiable facts and record sources actually consulted. Stable shared search session ID: `3c18e7f400d9488d9557803237e274ab`. Do not invent the active model slug; omit optional model_name if exact runtime identity is unavailable. Search in batches, open relevant primary sources for verification. Save a concise research/review record in `data/<owner>-research.md`. Distinguish broad references from individually checked claims; never imply every generated question received an individual online audit.

Current affairs need an explicit event year/date and supported sources. Use a clearly stated verified coverage window rather than inventing late-2026 events. Prefer important recent established events, institutions and developments with date anchors. Never invent a winner, award or future event outcome. Relevant overlap with facts learnt in the separate practice papers is permissible in this comprehensive reading resource; original wording and distinct questions inside this bank are required.

If generation code is used, run it and inspect actual outputs/counts before reporting completion. Keep all owned content and code under this new folder, no UI edits. A later independent review will check counts, duplication, clues and keys.
