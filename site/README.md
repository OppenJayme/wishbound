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
| `app.js` | Chapters, page turns, closing the book, and replay from the beginning. |
| `intro.js` | Entrance state, portrait flight, replay, skipping, and cleanup. |
| `wish.js` | Canvas clouds, comet, arrival timing, and the one-shot pull sound. |
| `visitor-media.js` / `visitor-media.css` | Edit-only soundtrack/scenery settings, scene playback, audio fades, and export. |
| `styles.css` | Book geometry, layout, and responsive behavior. |
| `editorial.css` | Typography, animated letter, sunset constellation, ending controls, and creator credit. |
| `voyage.css` | Map background, entrance, and portrait styling. |
| `assets/` | Local photos and original placeholder illustrations. |
| `ONE_FILE_PREVIEW.html` | Generated portable version; rebuild after source edits. |
| `DESIGN_NOTES.md` | Visual theme and interaction principles. |

Keep the current source-folder path unless you also update the preview builder, deployment workflow, and browser-check scripts that reference it.

## Content and image constraints

- Keep seven `chapterNames` and the five legacy `photos` entries. `photos.3` aliases `reveal.portrait`, giving five editable slots: one shared portrait and four memory photos.
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
npm run test:media
npm run test:ending
```

The preview must be rebuilt before checking the portable version. `test:browser` covers book navigation and layout; `test:intro` covers the entrance, replay, and cancellation.

The scripts currently launch Chrome from `C:/Program Files/Google/Chrome/Application/chrome.exe`. Update `executablePath` in `book-qa.cjs` and `intro-qa.cjs` for another installation. For `editor-qa.cjs`, `viewport-qa.cjs`, `media-qa.cjs`, and `ending-qa.cjs`, set `CHROME_PATH` to your Chrome executable. Screenshots are written to the ignored `qa/` folder.

For portrait landing alignment and interruption cleanup:

```sh
node intro-qa.cjs --journey --alignment
```

## Design reference

See [DESIGN_NOTES.md](DESIGN_NOTES.md) for typography, the alchemy and nautical theme, book behavior, entrance motion, and accessibility considerations.

## Gift editor and export

Text fragments and photos are bound through `data-story-text` and `data-story-image`. The opening reveal and Chapter 1 share `reveal.portrait` and `reveal.portraitAlt`. The legacy `photos.3` and `photoAlts.3` paths alias that shared portrait, so editing either view updates both and the animated photograph matches its book destination. The other four photo slots remain independent. Older drafts prefer the opening portrait, with a fallback to a personalized Chapter 1 portrait if the opening still uses the default placeholder. Surrounding labels are editable through `presentation` fields and **Details & text**. Older three-photo drafts migrate without losing uploads. Keep these bindings when adding layouts.

Public-template drafts use IndexedDB, scoped to the current website path. Editable downloaded gifts use a random gift ID in a separate key namespace; re-exporting an editable gift preserves that ID. Each new gift downloaded from the public template receives a new ID. Photos are decoded, cropped, and re-encoded as JPEGs in the browser; uploads are not sent to a server.

The preview builder marks its inline scripts with `data-wishbound-source`. HTML export uses the initial template and replaces its story configuration with safely serialized values. The download dialog can include editing controls with `WISHBOUND_GIFT_EDITABLE`, or strip them for a viewing-only gift. Both set `WISHBOUND_GIFT`. Editable gifts restore their own saved edits on opening; viewing-only gifts skip draft restoration. Saving only writes to browser storage, while downloading an updated copy embeds the latest content in the HTML file. Preserve these script markers when changing the builder.

`test:editor` checks text editing, crop positioning, photo replacement, draft restoration and isolation, reset, preview, and exported HTML. `test:layout` checks all seven chapters in both source and portable HTML at ten laptop, monitor, and phone sizes, including short screens; it fails on clipped book content or keepsakes covering content. Website scrolling is allowed. The GitHub Pages workflow runs this check before deploying and saves screenshots as an Actions artifact.

The opening editor controls move inside the intro dialog while it is open so native modal focus remains usable. On the public template, saved drafts are read into a detached copy and applied only on entering edit mode; returning to the template restores the defaults and retains the draft. In an editable downloaded gift, returning to the gift keeps the current edited content, and resetting restores that file’s embedded defaults.

## Visitor soundtrack and scenery

`visitor-media.js` and `visitor-media.css` provide music and scenery settings independently of the gift editor draft. Enter **Edit your gift** and choose a soundtrack in **Music & background** on the editor toolbar, then select **Portrait reveal** or **Book opening**. The portrait has a play/pause control inside its modal; book controls remain in the top bar. No audio plays on page load. A wish click primes the track silently for a delayed portrait reveal, which fades it in. A book-opening click starts book-only music. Browsers may require another Play click; playback failures appear beside the portrait control and in settings. Manual pause survives scene changes and replay.

`story-config.js` has a `music` object: `src` (empty, local `assets/` path, or HTTPS URL), `startAt` (`portrait` or `book`), `volume` (0–100), `fadeMs` (0–5000), `loop`, and `enabled`. Visitor preferences override defaults. The default source is empty; the existing optional hosted `assets/liyue-theme.mp3` fallback remains available. No looping background soundtrack is bundled; the supplied one-shot wish pull sound is included separately.

Uploads up to 15 MB are stored in a separate scoped IndexedDB/localStorage namespace. Audio, start scene, enabled state, volume, and scenery are embedded during gift export via `window.WISHBOUND_MEDIA.exportToDocument`. Non-embedded configured tracks are fetched for export; failure surfaces in the download dialog instead of silently producing an incomplete gift. Upload the track directly if a remote host prevents access.

The builder embeds local MP3, M4A, OGG, WAV, and WebM assets as well as images. Rebuild with `npm run preview:build`; keep `visitor-media.js` marked with `data-wishbound-source`. Use only audio you may share. See the root README for setup steps.

Run `npm run test:media` after soundtrack changes. It uses a generated test tone to check upload and restoration, both start scenes, silent priming through the full wish, fades, pause/replay, exported audio, phone controls, and blocked playback. It requires the same Playwright and Chrome setup as the other browser checks.

Music and scenery settings are restricted to `giftMode === "draft"`. The settings button moves into the editor toolbar so it remains usable inside the opening modal. `wishbound:mode` synchronizes mode changes; a body attribute observer covers other mode updates. Leaving editing closes settings and disables uploads and configuration inputs. Handlers also check editing mode. Preview, template viewing, and gifts retain only play/pause controls when a soundtrack exists.

Soundtrack playback also works while editing: switching View to the book starts the selected track, and editing text does not pause it. Re-enabling background music or choosing a start scene clears an earlier manual pause; normal replay continues to respect pause.

Music follows the active scene while editing. Returning to the birthday greeting or opening wish stops it; a book-only track stays silent in the portrait editor. Starting Preview stops editor playback and begins a fresh soundtrack at the selected portrait or book moment. A track auditioned in settings stops on closing the panel if its selected scene is not active. Editing text within the book keeps its background music playing, and normal portrait-to-book playback remains continuous.

The **Make your wish** button plays the supplied `assets/five-star-pull.m4a` once, restarting it for each replay. The descending star takes a little over one second: the portrait appears at about 7.4 seconds and the canvas finishes at about 10.4 seconds. The pull sound finishes naturally even if the canvas finishes first. Background music stays quiet until the pull sound finishes, then fades in for the selected scene. Skip, Escape, entering the book, and scene cancellation stop and reset the pull sound. Reduced motion skips this long sound along with the animated pull. The portable preview and downloaded gifts include it. Edit `wishSound.src`, `wishSound.volume` (0–100), or `wishSound.enabled` in `site/story-config.js` to replace, adjust, or disable it, then rebuild.

The final chapter features a seated couple at sunset with a constellation that lights up and draws its connecting lines. Names use `recipient` and `signoff`; the closing message uses `copy.and_we_still_have_so`. Click those words while editing or use Details & text to personalize them. The artwork is `site/assets/sunset-couple.png`, based on the supplied screenshot with a short-haired girl and her companion added. The complete scene is embedded in the portable preview and downloaded gifts. Animation runs when the final chapter opens and is still with reduced motion.


## Letter, closing, and replay

The letter retains editable HTML while a decorative seal splits and paper unfolds. Close and Escape work during the animation; reduced motion shows the text immediately. The final chapter includes the sunset constellation and **Close the book**. Closing returns to the cover and fades background music out over two seconds, then offers **Replay from the beginning**. This restarts the birthday greeting and wish without resetting story content. The existing **Replay the wish** control repeats just the wish and keeps the reading position.

Ending labels and the closing note use `presentation.endingCloseLabel`, `endingReplayLabel`, and `endingMessage`. `test:ending` verifies closing, replay, music fading, and retained personalization on desktop and phone, including reduced motion. CI runs this and `test:media` alongside editor and layout checks before deploying.

## Creator credit and public sample text

The public template links to OppenJayme in its footer. The **Download gift** dialog includes a checked **Include the Made by OppenJayme link** option. Export removes the credit if unchecked, while the public template stays unchanged. Editable exported gifts initialize this option from their embedded credit, allowing it to be restored or removed on re-export.

Public sample wording is defined in `story-config.js` and the `presentation` defaults in `gift-state.js`; the static fallback text in `index.html` should match. Keep field names stable when rewriting defaults. Existing drafts restore their own text in the editor, and previously exported gifts keep the words embedded in their file.
