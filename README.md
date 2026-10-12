# wishbound

A Genshin-inspired birthday storybook you can personalize with photos, shared memories, and a letter. It includes an animated five-star wish reveal, page turns, and layouts for desktop and mobile.

Originally made as a romantic gift, the sample messages can be rewritten for a partner, a friend, or anyone you want to celebrate.

## 1. Get your copy

- **To create your own GitHub repository:** select **Use this template → Create a new repository**, if that button is available. Choose **Private** if you want your personal source files hidden on GitHub.
- **To edit on your computer:** select **Code → Download ZIP**, then extract the ZIP. If you created your own repository first, download from that copy.

Keep your personal photos and messages in your own copy of the project.

## 2. Open the website

Inside the extracted project, open this folder:

```text
albedo-beidou-birthday-codex-v4/birthday_codex_albedo_beidou/
```

Double-click `index.html`. You do not need Node.js, npm, or a build step to view it.

Select **Make your wish** to play the entrance, then **Open your story** to enter the book. **Read the book** skips the entrance.

## 3. Make it personal

Open `story-config.js` in that same folder using a text or code editor. Edit the existing values; keep the property names, quotes, brackets, and commas in place.

| What to personalize | Where to edit |
| --- | --- |
| Recipient and sender names | `recipient` and `signoff` |
| Portrait and its description | `reveal.portrait` and `reveal.portraitAlt` |
| Reveal messages | `reveal.title`, `reveal.subtitle`, and `reveal.eyebrow` |
| Three memory photos | `photos` |
| Letter | `letter.greeting` and `letter.paragraphs` |
| Chapter labels | `chapterNames` — keep seven entries |
| Story headings, messages, and captions | `copy` |

The sample text is romantic. For a friend or another recipient, update the letter and chapter messages as well as the names. Keep paragraphs short enough to fit the desktop pages.

### Replace the photos

Put one portrait and three memory photos in the website's `assets/` folder. Use simple filenames such as `portrait.jpg` and `memory-1.jpg`. A vertical 3:4 portrait fits the reveal well.

Update the existing portrait values inside `reveal`:

```javascript
"portrait": "assets/portrait.jpg",
"portraitAlt": "A portrait of Alex",
```

Then update the existing `photos` array:

```javascript
"photos": [
  "assets/memory-1.jpg",
  "assets/memory-2.jpg",
  "assets/memory-3.jpg"
],
```

These snippets replace the matching entries in `story-config.js`, not the entire file. Use paths relative to the website folder, and match filename spelling and capitalization exactly.

Save your changes and refresh `index.html`. Check every chapter, the letter, and the portrait reveal before sharing. Set `reveal.enabled` to `false` if you prefer to start directly at the book.

## 4. Share your gift

### Share a website link with GitHub Pages

1. Upload or commit your edited files to your own GitHub repository, keeping the project folders in place.
2. Open **Settings → Pages** and choose **GitHub Actions** under **Build and deployment → Source**.
3. Open **Actions → Deploy birthday site to GitHub Pages → Run workflow**, and run it on `main`.
4. Once the deployment succeeds, open its website link and check the gift before sending it.

The included workflow also deploys changes pushed to `main`. GitHub Pages is free for public repositories; private repositories require an eligible paid plan. A private repository hides the GitHub source, but the published Pages website and its photos and messages are public.

### Share one HTML file

Install Node.js if you want to generate the portable version. Open a terminal at the **project root** — the folder containing `package.json` — and run:

```sh
npm run preview:build
```

No `npm install` is needed. The command updates `ONE_FILE_PREVIEW.html` inside the website folder. Open that generated file to check it, then share it.

**Rebuild after every change you want included in the portable gift.** Local SVG, JPG/JPEG, PNG, and WebP images are embedded. Google Fonts and external HTTPS image links still use the internet; local font fallbacks are available offline.

## Common fixes

| Problem | What to check |
| --- | --- |
| A photo is missing | Put it in `assets/`, check its extension and capitalization, and use a path such as `assets/portrait.jpg`. |
| Changes do not appear | Save the source file and refresh the browser. If viewing `ONE_FILE_PREVIEW.html`, rebuild it first. |
| The story stops working after an edit | Check for a missing quote, comma, or bracket in `story-config.js`. |
| Text spills off a page | Shorten the heading or paragraph, then check desktop and phone layouts. |

## Further customization

See the [website reference](albedo-beidou-birthday-codex-v4/birthday_codex_albedo_beidou/README.md) for file responsibilities and optional developer checks, or the [design notes](albedo-beidou-birthday-codex-v4/birthday_codex_albedo_beidou/DESIGN_NOTES.md) for the visual theme.

wishbound uses plain HTML, CSS, and JavaScript with original placeholder illustrations inspired by Albedo and Beidou. No official game artwork or audio is included.
