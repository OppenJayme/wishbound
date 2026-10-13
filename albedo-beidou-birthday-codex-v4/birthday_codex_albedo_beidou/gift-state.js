'use strict';
(() => {
  const story = window.BIRTHDAY_STORY;
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  story.presentation = Object.assign({
    birthdayOverline: 'THE STARS HAVE A REASON TO CELEBRATE',
    birthdayFirstLine: 'Happy', birthdaySecondLine: 'birthday.', birthdayToLabel: 'to',
    birthdayMessage: 'A little universe, made to celebrate you.', birthdayContinueLabel: 'Let the magic begin',
    themeTitle: 'The Alchemist & the Captain', heroPrefix: 'Between', heroAccent: 'stars & seas.',
    heroSubtitle: 'A little universe, bound just for you.', introTitle: 'A wish, just for you.',
    introMessage: 'Some stars find their way to us.\nSome become our whole world.',
    monogramFirst: 'f', monogramLast: 'y', heroEyebrow: 'A STORY IN SEVEN CHAPTERS',
    keepsakeLabel: "The captain's company", bottomHint: 'Use the arrows to turn the page',
    footerNote: 'An original keepsake of alchemy, starlight, and sea.', footerDedication: 'ONLY YOU & ME',
    introOverline: 'A BIRTHDAY WISH · FOR YOU', introFootnote: 'One little wish. A whole story waiting.',
    introChartNote: 'LIYUE · A VOYAGE BENEATH THE STARS', revealFootnote: 'The best chapters are still ahead.',
    letterOverline: 'A LETTER FOR YOU', letterOccasion: 'On your birthday', letterSignature: 'All my love,',
    replayLabel: 'Replay the wish', portraitReplayLabel: 'Replay wish', skipLabel: 'Read the book', startWishLabel: 'Make your wish',
    enterBookLabel: 'Open your story', closeLetterLabel: 'Close', readLetterLabel: 'Read your letter',
    makeWishLabel: 'Make a wish'
  }, story.presentation);
  // Keep the original indices so older drafts can be restored.
  story.photos[3] ||= story.reveal.portrait;
  story.photos[4] ||= story.photos[1];
  story.photoAlts ||= ['A favorite memory', 'Another favorite memory', 'An adventure to remember'];
  story.photoAlts[3] ||= story.reveal.portraitAlt;
  story.photoAlts[4] ||= story.photoAlts[1];
  const photoSlots = [
    {path: 'reveal.portrait', altPath: 'reveal.portraitAlt', label: 'Opening wish portrait', portrait: true},
    {path: 'photos.3', altPath: 'photoAlts.3', label: 'Chapter 1 · Portrait', portrait: true},
    {path: 'photos.1', altPath: 'photoAlts.1', label: 'Chapter 2 · Little constellations'},
    {path: 'photos.2', altPath: 'photoAlts.2', label: 'Chapter 2 · Quiet horizons'},
    {path: 'photos.0', altPath: 'photoAlts.0', label: 'Chapter 3 · Unforgettable day'},
    {path: 'photos.4', altPath: 'photoAlts.4', label: 'Chapter 3 · Beautiful feeling'}
  ];
  const photoSlot = path => photoSlots.find(slot => slot.path === path);
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
  }
  function apply(saved) {
    if (!saved || typeof saved !== 'object') return;
    for (const path of fields.keys()) {
      const value = path.split('.').reduce((obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key) ? obj[key] : undefined, saved);
      if (value !== undefined) { try { set(path, value); } catch {} }
    }
    // Split formerly shared slots without discarding an existing uploaded photo.
    if (Array.isArray(saved.photos)) {
      if (!saved.photos[3] && saved.reveal?.portrait) {
        try { set('photos.3', saved.reveal.portrait); set('photoAlts.3', saved.reveal.portraitAlt || story.photoAlts[3]); } catch {}
      }
      if (!saved.photos[4] && saved.photos[1]) {
        try { set('photos.4', saved.photos[1]); set('photoAlts.4', saved.photoAlts?.[1] || story.photoAlts[1]); } catch {}
      }
    }
    if (Array.isArray(saved.letter?.paragraphs)) { try { set('letter.paragraphs', saved.letter.paragraphs); } catch {} }
  }
  function refresh() {
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
