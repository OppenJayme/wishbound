'use strict';
(() => {
  const story = window.BIRTHDAY_STORY;
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  story.presentation = Object.assign({
    birthdayOverline: "TODAY BELONGS TO YOU",
    birthdayFirstLine: 'Happy', birthdaySecondLine: 'birthday.', birthdayToLabel: 'to',
    birthdayMessage: "A few small wonders, gathered for your birthday.", birthdayContinueLabel: "Step into your story",
    themeTitle: 'The Alchemist & the Captain', heroPrefix: "A keepsake of", heroAccent: "stars & shared days.",
    heroSubtitle: "For the moments that deserve a little more than a photograph.", introTitle: "A wish with your name on it.",
    introMessage: "Take a breath. Look to the sky.\nThere is a little birthday magic waiting.",
    monogramFirst: 'f', monogramLast: 'y', heroEyebrow: "A LITTLE BOOK IN SEVEN CHAPTERS",
    keepsakeLabel: "A companion for the voyage", bottomHint: 'Use the arrows to turn the page',
    footerNote: "A place for your words, memories, and birthday wishes.", footerDedication: "FOR THE DAYS WE SHARE",
    introOverline: "ONE WISH · ONE WONDERFUL YOU", introFootnote: "A small celebration, made with a full heart.",
    introChartNote: "A LITTLE LIGHT FOR THE JOURNEY", revealFootnote: "Your birthday story is waiting.",
    letterOverline: "A NOTE TO KEEP", letterOccasion: "For your birthday", letterSignature: "Always in your corner,",
    replayLabel: 'Replay the wish', portraitReplayLabel: 'Replay wish', skipLabel: 'Read the book', startWishLabel: 'Make your wish',
    enterBookLabel: 'Open your story', closeLetterLabel: 'Close', readLetterLabel: 'Read your letter',
    makeWishLabel: 'Make a wish', endingCloseLabel: 'Close the book',
    endingReplayLabel: 'Replay from the beginning', endingMessage: "Keep this chapter close. Begin again whenever you like."
  }, story.presentation);
  // Keep the original indices so older drafts can be restored.
  story.photos[3] = story.reveal.portrait;
  story.photos[4] ||= story.photos[1];
  story.photoAlts ||= ['A favorite memory', 'Another favorite memory', 'An adventure to remember'];
  story.photoAlts[3] = story.reveal.portraitAlt;
  story.photoAlts[4] ||= story.photoAlts[1];
  const photoSlots = [
    {path: 'reveal.portrait', altPath: 'reveal.portraitAlt', label: 'Opening wish portrait', portrait: true},
    {path: 'photos.1', altPath: 'photoAlts.1', label: 'Chapter 2 · Sunlit moments'},
    {path: 'photos.2', altPath: 'photoAlts.2', label: 'Chapter 2 · A quiet afternoon'},
    {path: 'photos.0', altPath: 'photoAlts.0', label: 'Chapter 3 · Unforgettable day'},
    {path: 'photos.4', altPath: 'photoAlts.4', label: 'Chapter 3 · Beautiful feeling'}
  ];
  const canonicalPath = path => ({'photos.3':'reveal.portrait','photoAlts.3':'reveal.portraitAlt'}[path] || path);
  const photoSlot = path => photoSlots.find(slot => slot.path === canonicalPath(path));
  function syncPortrait() {
    story.photos[3] = story.reveal.portrait;
    story.photoAlts[3] = story.reveal.portraitAlt;
  }
  const defaults = clone(story);
  const template = document.documentElement.outerHTML;
  const fields = new Map();
  function collect(value, prefix = '') {
    for (const [key, item] of Object.entries(value)) {
      const path = prefix ? prefix + '.' + key : key;
      if (typeof item === 'string' || typeof item === 'boolean') fields.set(path, typeof item);
      else if (item && typeof item === 'object') collect(item, path);
    }
  }
  collect(defaults);
  const get = path => path.split('.').reduce((value, key) => value?.[key], story);
  const imagePath = value => typeof value === 'string' && /^(?:assets\/|\.\/assets\/|https?:\/\/|data:image\/(?:svg\+xml|png|jpeg|webp);base64,)/i.test(value);
  function set(path, value) {
    path = canonicalPath(path);
    if (path === 'letter.paragraphs') {
      if (!Array.isArray(value) || value.length > 20 || value.some(p => typeof p !== 'string' || p.length > 5000)) throw Error('Keep the letter to 20 short paragraphs.');
      story.letter.paragraphs.splice(0, story.letter.paragraphs.length, ...value);
      return;
    }
    const type = fields.get(path) || (/^letter\.paragraphs\.\d+$/.test(path) ? 'string' : null);
    if (!type || typeof value !== type) throw Error('This field cannot be edited.');
    const image = !!photoSlot(path);
    if (type === 'string' && !image && value.length > 5000) throw Error('Please keep this text under 5,000 characters.');
    if (image && !imagePath(value)) throw Error('Please choose a supported image.');
    const keys = path.split('.'); const key = keys.pop();
    const parent = keys.reduce((value, key) => value[key], story);
    parent[key] = value;
    if (path === "reveal.portrait" || path === "reveal.portraitAlt") syncPortrait();
  }
  function apply(saved) {
    if (!saved || typeof saved !== 'object') return;
    for (const path of fields.keys()) {
      if (path === 'photos.3' || path === 'photoAlts.3') continue;
      const value = path.split('.').reduce((obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key) ? obj[key] : undefined, saved);
      if (value !== undefined) { try { set(path, value); } catch {} }
    }
    // Split formerly shared slots without discarding an existing uploaded photo.
    if (Array.isArray(saved.photos)) {
      // Prefer the opening portrait; recover a chapter-only upload from older drafts.
      const opening = saved.reveal?.portrait, legacy = saved.photos[3];
      if (imagePath(legacy) && (!imagePath(opening) || opening === 'assets/portrait-placeholder.svg')) {
        try { set('reveal.portrait', legacy); set('reveal.portraitAlt', saved.photoAlts?.[3] || story.reveal.portraitAlt); } catch {}
      }
      if (!saved.photos[4] && saved.photos[1]) {
        try { set('photos.4', saved.photos[1]); set('photoAlts.4', saved.photoAlts?.[1] || story.photoAlts[1]); } catch {}
      }
    }
    if (Array.isArray(saved.letter?.paragraphs)) { try { set('letter.paragraphs', saved.letter.paragraphs); } catch {} }
  }
  function refresh() {
    syncPortrait();
    document.querySelectorAll('[data-story-text]').forEach(node => {
      const value = get(node.dataset.storyText);
      if (typeof value === 'string') node.textContent = value;
    });
    document.querySelectorAll('img[data-story-image]').forEach(img => {
      const path = img.dataset.storyImage; const value = get(path);
      if (imagePath(value)) img.src = value;
      img.alt = get(photoSlot(path).altPath);
    });
    window.BIRTHDAY_BOOK?.refresh();
    document.getElementById('replayIntro').hidden = story.reveal.enabled === false;
    document.dispatchEvent(new CustomEvent('wishbound:refresh'));
  }
  window.WISHBOUND = {
    story, defaults, template, get, set, apply, refresh, clone, photoSlots, photoSlot,
    text: path => `<span class="story-text" data-story-text="${escape(path)}">${escape(get(path))}</span>`,
    reset: () => { apply(defaults); refresh(); },
    snapshot: () => clone(story)
  };
})();
