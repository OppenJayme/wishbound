# wishbound — website reference

For downloading, previewing, personalizing, and sharing the gift, start with the [main README](../README.md). This reference covers deeper edits and optional developer checks.

## File responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Page structure, entrance, and dialogs. |
| `story-config.js` | Default names, photo paths, letter, and story copy. |
| `gift-state.js` | Editable field bindings, validation, and story synchronization. |
| `gift-editor.js` | Text and image controls, local drafts, cropping, and HTML export. |
| `gift-editor.css` | Editor controls and editing outlines. |
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

- Keep seven `chapterNames` and five `photos` entries (plus `reveal.portrait`) to match the current layout.
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
npm run test:editor
npm run test:layout
```

The preview must be rebuilt before checking the portable version. `test:browser` covers book navigation and layout; `test:intro` covers the entrance, replay, and cancellation.

The scripts currently launch Chrome from `C:/Program Files/Google/Chrome/Application/chrome.exe`. Update `executablePath` in `book-qa.cjs` and `intro-qa.cjs` for another installation. For `editor-qa.cjs` and `viewport-qa.cjs`, set `CHROME_PATH` to your Chrome executable. Screenshots are written to the ignored `qa/` folder.

For portrait landing alignment and interruption cleanup:

```sh
node intro-qa.cjs --journey --alignment
```

## Design reference

See [DESIGN_NOTES.md](DESIGN_NOTES.md) for typography, the alchemy and nautical theme, book behavior, entrance motion, and accessibility considerations.

## Gift editor and export

Text fragments and photos are bound through `data-story-text` and `data-story-image`. Each photo slot is independent. The editor synchronizes only matching desktop/mobile chapter views; the opening portrait has its own slot. Surrounding labels are editable through `presentation` fields and **Details & text**. Older three-photo drafts migrate without losing uploads. Keep these bindings when adding layouts.

Public-template drafts use IndexedDB, scoped to the current website path. Editable downloaded gifts use a random gift ID in a separate key namespace; re-exporting an editable gift preserves that ID. Each new gift downloaded from the public template receives a new ID. Photos are decoded, cropped, and re-encoded as JPEGs in the browser; uploads are not sent to a server.

The preview builder marks its inline scripts with `data-wishbound-source`. HTML export uses the initial template and replaces its story configuration with safely serialized values. The download dialog can include editing controls with `WISHBOUND_GIFT_EDITABLE`, or strip them for a viewing-only gift. Both set `WISHBOUND_GIFT`. Editable gifts restore their own saved edits on opening; viewing-only gifts skip draft restoration. Saving only writes to browser storage, while downloading an updated copy embeds the latest content in the HTML file. Preserve these script markers when changing the builder.

`test:editor` checks text editing, crop positioning, photo replacement, draft restoration and isolation, reset, preview, and exported HTML. `test:layout` checks all seven chapters in both source and portable HTML at ten laptop, monitor, and phone sizes, including short screens; it fails on clipped book content or keepsakes covering content. Website scrolling is allowed. The GitHub Pages workflow runs this check before deploying and saves screenshots as an Actions artifact.

The opening editor controls move inside the intro dialog while it is open so native modal focus remains usable. On the public template, saved drafts are read into a detached copy and applied only on entering edit mode; returning to the template restores the defaults and retains the draft. In an editable downloaded gift, returning to the gift keeps the current edited content, and resetting restores that file’s embedded defaults.

## Visitor soundtrack and scenery

`visitor-media.js` + `visitor-media.css` add independent public music and background controls. Browser-only settings use a separate IndexedDB/localStorage namespace and do not modify the template or the gift editor's draft. The custom audio/image (up to 15 MB each) is embedded in the downloaded HTML via `window.WISHBOUND_MEDIA.exportToDocument` during gift export. Audio begins after an explicit click to enter or turn the book, subject to browser policy. No copyrighted soundtrack is bundled; the public site can use a permitted `assets/liyue-theme.mp3` file if you supply it. When modifying the portable builder, keep `visitor-media.js` marked with `data-wishbound-source`.
