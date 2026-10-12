# wishbound — design notes

wishbound presents a birthday gift as an illustrated keepsake. The book is the main reading surface; the entrance introduces the recipient before leading into the story. Sample content can be adapted for a partner, a friend, or another birthday celebrant.

## Visual theme

The theme combines celestial alchemy and nautical adventure, inspired by Albedo and Beidou:

- Parchment, diagrams, stars, and refined gold details suggest an alchemist's journal.
- Deep navy and teal, crimson accents, compass motifs, and sea charts suggest a captain's log.
- The cover and opening pages carry the strongest decorative motifs.
- Reading pages use quieter backgrounds so messages and photographs remain the focus.

The SVG illustrations are original placeholders. The coastal chart is an imagined setting rather than a reproduction of an in-game map.

## Typography

- **Titles:** EB Garamond for display headings and short italic notes.
- **Body:** Source Serif 4 for paragraphs, with darker ink and comfortable line spacing.
- **Controls:** the system sans-serif stack for navigation and utility labels.
- **Fallback:** Georgia for serif text when the web fonts are unavailable.

Letters use a left-aligned salutation, spaced paragraphs, a restrained header, and a separate sender line. Body text should remain readable over the paper textures.

## Book layout

The desktop layout presents a large open book with a leather binding, paper edges, a gutter, and a bookmark. The cover behaves as a rigid surface. Interior page turns use segmented CSS transforms to create a continuous bend with moving light and shadow.

Resting pages remain selectable HTML. Decorative copies are used during turns. Chapter selection should follow the latest navigation request without leaving an incomplete transition.

On smaller screens, the book uses readable single pages rather than a scaled-down desktop spread. Visible previous and next controls accompany horizontal swipe navigation, while vertical gestures continue scrolling.

## Entrance and portrait transition

The wish begins with a cloud aperture, followed by a blue comet that turns gold before arriving at the portrait. Frame lighting, a constellation backdrop, and five stars introduce the recipient.

Selecting **Open your story** carries the portrait toward the book and settles it into the first spread. The reveal and chapter use the same configured image. The transition measures the destination image so the floating portrait can hand off at the same visible position and size.

Replaying from a later chapter preserves the reading position and uses a receding portrait rather than landing on a different page. Skipping, Escape, resizing during the transition, and reduced-motion changes remove the temporary floating layers.

## Motion implementation

The entrance uses Canvas 2D for projected clouds, comet geometry, and trails. Cloud lighting is prepared on offscreen canvases and reused during the animation. Pixel density is capped to limit rendering cost.

The portrait flight uses the Web Animations API. The book uses CSS transforms. The frame loop ends after the reveal or when the sequence is cancelled. These effects work without an external animation runtime or WebGL dependency.

## Accessibility and controls

- Provide visible navigation alongside keyboard and swipe controls.
- Keep reading text selectable and photo alternative text descriptive.
- Respect `prefers-reduced-motion`; simplify the reveal and remove the portrait flight.
- Support Escape for dismissing the letter and skipping the entrance.
- Isolate book controls while the entrance is active.
- Avoid autoplay audio and decoration that blocks controls.

When replacing text or photos, check both desktop and phone layouts. Longer headings and paragraphs can overflow the fixed desktop pages; adjust the wording or layout together.

## Customization

Use `story-config.js` for names, reveal messages, photo paths, chapter labels, letter paragraphs, and story copy. The provided wording is romantic sample content; update it throughout for a different relationship or occasion.

Use `editorial.css` for typography and letter layout, `voyage.css` for the entrance and background, and `styles.css` for book geometry and responsive layouts. Rebuild `ONE_FILE_PREVIEW.html` after source changes so the portable version matches.

For the existing portrait alignment check, run `node intro-qa.cjs --journey --alignment` from the repository root. Setup and other checks are documented in the [main README](../../README.md).
