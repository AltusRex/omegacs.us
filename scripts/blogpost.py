#!/usr/bin/env python3
"""Format and check blog posts for omegacs.us so every post comes out the same way.

  python3 scripts/blogpost.py new "Post title" [--tags a,b] [--description "..."]
      Create _drafts/<slug>.md with the standard front matter.
  python3 scripts/blogpost.py format FILE...
      Rewrite files in the house format (front matter order, quoting, tags, dashes, headings, spacing).
  python3 scripts/blogpost.py check FILE...
      Report anything that breaks the rules. Exit code 1 if anything does.
  python3 scripts/blogpost.py publish _drafts/<slug>.md [--date YYYY-MM-DD]
      Format, check, then move the draft to _posts/<date>-<slug>.md.

Formatting never changes wording beyond the mechanical rules listed in format_body().
Standard library only, so it runs the same locally and in CI.
"""
import datetime
import os
import re
import sys
import unicodedata

KEYS = ["title", "date", "description", "tags"]
TITLE_MAX, DESC_MAX, TAGS_MAX, SLUG_MAX = 70, 160, 4, 60
POST_NAME = re.compile(r"^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$")
DRAFT_NAME = re.compile(r"^([a-z0-9]+(?:-[a-z0-9]+)*)\.md$")


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    if len(text) > SLUG_MAX:
        text = text[:SLUG_MAX].rsplit("-", 1)[0]
    return text


def tag(text):
    return slugify(text)


def unquote(v):
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1]
        v = v.replace('\\"', '"') if v else v
    return v


