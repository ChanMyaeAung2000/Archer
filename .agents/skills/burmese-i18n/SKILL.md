---
name: burmese-i18n
description: Design and implement Burmese-aware localization in multilingual interfaces, especially English/Burmese React UIs, with language-specific typography, spacing, wrapping, and layout validation. Use when adding Burmese translations, locale switching, or UI styling that must support Myanmar script; do not use for translation-only tasks with no interface behavior.
---

# Burmese-aware i18n

Treat Burmese as a distinct typographic mode, not as English text rendered through the same styles. The selected locale must influence both translated content and presentation.

## Core requirements

- Keep translation content separate from components. Use the existing i18n layer and translation keys rather than inline locale conditionals or duplicated markup.
- Make the active locale observable at the document root, including a correct `lang` value such as `en` or `my`. Use the locale as the source of truth for language-specific styling.
- Do not apply one hard-coded `line-height` to every locale. Burmese glyphs and combining marks need room above and below the baseline. Prefer the selected font's natural metrics (`line-height: normal`) where it renders well; otherwise use a Burmese-specific, larger line-height token and verify it visually.
- Use separate typography tokens for English and Burmese: font family, font size adjustments when necessary, line height, letter spacing, control height, and text wrapping behavior. Do not force Burmese to imitate English metrics.
- Preserve readable wrapping. Avoid fixed heights for text-bearing elements, truncating Burmese labels, aggressive `overflow: hidden`, and `whitespace-nowrap` unless the content is intentionally short and tested in both locales.
- Let buttons, inputs, cards, navigation items, table rows, and dialogs grow with their content. Use minimum dimensions instead of fixed dimensions when text length can vary.
- Test mixed-script strings, not only fully Burmese paragraphs. A Burmese label may contain English product names, numbers, punctuation, or dates and can have different wrapping needs.

## Selective translation and terminology

- Do not translate every English term into Burmese. Translate the surrounding meaning and user guidance, while preserving technical terms, product/domain terms, acronyms, brand names, code, URLs, email addresses, and widely understood UI terms when English is clearer for the target audience.
- Terms such as `freelancer`, `client`, `API`, `UI`, `dashboard`, `login`, `profile`, and `email` may remain in English when they are established in the product vocabulary. Treat this as a deliberate glossary decision, not an accidental fallback.
- Keep the chosen term consistent across navigation, headings, buttons, validation messages, notifications, and help text. Do not alternate between an English term, a Burmese transliteration, and a Burmese paraphrase for the same concept without a clear distinction.
- Prefer natural mixed-language Burmese UI copy over awkward word-for-word translations. Burmese should carry the sentence structure and explanation; English can remain for recognizable technical or interface vocabulary.
- Preserve placeholders, interpolation variables, keyboard shortcuts, file extensions, and API field names exactly. Translate only the human-readable text around them.
- When a term may be unfamiliar to users, introduce a Burmese explanation on first use while retaining the canonical English term for later consistency.

## Implementation guidance for React/Tailwind apps

1. Inspect the current i18n setup, locale shape, font loading, global CSS, and shared UI primitives before changing individual screens.
2. Add or extend locale-aware root classes or data attributes, for example `html[data-locale="my"]`, and derive typography from that state. Keep the mechanism centralized rather than scattering `isMyanmar` checks through components.
3. Define semantic typography tokens for body text, labels, buttons, headings, captions, and form controls. Give Burmese overrides only where the rendering requires them; do not make every Burmese element arbitrarily larger.
4. Make shared primitives responsive to content. Check line wrapping, vertical alignment, focus states, icon alignment, and clickable area after Burmese text is inserted.
5. Keep localization behavior independent from domain logic. Translation keys, locale persistence, fallback behavior, and server/API values should remain compatible with the existing app contract.

Example CSS shape (adapt names to the project):

```css
:root {
  --font-ui: "Inter", system-ui, sans-serif;
  --leading-body: normal;
  --leading-control: 1.35;
}

html[data-locale="my"] {
  --font-ui: "Noto Sans Myanmar", "Myanmar Text", sans-serif;
  --leading-body: 1.65;
  --leading-control: 1.55;
}

body {
  font-family: var(--font-ui);
  line-height: var(--leading-body);
}

button,
input,
textarea,
select {
  line-height: var(--leading-control);
}
```

The values above are starting points, not universal constants. Prefer `normal` when the chosen Burmese font provides good metrics, and tune by component after visual inspection.

## Font and rendering checks

- Prefer a font with Myanmar coverage and good shaping. Confirm that the actual loaded font contains Burmese glyphs; a fallback font can change metrics unexpectedly.
- Do not assume `font-size`, `line-height`, or vertical centering that looks correct in English will look correct in Burmese.
- Use browser rendering to inspect combining marks, stacked glyphs, punctuation, numerals, and mixed-script labels at narrow and wide widths.
- Check both the initial locale and switching locale at runtime. The layout must update without stale root attributes or styles.
- Include loading, empty, error, and validation states in the visual check because short messages often expose the tightest typography constraints.

## Review checklist

- [ ] Translation keys and fallback behavior are correct.
- [ ] The document `lang` and locale-specific styling update together.
- [ ] Burmese text is not constrained by a single English line-height.
- [ ] Shared controls can grow vertically and wrap safely.
- [ ] No Burmese text is clipped, overlapped, or vertically misaligned.
- [ ] English remains visually stable after Burmese-specific rules are added.
- [ ] The relevant type check/build and a focused visual or browser smoke check pass.
