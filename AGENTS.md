# Lenremont landing rules

Rules snapshot: @lenremont/landing-kit 0.3.1.

- Build one static Astro landing inside the single `#hop-landing` root.
- Prefix project classes with `lr-`; use classes for CSS and `data-*` hooks for JavaScript.
- Keep all own selectors explicitly scoped by `#hop-landing`.
- Put SCSS in `src/styles`; do not add component-scoped styles.
- Connect behavior through `src/scripts/landing.js`; do not place behavior scripts in section components or create browser globals.
- Use vanilla JavaScript. Add third-party frontend libraries only as explicitly versioned CDN tags in `LandingLayout.astro`.
- Store project media in `public/media` and use local paths during development.
- Run `npm run quality` before handing off a change.
- Do not add WordPress export, credentials, publication configuration, or plugin code in this version.

Read `docs/MASTER_DEVELOPMENT_PROMPT.md` before substantial landing work.
