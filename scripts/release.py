#!/usr/bin/env python3
"""
Compute next semver version from conventional commits and generate release notes.

Usage:
    python scripts/release.py version   # prints next version, e.g. v0.0.1
    python scripts/release.py notes     # prints markdown release notes
    python scripts/release.py both      # prints VERSION=<v> then blank line then notes
"""

import re
import subprocess
import sys


def run(cmd: str) -> str:
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()


def get_latest_tag() -> str | None:
    """Return the most recent tag matching v*.*.* or None."""
    tag = run("git describe --tags --match 'v*.*.*' --abbrev=0 2>/dev/null")
    return tag if tag else None


def parse_version(tag: str) -> tuple[int, int, int]:
    m = re.match(r"v(\d+)\.(\d+)\.(\d+)", tag)
    if not m:
        raise ValueError(f"Cannot parse tag: {tag}")
    return int(m.group(1)), int(m.group(2)), int(m.group(3))


def get_commits_since(tag: str | None) -> list[tuple[str, list[str]]]:
    """Return list of (subject, body_lines) tuples since the given tag (or all commits).

    Uses a record separator so multi-line bodies are captured per commit.
    """
    sep = "---COMMIT_SEP---"
    fmt = f"--pretty=format:%s%n%b{sep}"
    if tag:
        raw = run(f"git log {tag}..HEAD {fmt}")
    else:
        raw = run(f"git log {fmt}")

    commits: list[tuple[str, list[str]]] = []
    for block in raw.split(sep):
        block = block.strip()
        if not block:
            continue
        lines = block.splitlines()
        subject = lines[0].strip()
        if not subject:
            continue
        body_lines = [l.strip() for l in lines[1:] if l.strip()]
        commits.append((subject, body_lines))
    return commits


def compute_next_version(tag: str | None, commits: list[tuple[str, list[str]]]) -> str:
    if tag is None:
        return "v0.0.1"

    major, minor, patch = parse_version(tag)

    has_breaking = False
    has_feat = False

    for subject, body_lines in commits:
        full = " ".join([subject] + body_lines)
        if "BREAKING CHANGE" in full or re.search(r"\w+!:", subject):
            has_breaking = True
            break
        if subject.startswith("feat:") or subject.startswith("feat("):
            has_feat = True

    if has_breaking:
        major += 1
        minor = 0
        patch = 0
    elif has_feat:
        minor += 1
        patch = 0
    else:
        patch += 1

    return f"v{major}.{minor}.{patch}"


CATEGORY_MAP = {
    "feat": "✨ Features",
    "fix": "🐛 Bug Fixes",
    "perf": "⚡ Performance",
    "refactor": "♻️ Refactors",
    "docs": "📚 Documentation",
    "test": "✅ Tests",
    "chore": "🔧 Chores",
}


def generate_notes(commits: list[tuple[str, list[str]]]) -> str:
    """Group commits by conventional-commit type into markdown sections."""
    categorized: dict[str, list[tuple[str, list[str]]]] = {}

    for subject, body_lines in commits:
        for prefix, category in CATEGORY_MAP.items():
            if subject.startswith(f"{prefix}:") or subject.startswith(f"{prefix}("):
                categorized.setdefault(category, []).append((subject, body_lines))
                break
        # Unrecognised types are silently dropped (no "Other" section)

    if not categorized:
        return "No changes."

    lines = ["## What's Changed", ""]

    for section in CATEGORY_MAP.values():
        items = categorized.get(section)
        if items:
            lines.append(f"### {section}")
            for subject, body_lines in items:
                lines.append(f"- **{subject}**")
                for detail in body_lines:
                    lines.append(f"  - {detail}")
            lines.append("")

    return "\n".join(lines).rstrip()


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in ("version", "notes", "both"):
        print(__doc__.strip(), file=sys.stderr)
        sys.exit(1)

    mode = sys.argv[1]
    tag = get_latest_tag()
    commits = get_commits_since(tag)

    if mode == "version":
        print(compute_next_version(tag, commits))
    elif mode == "notes":
        print(generate_notes(commits))
    elif mode == "both":
        print(f"VERSION={compute_next_version(tag, commits)}")
        print()
        print(generate_notes(commits))


if __name__ == "__main__":
    main()
