# omegacs.us

Personal site for Joseph Landry, served by GitHub Pages from the `main` branch. Pages runs Jekyll on every push, so a merge to `main` is a deploy.

## Files
- `_layouts/default.html` - the shared page shell: head, site header (Home, Portfolio, Blog), footer.
- `_layouts/post.html` - the blog post layout.
- `index.html` - the home page content, with its margin index.
- `portfolio/index.html` + `_data/projects.yml` - the portfolio. Set `public: true` and `repo:` on a project once its repository is public; the GitHub link then shows on the portfolio and the home page.
- `blog/index.html` - the post list. Posts live in `_posts/`, drafts in `_drafts/` (drafts never publish).
- `assets/site.css`, `assets/site.js` - shared styles and scripts. `assets/home.js` - home page only.
- `data/activity.json` - refreshed nightly by `.github/workflows/activity.yml`.
- `llms.txt` - a plain-text summary for AI readers. Keep it in sync with the pages.
- `CNAME` - the custom domain. Don't delete it or Pages drops the domain.

## Blog posts
Every post goes through `scripts/blogpost.py`, which formats it the same way every time and checks it:

```
python3 scripts/blogpost.py new "Post title" --tags ai,process --description "One sentence."
python3 scripts/blogpost.py format _drafts/post-title.md
python3 scripts/blogpost.py check _drafts/post-title.md
python3 scripts/blogpost.py publish _drafts/post-title.md --date 2026-11-20
```

The "Check posts" workflow runs the same check on every pull request that touches a post.

To preview locally: `jekyll serve --drafts` (Jekyll 3.10, the version GitHub Pages runs).

## Rules for anyone (or any AI) editing this
1. Nothing goes live without Joseph's explicit OK. Draft on a branch and open a PR.
2. Voice: plain, direct, first person. Spaced hyphens ( - ) instead of em dashes. No emoji, no buzzwords, at most one exclamation point.
3. Employer, client and internal tool specifics stay generic or stay out (non-compete and IP). No employer name, client names, internal tool names or screenshots of work systems.
4. Personal projects (Rewire, home lab, game preservation) are his to describe, but don't name specific commercial games without his OK.
5. Simple beats clever. Plain HTML and Markdown, no build tools beyond what GitHub Pages runs.
6. Taglines: commit messages and PR descriptions end with "Maintained with Claude" (not "Generated with Claude Code"). The site footer uses the same wording.
