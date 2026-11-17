# Position Yourself (`Sex-Positions`)

A **PSY175** reference: an inclusive, mobile-first guide to 56 sex positions sorted by body
arrangement, plus a matcher quiz. Live at <https://rossdavilla.github.io/Sex-Positions/site/>.

`README.md` has the category table, the quiz description, the project tree and the credits. The
notes here are what it does not say.

## `site/js/data.js` is generated — do not hand-edit it

The position content and every category/quiz tag come out of the pipeline in
`scratch_extract/`: `build_data.py` regenerates `site/js/data.js`. A hand edit there is thrown
away the next time it runs. Change the pipeline's source data and rebuild.

`review-sheet.html` is a human-readable audit of every position's category and tags — the way to
check a rebuild did what you meant. It is instructor-facing, so it is already kept out of the
public directory: `data/sites.json` in the
[`rossdavilla.github.io`](https://github.com/rossdavilla/rossdavilla.github.io) repo lists it
under this repo's `ignore`.

## Conventions

- **The app is served from `site/`**, not the repo root — that is why the directory entry's path
  is `site/`. `python3 -m http.server 4599 --directory site` to run it.
- Data is bundled as a JS global rather than fetched, so the pages also work over `file://`.
  Keep that — it is how it gets demoed without a server.
- Nothing you enter in the quiz leaves the device: no backend, no analytics, no storage. Keep it.
- Mobile-first, light + dark; `site/css/style.css` is the design system for both pages.
- **Voice:** inclusive and gender-neutral throughout, sex-positive, consent-first. The write-ups
  are adapted from *Men's Health* and lightly edited for inclusive language — keep that credit,
  and keep the consent note in the README and on the site.

## Publishing

GitHub Pages serves `main` from the repository root, so a push to `main` is the deploy. Already
listed in `data/sites.json` under the `PSY175` tag.
