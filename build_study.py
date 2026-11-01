#!/usr/bin/env python3
"""Validate source content and bundle it for offline file:// use. No dependencies."""
from collections import Counter
from datetime import date
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
COUNTS = {"history": 750, "polity": 650, "geography": 750, "bengal": 500, "science": 1000, "current": 350}
MIN_NOTES = {"history": 150, "polity": 150, "geography": 150, "bengal": 150, "science": 200, "current": 100}


def normalise(text):
    return re.sub(r"[^\w]+", " ", text.casefold()).strip()


def normalise_option(text):
    # Mathematical signs, negative signs, decimals and formula subscripts carry meaning.
    return re.sub(r"\s+", " ", text.casefold()).strip()


def main():
    sections, seen_ids, seen_stems, all_sources, warnings = [], set(), {}, {}, []
    for section_id, expected in COUNTS.items():
        path = ROOT / "data" / f"{section_id}.json"
        data = json.loads(path.read_text())
        assert data["id"] == section_id, f"Wrong section ID: {path}"
        assert isinstance(data["title"], str) and data["title"].strip()
        assert isinstance(data["description"], str) and data["description"].strip()
        assert len(data["questions"]) == expected, f"{section_id}: expected {expected}, got {len(data['questions'])}"
        assert len(data["notes"]) >= MIN_NOTES[section_id], f"{section_id}: insufficient notes"
        sources = {}
        for source in data["sources"]:
            for field in ["id", "title", "url", "publisher", "accessed"]:
                assert isinstance(source[field], str) and source[field].strip(), (section_id, source)
            assert source["url"].startswith("https://"), source
            assert date.fromisoformat(source["accessed"]) <= date(2026, 11, 1), source
            assert source["id"] not in sources, f"Duplicate source in {section_id}"
            sources[source["id"]] = source
            if source["id"] in all_sources:
                assert all_sources[source["id"]] == source, f"Conflicting global source ID {source['id']}"
            all_sources[source["id"]] = source
        for item in data["notes"] + data["questions"]:
            assert isinstance(item["id"], str) and re.fullmatch(r"[a-zA-Z0-9_-]+", item["id"]), item["id"]
            assert item["id"] not in seen_ids, f"Duplicate ID {item['id']}"
            seen_ids.add(item["id"])
            assert item["topic"].strip(), item["id"]
            assert item["sourceIds"] and all(sid in sources for sid in item["sourceIds"]), f"Broken source reference {item['id']}"
        for note in data["notes"]:
            assert isinstance(note["text"], str) and note["text"].strip()
            assert "\n" not in note["text"], f"Multi-line note {note['id']}"
            if len(note["text"].split()) > 55:
                warnings.append({"id": note["id"], "reason": "Long note; consider shortening"})
        for q in data["questions"]:
            assert isinstance(q["question"], str) and len(q["question"].split()) >= 3, q["id"]
            assert len(q["options"]) == 4 and all(isinstance(o, str) and o.strip() for o in q["options"]), q["id"]
            assert len({normalise_option(o) for o in q["options"]}) == 4, f"Duplicate options {q['id']}"
            assert type(q["answer"]) is int and q["answer"] in range(4), q["id"]
            assert isinstance(q["explanation"], str) and len(q["explanation"].split()) >= 4, f"Missing explanation {q['id']}"
            stem = normalise(q["question"])
            if stem in seen_stems:
                raise AssertionError(f"Duplicate question stem {q['id']} and {seen_stems[stem]}")
            seen_stems[stem] = q["id"]
            if section_id == "current":
                dated_stem = re.search(r"\b20(?:1\d|2\d)\b", q["question"])
                asks_event_year = "which year" in q["question"].casefold() and re.fullmatch(r"20(?:1\d|2\d)", q["options"][q["answer"]])
                assert dated_stem or asks_event_year, f"Undated current affair {q['id']}"
            correct = normalise(q["options"][q["answer"]])
            if len(correct) > 5 and f" {correct} " in f" {stem} ":
                warnings.append({"id": q["id"], "reason": "Correct option occurs in stem; review for a clue", "answer": q["options"][q["answer"]], "question": q["question"]})
        positions = Counter(q["answer"] for q in data["questions"])
        assert all(positions[i] >= expected * .15 for i in range(4)), f"Unbalanced answers {section_id}: {positions}"
        print(f"PASS {section_id}: {expected} MCQs, {len(data['notes'])} notes, {len(sources)} sources; answer positions {dict(sorted(positions.items()))}")
        sections.append(data)
    assert sum(len(s["questions"]) for s in sections) == 4000
    canonical = json.dumps(sections, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    version = hashlib.sha256(canonical.encode()).hexdigest()[:12]
    bundle = {"version": version, "prepared": "2026-11-01", "sections": sections}
    serialised = json.dumps(bundle, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    (ROOT / "study-data.js").write_text("/* Generated by build_study.py. Edit data/*.json, then rebuild. */\nwindow.GS_DATA=" + serialised + ";\n")
    report = {
        "version": version, "questions": 4000,
        "notes": sum(len(s["notes"]) for s in sections),
        "sources": len(all_sources), "warnings": warnings,
        "scope": "Structural validation of every question; source references resolve locally. This is not an individual online fact-check of every item."
    }
    (ROOT / "tests" / "content-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Built offline library {version}: 4,000 questions; {report['notes']} notes; {len(warnings)} editorial warnings to inspect.")


if __name__ == "__main__":
    main()
