#!/usr/bin/env python3
"""Merge extracted position text + workflow tags -> site/js/data.js + review sheet."""
import json, os, sys, glob

ROOT = "/Users/rossavilla/GitHub/Sex-Positions"
RUN = sys.argv[1] if len(sys.argv) > 1 else None
if not RUN:
    # find the newest workflow run dir
    base = os.path.join(ROOT, ".." )
runs = glob.glob("/Users/rossavilla/.claude/projects/-Users-rossavilla-GitHub-Sex-Positions/*/subagents/workflows/*/journal.jsonl")
# prefer the explicitly passed run
if RUN:
    JOURNAL = RUN
else:
    # newest by mtime
    JOURNAL = max(runs, key=os.path.getmtime)
print("Using journal:", JOURNAL)

lines = [json.loads(l) for l in open(JOURNAL) if l.strip()]
results = [l.get("result") for l in lines if l.get("type") == "result" and isinstance(l.get("result"), dict)]

tags = {}
audit = None
for r in results:
    if "category" in r and "id" in r:
        tags[r["id"]] = r
    elif "corrections" in r:
        audit = r

print("collected tag objects:", len(tags))
print("audit present:", bool(audit))

# apply audit corrections
corr_map = {}
if audit:
    for c in audit.get("corrections", []):
        corr_map[c["id"]] = c
        if c["id"] in tags:
            tags[c["id"]]["_auditFrom"] = tags[c["id"]]["category"]
            tags[c["id"]]["category"] = c["to"]
            tags[c["id"]]["_auditReason"] = c.get("reason", "")

positions = json.load(open(os.path.join(ROOT, "scratch_extract", "positions_clean.json")))

merged = []
missing = []
for p in positions:
    t = tags.get(p["id"])
    if not t:
        missing.append(p["id"])
        continue
    m = dict(p)
    for k in ["category", "penetration", "oralOnly", "stimulation", "intimacy",
              "eyeContact", "effort", "control", "strapOnFriendly", "vibeTags",
              "categoryReason", "giverBodyPosition", "receiverBodyPosition"]:
        m[k] = t.get(k)
    if "_auditFrom" in t:
        m["_auditFrom"] = t["_auditFrom"]
        m["_auditReason"] = t.get("_auditReason", "")
    merged.append(m)

merged.sort(key=lambda x: x["id"])
if missing:
    print("!! MISSING TAGS for ids:", missing)

# --- Reclassify non-penetrative positions into "Foreplay" ---
for m in merged:
    pen = m.get("penetration") or []
    penetrative = ("vaginal" in pen) or ("anal" in pen)
    if m.get("oralOnly") or not penetrative:
        m["_foreplayFrom"] = m["category"]
        m["category"] = "Foreplay"

# --- Manual category overrides (user's calls; win over everything above) ---
OVERRIDES = {
    23: "Missionary",   # The Pretzel
    24: "Missionary",   # Yourself on the Shelf
    28: "Missionary",   # Butter Churner
    29: "Missionary",   # The Ballet Dancer
    30: "Missionary",   # Iron Chef
    31: "Missionary",   # H2Ohh Yeah
    46: "Missionary",   # The X Position
    47: "Missionary",   # Snow Angel

    32: "Cowgirl/boy",  # Standing Wheelbarrow
    33: "Cowgirl/boy",  # Seated Wheelbarrow
    43: "Cowgirl/boy",  # Spork
    48: "Cowgirl/boy",  # The Fusion
    49: "Cowgirl/boy",  # The Spider
}
for m in merged:
    if m["id"] in OVERRIDES and m["category"] != OVERRIDES[m["id"]]:
        m["_overrideFrom"] = m["category"]
        m["category"] = OVERRIDES[m["id"]]

# category metadata
CATEGORIES = {
    "Missionary":  {"label": "Missionary",  "cls": "c-Missionary", "emoji": "💞", "color": "#F86FDF",
                    "blurb": "Penetrating partner on top, face-to-face.",
                    "desc": "Missionary is any position where the penetrating partner is on top of the receiving partner. It includes standing variations, but the penetrating partner still has the most control over depth and pace."},
    "Cowgirl/boy": {"label": "Cowgirl/boy", "cls": "c-Cowgirlboy", "emoji": "🤠", "color": "#C864E8",
                    "blurb": "Receiving partner on top, in control.",
                    "desc": "Cowgirl/boy is any position where the receiving partner is on top of the penetrating partner. Being on top usually hands the receiving partner control of the depth, angle, and rhythm of penetration."},
    "Doggystyle":  {"label": "Doggystyle",  "cls": "c-Doggystyle", "emoji": "🐶", "color": "#16B9DE",
                    "blurb": "Penetrating partner behind — rear entry.",
                    "desc": "Doggystyle is any position where the penetrating partner is kneeling, sitting, or standing behind the receiving partner. This rear-entry angle tends to allow deep penetration."},
    "Spooning":    {"label": "Spooning",    "cls": "c-Spooning",   "emoji": "🥄", "color": "#4FA6E0",
                    "blurb": "Lying side-by-side, cozy and close.",
                    "desc": "Spooning is any position where both partners are lying on their sides, side-by-side. It keeps weight off both bodies, so it's relaxed, intimate, and easy to sustain."},
    "Foreplay":    {"label": "Foreplay",    "cls": "c-Foreplay",   "emoji": "💋", "color": "#FF6F9C",
                    "blurb": "Oral, grinding & hands — no penetration needed.",
                    "desc": "Foreplay covers the non-penetrative positions — oral, grinding, and hands. Great on their own or as a warm-up before moving into another category."},
    "Misc":        {"label": "Misc",        "cls": "c-Misc",       "emoji": "✨", "color": "#4166D9",
                    "blurb": "Standing, seated & everything else.",
                    "desc": "Misc is the catch-all for penetrative positions that don't fit the other shapes — standing or seated face-to-face, side-by-side facing, and more acrobatic arrangements."},
}

# clean site-facing objects (drop internal audit fields for data.js but keep for review)
site = []
for m in merged:
    o = {k: v for k, v in m.items() if not k.startswith("_")}
    site.append(o)

out = os.path.join(ROOT, "site", "js", "data.js")
with open(out, "w") as f:
    f.write("/* data.js — generated. Position text (de-gendered from source) + category/quiz tags. */\n")
    f.write("window.CATEGORIES = " + json.dumps(CATEGORIES, ensure_ascii=False, indent=2) + ";\n\n")
    f.write("window.POSITIONS = " + json.dumps(site, ensure_ascii=False, indent=2) + ";\n")
print("Wrote", out, "with", len(site), "positions")

# category distribution
from collections import Counter
dist = Counter(m["category"] for m in merged)
print("category distribution:", dict(dist))

# save merged (with audit info) for the review sheet
json.dump(merged, open(os.path.join(ROOT, "scratch_extract", "merged.json"), "w"), ensure_ascii=False, indent=2)
if audit:
    print("\nAUDIT SUMMARY:", audit.get("summary", "")[:600])
    print("CORRECTIONS:", len(audit.get("corrections", [])))
    for c in audit.get("corrections", []):
        print("  #%d %s: %s -> %s (%s)" % (c["id"], c["name"], c["from"], c["to"], c.get("reason","")[:80]))
