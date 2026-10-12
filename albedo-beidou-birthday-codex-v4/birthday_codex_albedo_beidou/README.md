# wishbound — website reference

For downloading, previewing, personalizing, and sharing the gift, start with the [main README](../../README.md). This reference covers deeper edits and optional developer checks.

## File responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Page structure, entrance, and dialogs. |
| `story-config.js` | Recipient and sender names, photo paths, letter, and story copy. |
| `app.js` | Chapter rendering, navigation, and book page turns. |
| `intro.js` | Entrance state, portrait flight, replay, skipping, and cleanup. |
| `wish.js` | Canvas clouds, comet, and arrival sequence. |
| `styles.css` | Book geometry, layout, and responsive behavior. |
| `editorial.css` | Typography and letter styling. |
| `voyage.css` | Map background, entrance, and portrait styling. |
| `assets/` | Local photos and original placeholder illustrations. |
| `ONE_FILE_PREVIEW.html` | Generated portable version; rebuild after source edits. |
| `DESIGN_NOTES.md` | Visual theme and interaction principles. |

Keep the current source-folder path unless you also update the preview builder, deployment workflow, and browser-check scripts that reference it.

## Content and image constraints

- Keep seven `chapterNames` and three `photos` entries to match the current layout.
- Use descriptive `reveal.portraitAlt` text for your replacement portrait.
- Keep desktop headings and paragraphs short enough to fit the pages.
- Local image paths are relative to this folder. Use exact filename capitalization.
- The portable builder embeds local SVG, JPG/JPEG, PNG, and WebP assets with simple filenames. External HTTPS images remain external.
- Google Fonts supplies EB Garamond and Source Serif 4; local font fallbacks are used when unavailable.

## Interaction checks

After changes to the layout or animation, check:

- The entrance, portrait reveal, transition into the book, replay, and skip controls.
- Cover opening, repeated next/previous turns, and chapter selections.
- The letter's open/close controls and Escape.
- Left/right keyboard navigation and mobile swipes.
- Readability on desktop and phone, including longer custom text.
- Reduced motion and interruptions such as resizing during the portrait flight.
- The rebuilt portable version, including its photos.

## Optional browser-check scripts

These scripts require Node.js, npm, and Google Chrome. Run the commands from the **repository root**, where `package.json` is located:

```sh
npm install
npm run preview:build
npm run test:browser
npm run test:intro
```

The preview must be rebuilt before checking the portable version. `test:browser` covers book navigation and layout; `test:intro` covers the entrance, replay, and cancellation.

Both scripts currently launch Chrome from `C:/Program Files/Google/Chrome/Application/chrome.exe`. Update `executablePath` in `book-qa.cjs` and `intro-qa.cjs` for another installation. Screenshots are written to the ignored `qa/` folder.

For portrait landing alignment and interruption cleanup:

```sh
node intro-qa.cjs --journey --alignment
```

## Design reference

See [DESIGN_NOTES.md](DESIGN_NOTES.md) for typography, the alchemy and nautical theme, book behavior, entrance motion, and accessibility considerations.
