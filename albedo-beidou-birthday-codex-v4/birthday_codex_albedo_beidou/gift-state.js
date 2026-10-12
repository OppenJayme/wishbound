'use strict';
(() => {
  const story = window.BIRTHDAY_STORY;
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  story.presentation = Object.assign({
    themeTitle: 'The Alchemist & the Captain', heroPrefix: 'Between', heroAccent: 'stars & seas.',
    heroSubtitle: 'A little universe, bound just for you.', introTitle: 'A wish, just for you.',
    introMessage: 'Some stars find their way to us.\nSome become our whole world.'
  }, story.presentation);
  story.photoAlts ||= ['A favorite memory', 'Another favorite memory', 'An adventure to remember'];
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
    const image = path === 'reveal.portrait' || /^photos\.\d$/.test(path);
    if (type === 'string' && !image && value.length > 5000) throw Error('Please keep this text under 5,000 characters.');
    if ((path === 'reveal.portrait' || /^photos\.\d$/.test(path)) && !imagePath(value)) throw Error('Please choose a supported image.');
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
      img.alt = path === 'reveal.portrait' ? story.reveal.portraitAlt : story.photoAlts[Number(path.split('.')[1])];
    });
    window.BIRTHDAY_BOOK?.refresh();
    document.getElementById('replayIntro').hidden = story.reveal.enabled === false;
    document.dispatchEvent(new CustomEvent('wishbound:refresh'));
  }
  window.WISHBOUND = {
    story, defaults, template, get, set, apply, refresh, clone,
    text: path => `<span class="story-text" data-story-text="${escape(path)}">${escape(get(path))}</span>`,
    reset: () => { apply(defaults); refresh(); },
    snapshot: () => clone(story)
  };
})();
