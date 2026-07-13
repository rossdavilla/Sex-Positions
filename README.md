# Position Yourself

An inclusive, mobile-first guide to **56 sex positions** — sorted by how two bodies actually line up — plus a quick, judgment-free **quiz** that matches you and your partner to the positions you're most likely to enjoy.

It's a small static site: plain HTML, CSS, and vanilla JavaScript. No build step, no dependencies, no tracking. Nothing you enter in the quiz leaves your device.

## Categories

Every position is filed under one of five body-arrangement categories:

| Category | Arrangement |
|---|---|
| 💞 **Missionary** | Penetrating partner on top of the receiving partner (includes standing variations) |
| 🤠 **Cowgirl/boy** | Receiving partner on top, controlling depth and pace |
| 🐶 **Doggystyle** | Penetrating partner kneeling, sitting, or standing behind |
| 🥄 **Spooning** | Both partners lying on their sides, side-by-side |
| 💋 **Foreplay** | Non-penetrative — oral, grinding, and hands |

## The matcher quiz

Seven quick questions — anatomy, preferred role, the kinds of stimulation you enjoy, closeness, energy level, and who likes to steer — feed a weighted scorer that ranks all 56 positions and returns your top matches with a short "why it fits" for each. Options adapt to the anatomy you enter, and the results explain themselves.

## Run it locally

It's fully static, so any web server works. From the repo root:

```bash
python3 -m http.server 4599 --directory site
# then open http://localhost:4599
```

You can also just open `site/index.html` directly in a browser — the position data is bundled as a JS global, so it works over `file://` too.

## Project structure

```
site/
  index.html        # browse all positions, filter by category, detail modal
  quiz.html         # the matcher quiz
  css/style.css     # design system (light + dark, mobile-first)
  js/
    data.js         # generated — position content + category/quiz tags
    detail.js       # shared position modal + "more like this"
    browse.js       # category filter + card grid
    quiz.js         # quiz flow + scoring
  assets/img/       # position illustrations
review-sheet.html   # human-readable audit of every position's category + tags
scratch_extract/    # data pipeline: build_data.py regenerates site/js/data.js
```

## Credits & disclaimer

Position write-ups and illustrations are adapted from *Men's Health* ("56 Fun Sex Positions for Adventurous Couples"). Text has been lightly edited to use inclusive, gender-neutral language.

This is an educational, sex-positive reference for adults. Everything here assumes enthusiastic, ongoing consent — the best position is always the one you've both said yes to. Descriptions are illustrative; go at your own pace, use lube and protection as needed, and stop if anything hurts.