def parse(text):
    """Split a post into (front matter dict, body). Only the flat keys this site uses are supported."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end < 0:
        return {}, text
    head, body = text[3:end].strip("\n"), text[end + 4:]
    meta, key = {}, None
    for line in head.splitlines():
        if not line.strip():
            continue
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            if val.startswith("[") and val.endswith("]"):
                meta[key] = [unquote(x) for x in val[1:-1].split(",") if x.strip()]
            elif val == "":
                meta[key] = []
            else:
                meta[key] = unquote(val)
        elif key and line.strip().startswith("- "):
            if not isinstance(meta.get(key), list):
                meta[key] = []
            meta[key].append(unquote(line.strip()[2:]))
    return meta, body.lstrip("\n")


def straighten(s):
    return (s.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
             .replace("…", "...").replace(" ", " "))


def dashes(s):
    # house style: spaced hyphens, never em or en dashes
    s = re.sub(r"\s*[—]\s*", " - ", s)
    s = re.sub(r"(?<=\d)–(?=\d)", "-", s)
    s = re.sub(r"\s*–\s*", " - ", s)
    s = re.sub(r"(?<=\w)\s*--\s*(?=\w)", " - ", s)
    return s


def q(v):
    return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'


def format_meta(meta):
    out = {}
    out["title"] = re.sub(r"\s+", " ", dashes(straighten(str(meta.get("title", ""))))).strip()
    d = str(meta.get("date", "")).strip()[:10]
    out["date"] = d
    out["description"] = re.sub(r"\s+", " ", dashes(straighten(str(meta.get("description", ""))))).strip()
    tags = meta.get("tags", [])
    if isinstance(tags, str):
        tags = [t for t in re.split(r"[,\s]+", tags) if t]
    out["tags"] = sorted({tag(t) for t in tags if tag(t)})
    extra = {k: v for k, v in meta.items() if k not in KEYS}
    lines = ["---"]
    lines.append("title: " + q(out["title"]))
    if out["date"]:
        lines.append("date: " + out["date"])
    lines.append("description: " + q(out["description"]))
    lines.append("tags: [" + ", ".join(out["tags"]) + "]")
    for k in sorted(extra):  # keep anything else the author added, after the standard keys
        v = extra[k]
        lines.append(f"{k}: " + ("[" + ", ".join(v) + "]" if isinstance(v, list) else q(str(v))))
    lines.append("---")
    return "\n".join(lines), out


def format_body(body):
    """Mechanical rules only: straight quotes, spaced hyphens instead of dashes, '-' bullets,
    no H1 in the body, one blank line around headings, lists and code blocks, no trailing spaces."""
    out, fence = [], False
    for raw in body.replace("\r\n", "\n").split("\n"):
        line = raw.rstrip()
        if line.lstrip().startswith("```"):
            fence = not fence
            out.append(line)
            continue
        if fence:
            out.append(raw.rstrip("\n"))
            continue
        line = dashes(straighten(line))
        if re.match(r"^#\s", line):
            line = "#" + line
        line = re.sub(r"^(\s*)[*+]\s+", r"\1- ", line)
        out.append(line)
    text = "\n".join(out)
    text = re.sub(r"\n*(^#{2,6} .*$)\n*", r"\n\n\1\n\n", text, flags=re.M)
    text = re.sub(r"\n{3,}", "\n\n", text).strip("\n")
    return text + "\n"


def format_text(text):
    meta, body = parse(text)
    head, _ = format_meta(meta)
    return head + "\n\n" + format_body(body)


def check_file(path):
    errs = []
    name = os.path.basename(path)
    text = open(path, encoding="utf-8").read()
    meta, body = parse(text)
    in_posts = os.path.basename(os.path.dirname(os.path.abspath(path))) == "_posts"
    title, desc = str(meta.get("title", "")).strip(), str(meta.get("description", "")).strip()
    tags = meta.get("tags", [])
    if not text.startswith("---"):
        errs.append("missing front matter")
    if not title:
        errs.append("title is empty")
    elif len(title) > TITLE_MAX:
        errs.append(f"title is {len(title)} characters (max {TITLE_MAX})")
    if not desc:
        errs.append("description is empty")
    elif len(desc) > DESC_MAX:
        errs.append(f"description is {len(desc)} characters (max {DESC_MAX})")
    if not isinstance(tags, list) or len(tags) > TAGS_MAX:
        errs.append(f"tags must be a list of at most {TAGS_MAX}")
    if in_posts:
        m = POST_NAME.match(name)
        if not m:
            errs.append("file name must be YYYY-MM-DD-slug.md with a lowercase hyphenated slug")
        elif str(meta.get("date", ""))[:10] != m.group(1):
            errs.append("front matter date does not match the file name")
    elif not DRAFT_NAME.match(name) and not POST_NAME.match(name):
        errs.append("draft file name must be slug.md with a lowercase hyphenated slug")
    fence = False
    for i, line in enumerate(body.split("\n"), 1):
        if line.lstrip().startswith("```"):
            fence = not fence
            continue
        if fence:
            continue
        if "—" in line or "–" in line:
            errs.append(f"body line {i}: em or en dash (use a spaced hyphen)")
        if re.match(r"^#\s", line):
            errs.append(f"body line {i}: H1 in the body (the title is the only H1)")
        for alt in re.findall(r"!\[([^\]]*)\]\(", line):
            if not alt.strip():
                errs.append(f"body line {i}: image without alt text")
    if fence:
        errs.append("unclosed code block")
    if text != format_text(text):
        errs.append("not in house format (run: python3 scripts/blogpost.py format " + path + ")")
    return errs


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    cmd, args = argv[1], argv[2:]
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def opt(name, default=None):
        if name in args:
            i = args.index(name)
            val = args[i + 1]
            del args[i:i + 2]
            return val
        return default

    if cmd == "new":
        tags, desc = opt("--tags", ""), opt("--description", "")
        title = " ".join(args).strip()
        if not title:
            print("usage: new \"Post title\"")
            return 2
        path = os.path.join(root, "_drafts", slugify(title) + ".md")
        if os.path.exists(path):
            print("already exists:", path)
            return 1
        os.makedirs(os.path.dirname(path), exist_ok=True)
        text = format_text(f"---\ntitle: {q(title)}\ndescription: {q(desc)}\ntags: [{tags}]\n---\n\nWrite the post here.\n")
        open(path, "w", encoding="utf-8").write(text)
        print(path)
        return 0
    if cmd == "format":
        for p in args:
            t = open(p, encoding="utf-8").read()
            n = format_text(t)
            if n != t:
                open(p, "w", encoding="utf-8").write(n)
                print("formatted", p)
        return 0
    if cmd == "check":
        bad = 0
        for p in args:
            for e in check_file(p):
                print(f"{p}: {e}")
                bad += 1
        print("ok" if not bad else f"{bad} problem(s)")
        return 1 if bad else 0
    if cmd == "publish":
        date = opt("--date", datetime.date.today().isoformat())
        src = args[0]
        meta, body = parse(open(src, encoding="utf-8").read())
        meta["date"] = date
        head, out = format_meta(meta)
        slug = os.path.splitext(os.path.basename(src))[0]
        dst = os.path.join(root, "_posts", f"{date}-{slug}.md")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "w", encoding="utf-8").write(head + "\n\n" + format_body(body))
        errs = check_file(dst)
        if errs:
            os.remove(dst)
            for e in errs:
                print(f"{src}: {e}")
            return 1
        os.remove(src)
        print(dst)
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
