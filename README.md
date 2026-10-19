# Dream Ads

Responsive creator challenge design demo with video showcases, sequential workflow previews, light/dark themes and a layered studio CTA.

Website: https://qiu3428210863-web.github.io/dream-ads-prototype-20261015/

## Important

This is a fictional challenge and design demonstration, not an official OpenArt registration service. Activity dates and rewards are illustrative. The form saves the draft and video only in the visitor's browser. There is no submission backend. See [commercial readiness](COMMERCIAL-READINESS.md) for outstanding launch requirements and [component guidelines](DESIGN.md) for the visual system.

## Loading performance

The initial hero shows a preloaded local poster before video playback. Background clips and all card posters are served locally; lower-page images and workflow media are deferred. See [loading optimization and verification](docs/startup-performance.md) for file sizes and fallback coverage.

## Run and verify

Requires Node.js; no package installation is needed.

```sh
npm start
npm run check
```

Preview: http://127.0.0.1:4173/ . Source and static assets live in `dist/`. Tests include local HTML fixtures so they run from a standalone checkout.

## GitHub Pages

`main` contains the maintained project. GitHub Pages publishes the root of `gh-pages`, generated from the committed `dist/` directory. `.nojekyll` preserves static assets. Local review pages are ignored and not published.

After every completed and verified website change, commit the intended files on `main` and publish immediately from PowerShell:

```powershell
./tools/publish-pages.ps1
```

The script reruns checks, pushes both branches, waits for the exact Pages build and verifies the public HTML. See [mobile carousel diagnosis](docs/mobile-carousel-fix.md) for the latest touch regression coverage. Avoid committing credentials, local form data, environment files or browser recordings. Keep vendor license notices with bundled libraries. Branding and media require the appropriate permissions before commercial use.
