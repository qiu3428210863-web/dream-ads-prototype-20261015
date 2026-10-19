# Dream Ads

Responsive creator challenge design demo with video showcases, sequential workflow previews, light/dark themes and a layered studio CTA.

Website: https://qiu3428210863-web.github.io/dream-ads-prototype-20261015/

## Important

This is a fictional challenge and design demonstration, not an official OpenArt registration service. Activity dates and rewards are illustrative. The form saves the draft and video only in the visitor's browser. There is no submission backend. See [commercial readiness](COMMERCIAL-READINESS.md) for outstanding launch requirements and [component guidelines](DESIGN.md) for the visual system.

## Run and verify

Requires Node.js; no package installation is needed.

```sh
npm start
npm run check
```

Preview: http://127.0.0.1:4173/ . Source and static assets live in `dist/`. Tests include local HTML fixtures so they run from a standalone checkout.

## GitHub Pages

`main` contains the maintained project. GitHub Pages publishes the root of `gh-pages`, generated from the committed `dist/` directory. `.nojekyll` preserves static assets. Local review pages are ignored and not published.

After committing website changes on `main`, publish from PowerShell:

```powershell
git push origin main
$pagesCommit = git subtree split --prefix dist
git push origin "${pagesCommit}:refs/heads/gh-pages"
```

The Pages deployment then runs automatically for `gh-pages`. Avoid committing credentials, local form data, environment files or browser recordings. Keep vendor license notices with bundled libraries. Branding and media require the appropriate permissions before commercial use.
