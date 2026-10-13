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
4. Use **Details & text** for names, chapter labels, reveal settings, and all messages, including the header, footer, and surrounding labels. **Letter** edits the complete letter; separate paragraphs with a blank line. **Photos** gives access to all six independent photo slots, labeled by chapter.
5. Select **Save draft** to save immediately in this browser. Edits also save automatically. Wait for the **Saved in this browser** confirmation. The public template stays unchanged.
6. Select **Preview** to hide the editing outlines. Check the chapters, letter, and photos, then select **Back to editing** if you want more changes.
7. Select **Download gift** to save your personalized birthday website as one HTML file. Open that file in a browser to check it before sharing.

Uploaded photos are cropped and resized in your browser. Portraits use a 3:4 crop; memory photos use square crops. Uploads can be up to 20 MB each.

Each photo has its own upload and crop. Replacing one does not change another chapter’s photo. Desktop and mobile show the same photo for each matching chapter. Older saved drafts keep their existing photos when shared slots are split.

Keep headings and paragraphs short enough to fit the book. The default wording is romantic, so read through every chapter when adapting it for a different recipient.

The birthday greeting shows the recipient's name with gold lettering, constellation rings, and starlight, then continues to the wish automatically after about four seconds. **Let the magic begin** skips ahead. **Read the book** and Escape skip the entrance. Preview and downloaded gifts include the greeting; replaying a wish goes straight to the wish. Reduced-motion preferences skip the animated greeting.

## Drafts and sharing

- Edits and uploaded photos stay in your browser. They are not uploaded to the public demo or written to this repository.
- Your draft is saved automatically when browser storage is available. The public preview always opens the original template. Selecting **Edit your gift** in the same browser restores your draft. Check the editor's save status; if saving is unavailable, download the gift to keep your changes.
- Clearing site data deletes that browser’s draft. A different browser or device will not have your saved draft. Keep a downloaded copy of your finished gift.
- The downloaded HTML includes your words and local artwork and photos. It opens as the gift, without editing controls, and does not read the recipient's saved drafts.
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

The included GitHub Actions workflow rebuilds the HTML, checks the editor and exported gift, and deploys it on pushes to `main`. To enable hosting in your own repository, choose **Settings → Pages → Source → GitHub Actions**, then run the deployment workflow. GitHub Pages is free for public repositories; private repositories require an eligible paid plan. The published Pages website is public even when its source repository is private.

See the [website reference](site/README.md) for file responsibilities and developer checks, and the [design notes](site/DESIGN_NOTES.md) for the visual theme.

wishbound uses original placeholder illustrations inspired by Albedo and Beidou. No official game artwork or audio is included.
