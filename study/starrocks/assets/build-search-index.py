#!/usr/bin/env python3
"""사이트의 모든 .html을 훑어 검색 인덱스 JSON을 만든다.

실행:
    python3 assets/build-search-index.py

출력:
    assets/search-index.json
"""
import json
import re
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"assets"}

# breadcrumb의 "홈 / 섹션 / ..." 형태에서 섹션 추출용
BC_RE = re.compile(r"홈\s*/\s*([^/]+?)\s*/")
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S | re.I)
H2_RE = re.compile(r'<h2[^>]*\sid="([^"]+)"[^>]*>(.*?)(?=<a class="anchor-link"|</h2>)', re.S | re.I)


class TextStripper(HTMLParser):
    """간단한 태그 제거 + 텍스트만 추출."""

    def __init__(self):
        super().__init__()
        self.parts = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav", "aside", "header", "footer"):
            self._skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav", "aside", "header", "footer"):
            self._skip = max(0, self._skip - 1)

    def handle_data(self, data):
        if self._skip == 0:
            t = data.strip()
            if t:
                self.parts.append(t)

    def get_text(self) -> str:
        return " ".join(self.parts)


def strip_html(s: str) -> str:
    """간단 태그 제거."""
    return re.sub(r"<[^>]+>", "", s).strip()


def extract_section(html: str) -> str:
    m = BC_RE.search(html)
    if m:
        return m.group(1).strip()
    return ""


def extract_title(html: str) -> str:
    m = TITLE_RE.search(html)
    if not m:
        return ""
    title = m.group(1).strip()
    # "X — StarRocks 가이드" 의 좌측만
    title = title.split("—")[0].strip()
    return title


def extract_h1(html: str) -> str:
    m = H1_RE.search(html)
    if not m:
        return ""
    return strip_html(m.group(1))


def extract_h2_anchors(html: str):
    """[(anchor_id, label), ...]"""
    results = []
    for m in H2_RE.finditer(html):
        anchor = m.group(1)
        label = strip_html(m.group(2))
        if label:
            results.append((anchor, label))
    return results


def extract_text(html: str) -> str:
    p = TextStripper()
    p.feed(html)
    return p.get_text()


def build():
    items = []
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] in SKIP_DIRS:
            continue

        html = path.read_text(encoding="utf-8")

        title = extract_title(html) or extract_h1(html) or rel.stem
        h1 = extract_h1(html)
        section = extract_section(html)
        h2s = extract_h2_anchors(html)
        text = extract_text(html)
        # 너무 길면 잘라서 인덱스 무게 줄임
        if len(text) > 4000:
            text = text[:4000]

        items.append(
            {
                "url": rel.as_posix(),
                "title": title,
                "h1": h1,
                "section": section,
                "headings": [{"id": a, "label": l} for a, l in h2s],
                "text": text,
            }
        )

    out = ROOT / "assets" / "search-index.json"
    out.write_text(json.dumps(items, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out}: {len(items)} pages, {out.stat().st_size:,} bytes")


if __name__ == "__main__":
    build()
