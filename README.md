# wishbound

A Genshin-inspired birthday storybook you can personalize with photos, shared memories, and a letter. It opens with a cinematic Happy Birthday greeting, followed by an animated five-star wish reveal, page turns, and layouts for desktop and mobile.

Originally made as a romantic gift, its messages can be adapted for a partner, a friend, or anyone you want to celebrate.

**[Open the preview and make your gift](https://oppenjayme.github.io/wishbound/)**

## Viewing tips

- Maximize your browser window for the full storybook view.
- **If the book, opening screen, or editor looks too large or does not fit, zoom out in your browser.** Press **Ctrl + −** on Windows/Linux or **Cmd + −** on Mac. Try 90% or 80%, then adjust until it fits comfortably. You can also change the zoom percentage in your browser menu.
- To return to normal zoom, press **Ctrl + 0** on Windows/Linux or **Cmd + 0** on Mac.

The available space depends on your browser window and display scaling, so different laptops and monitors may need different zoom levels. Zooming does not change your gift's content or saved draft.

## Personalize it without code

1. Open the preview and select **Edit your gift**. This opens your own copy at the very first wish screen, even if you were already reading the book. Your saved draft loads only after entering the editor.
2. **Click a name or message** to edit it, then select **Apply text**. Use **View** to switch between the birthday greeting, opening wish, portrait reveal, and storybook. The birthday greeting stays still while editing so you can change its words. Use the book's arrows or chapter dots to visit other chapters.
3. **Click a photo** to upload a JPG, PNG, or WebP image. Adjust its crop, zoom, and position, add a description, and select **Use photo**.
4. Use **Details & text** for names, chapter labels, reveal settings, and all messages, including the header, footer, and surrounding labels. **Letter** edits the complete letter; separate paragraphs with a blank line. **Photos** gives access to five photo slots, with one shared portrait for the opening reveal and Chapter 1, labeled by chapter.
5. Select **Save draft** to save immediately in this browser. Edits also save automatically. Wait for the **Saved in this browser** confirmation. The public template stays unchanged.
6. Select **Preview** to hide the editing outlines. Check the chapters, letter, and photos, then select **Back to editing** if you want more changes.
7. Select **Download gift** to save your personalized birthday website as one HTML file. Open that file in a browser to check it before sharing.

Uploaded photos are cropped and resized in your browser. Portraits use a 3:4 crop; memory photos use square crops. Uploads can be up to 20 MB each.

The opening reveal and Chapter 1 share one portrait and crop. Editing either portrait updates both, so the photograph carried into the book matches its destination. The four memory photos remain independent. Desktop and mobile show the same photo for each matching chapter. Older drafts use their opening portrait for both scenes; if only the Chapter 1 portrait was personalized, that photo is recovered as the shared portrait.

Keep headings and paragraphs short enough to fit the book. The default wording is romantic, so read through every chapter when adapting it for a different recipient.

The birthday greeting shows the recipient's name with gold lettering, constellation rings, and starlight, then continues to the wish automatically after about four seconds. **Let the magic begin** skips ahead. **Read the book** and Escape skip the entrance. Preview and downloaded gifts include the greeting; replaying a wish goes straight to the wish. Reduced-motion preferences skip the animated greeting.

## Drafts and sharing

- Edits and uploaded photos stay in your browser. They are not uploaded to the public demo or written to this repository.
- Your draft is saved automatically when browser storage is available. The public preview always opens the original template. Selecting **Edit your gift** in the same browser restores your draft. Check the editor's save status; if saving is unavailable, download the gift to keep your changes.
- Clearing site data deletes that browser’s draft. A different browser or device will not have your saved draft. Keep a downloaded copy of your finished gift.
- **Download gift** opens a popup with **Allow editing in this gift** selected. Keep it selected to include an Edit button, or uncheck it for a gift with no editor. Both versions include your words, local artwork, and uploaded photos.
- In an editable downloaded gift, **Save changes** stores edits in that browser. Reopening the file restores them without another download. Each gift has its own saved edits, separate from the public template's draft. **Back to gift** returns to viewing your edited gift; **Start over** restores the version embedded in the downloaded file.
- Browser saving does not rewrite the original HTML file. Download an updated copy to share your latest changes or keep a backup. A fresh browser sees the version embedded in the file. Clearing browser data removes saved edits; storage availability and whether a moved file can access its edits depend on the browser.
- Google Fonts and any externally configured image links use the internet. Local font fallbacks work offline, and images uploaded through the editor are embedded in the download.
- **Download gift creates a file, not a new website URL.** The public preview link remains the shared template. To share your personalized gift as a link, publish your own copy with a static website host.
- **Back to template** leaves your own copy and shows the original demo again, while keeping your draft saved. Your edits never change what other visitors see.
- **Start over** restores the sample gift in your browser after confirmation. Download your current version first if you want to keep it.

## Use your own repository

If available, select **Use this template → Create a new repository** on GitHub. Choose its visibility, then make your changes in that separate copy.

To work locally, select **Code → Download ZIP**, extract it, and open:

```text
site/ONE_FILE_PREVIEW.html
```

This portable template includes the editor. You can personalize and download a gift without installing anything. Browser draft storage availability may vary for locally opened files.

The separate `index.html` is useful when editing the source. For complete HTML downloads from a local file, use `ONE_FILE_PREVIEW.html` or the live preview.

## For developers

The website uses plain HTML, CSS, and JavaScript. Edit `story-config.js` for default content, or the source files for layout and behavior. After source changes, run this from the repository root, where `package.json` is located:

```sh
npm run preview:build
```

This requires Node.js but no dependency installation. It regenerates the portable template with the editor included.

The included GitHub Actions workflow rebuilds the HTML, checks the editor, exported gifts, and source/portable book layouts, and deploys it on pushes to `main`. To enable hosting in your own repository, choose **Settings → Pages → Source → GitHub Actions**, then run the deployment workflow. GitHub Pages is free for public repositories; private repositories require an eligible paid plan. The published Pages website is public even when its source repository is private.

See the [website reference](site/README.md) for file responsibilities and developer checks, and the [design notes](site/DESIGN_NOTES.md) for the visual theme.

wishbound uses original placeholder illustrations inspired by Albedo and Beidou. The wish uses the supplied five-star pull audio. The sunset ending uses the supplied game screenshot, edited to add a seated couple.

## Optional music and backgrounds

In **Edit your gift** mode, use **♫ Music & background** in the editor toolbar to choose a local soundtrack, set its volume, and choose whether it starts at the **Portrait reveal** or **Book opening**. Music fades in after interaction; it never starts on the initial page load. The portrait has its own play/pause button, and the book keeps the top-bar controls. If the browser blocks playback, press **Play music**. Pausing stays respected during scene changes and replay. The same track continues from the portrait into the book.

1. Select **Edit your gift**, then open **Music & background** in the editor toolbar. It is available while editing the entrance or the book.
2. Choose an MP3, M4A, OGG, WAV, or WebM audio file smaller than 15 MB.
3. Set **Start music at**, adjust **Volume**, and leave **Enable background music** checked.
4. Replay the wish to check the portrait start, or choose book opening to keep the wish silent. Playback also works while editing: use **View → Storybook** to test the book start. Text edits do not stop the music.
5. Use **Preview** to test playback, then return to editing to download your gift. The soundtrack, start scene, volume, and background are included in the HTML file.

Adding, replacing, removing, and configuring music is available only while editing. Preview and gift viewing keep play/pause controls for the selected soundtrack; they cannot open the upload/settings panel.

Settings and uploaded files stay in this browser when storage is available; they do not change the public template. Sharing the downloaded gift also shares its music. Include audio you have permission to redistribute. No soundtrack is bundled by default.

For a default soundtrack in your own repository, put a file at `site/assets/our-song.mp3` and edit the `music` section in `site/story-config.js`:

```javascript
"music": {
  "src": "assets/our-song.mp3",
  "startAt": "portrait",
  "volume": 35,
  "fadeMs": 1200,
  "loop": true,
  "enabled": true
},
```

Use `"book"` for `startAt` to begin on entering or turning the book. `volume` is 0–100; `fadeMs` is 0–5000 milliseconds. An empty `src` leaves the soundtrack optional. Visitor choices override these defaults. Run `npm run preview:build` after changing the file or settings. Local audio under `assets/` is embedded in the portable preview, subject to the 15 MB limit. HTTPS tracks remain external in the preview; gift downloads try to embed them and require the audio host to allow browser access. For reliable offline sharing, upload the track through **Music & background** or use a local asset.

Music follows the active scene while editing. Returning to the birthday greeting or opening wish stops it; a book-only track stays silent in the portrait editor. Starting Preview stops editor playback and begins a fresh soundtrack at the selected portrait or book moment. A track auditioned in settings stops on closing the panel if its selected scene is not active. Editing text within the book keeps its background music playing, and normal portrait-to-book playback remains continuous.

The **Make your wish** button plays the supplied `assets/five-star-pull.m4a` once, restarting it for each replay. The descending star takes 1.3 seconds less than the previous baseline: portrait reveal begins at 7.395 seconds and the canvas finishes at 10.355 seconds. The pull sound finishes naturally even if the canvas finishes first. Background music stays quiet until the pull sound finishes, then fades in for the selected scene. Skip, Escape, entering the book, and scene cancellation stop and reset the pull sound. Reduced motion skips this long sound along with the animated pull. The portable preview and downloaded gifts include it. Edit `wishSound.src`, `wishSound.volume` (0–100), or `wishSound.enabled` in `site/story-config.js` to replace, adjust, or disable it, then rebuild.

The sealed letter opens with a brief wax-seal release and paper unfolding. Editable greetings, paragraphs, and signatures remain normal readable text. Close or Escape works immediately; reduced motion shows the letter without the animation.

The final chapter features a seated couple at sunset with a constellation that lights up and draws its connecting lines. Names use `recipient` and `signoff`; the closing message uses `copy.and_we_still_have_so`. Click those words while editing or use Details & text to personalize them. The artwork is `site/assets/sunset-couple.png`, based on the supplied screenshot with a short-haired girl and her companion added. The complete scene is embedded in the portable preview and downloaded gifts. Animation runs when the final chapter opens and is still with reduced motion.

At the final chapter, **Close the book** folds the pages and cover shut, fades the soundtrack out over two seconds before stopping it, and offers **Replay from the beginning**. Replay starts with the birthday greeting and wish while keeping personalized words and photos. Phones use a short cover transition; reduced motion closes immediately. The ending button labels and closing note are editable in Details & text through `presentation.endingCloseLabel`, `endingReplayLabel`, and `endingMessage`.

The public template includes a small **Made by OppenJayme** link to the creator profile. In Download gift, **Include the Made by OppenJayme link** is checked by default; uncheck it to omit the credit from your personal file. This does not change the public template. Editable gifts remember whether their embedded credit was included and can add or remove it again on the next download.

The public template uses its own sample wording for the birthday greeting, wish, chapters, captions, letter, and ending. Existing field names remain compatible with older drafts: entering Edit your gift restores saved personal words, and previously downloaded gifts retain their embedded text. Edit story-config.js and the presentation defaults in gift-state.js to change future template wording.
