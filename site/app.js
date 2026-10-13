/*
 * WISHBOUND — Albedo + Beidou-inspired interactive birthday storybook.
 * All copy and image paths are near the top so you can personalize easily.
 */
'use strict';

const STORY = window.BIRTHDAY_STORY;
const storyText = path => window.WISHBOUND.text(path);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const safeImage = value => {
  const url = String(value ?? '');
  const allowed = /^(?:https?:\/\/|assets\/|\.\/assets\/)/i.test(url) || /^data:image\/(?:svg\+xml|png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(url);
  return allowed ? escapeHTML(url) : 'assets/sunset.svg';
};

const [photo1, photo2, photo3, bookPortrait, galleryPhoto2] = STORY.photos.map(safeImage);
const keepsakePortrait = `<div class="keepsake-portrait"><img data-story-image="photos.3" src="${bookPortrait}" alt="${escapeHTML(STORY.photoAlts[3])}" /></div>`;
const primogem = 'assets/primogem.svg';
const pageLabel = n => `<span class="page-number">${String(n).padStart(2, '0')}</span>`;
const pageKeepsake = (kind, asset) => `<div class="page-keepsake keepsake-${kind}" aria-hidden="true"><img src="${asset}" alt="" draggable="false" /></div>`;

const pages = {
  leftBase: `
    <div class="page base-left">
      <div class="arcane-sigil" aria-hidden="true"></div><div class="alchemy-orbit" aria-hidden="true">✧ &nbsp; ✦ &nbsp; ✧</div>
      <div class="halo"><div class="halo-heart">✦</div></div>
      <div class="base-message">${storyText('copy.a_journal_of_us')}</div>
      <div class="base-detail">${storyText('copy.an_alchemists_heart_a_captains')}</div>
    </div>`,

  cover: `
    <div class="page cover">
      <div class="cover-rune rune-a" aria-hidden="true">✧</div>
      <div class="cover-rune rune-b" aria-hidden="true">✦</div>
      <div class="cover-gems" aria-hidden="true">
        <img src="${primogem}" alt="" />
        <img src="${primogem}" alt="" />
        <img src="${primogem}" alt="" />
      </div>
      <div class="cover-top">${storyText('copy.a_chronicle_beneath_the_stars')}</div>
      <div class="cover-divider">✦</div>
      <div>
        <div class="cover-kicker">${storyText('copy.bound_for')}</div>
        <div class="cover-title">${storyText('copy.happy')}<br/><em>${storyText('copy.birthday')}</em><br/>${storyText('recipient')}.</div>
        <div class="cover-script">${storyText('copy.our_favorite_adventures_written_in')}</div>
      </div>
      <div class="wax-seal" aria-hidden="true">✧</div>
      <div class="cover-bottom">${storyText('copy.set_sail_turn_the_page')}</div>
    </div>`,

  openingLeft: `
    <div class="page chapter-page parchment-chapter">
      <div class="large-initial">${storyText('copy.i')}</div>
      <div class="tiny-cap">${storyText('copy.chapter_one_where_our_paths')}</div>
      <h2>${storyText('copy.where_two_worlds')}<br/><span class="emphasis">${storyText('copy.became_one')}</span></h2>
      <div class="rule"></div>
      <p>${storyText('copy.somewhere_between_the_stars_above')}</p>
      <div class="quote-card"><p>${storyText('copy.ever_since_you_life_has')}</p></div>
      ${pageKeepsake('alchemy', 'assets/alchemist-keepsakes.svg')}
      ${pageLabel(1)}
    </div>`,

  openingRight: `
    <div class="page beidou-showcase page-framed">
      <div class="showcase-copy">
        <span class="tiny-cap">${storyText('copy.the_captain_of_the_tale')}</span>
        <h3>${storyText('copy.a_heart_as_brave')}<br/>${storyText('copy.as_the_sea')}</h3>
        <p>${storyText('copy.for_your_courage_your_kindness')}</p>
        <div class="gem-row" aria-hidden="true">
          <img src="${primogem}" alt="" />
          <img src="${primogem}" alt="" />
          <img src="${primogem}" alt="" />
        </div>
      </div>
      ${keepsakePortrait}
      <div class="side-note">${storyText('copy.my_favorite_adventure_is_you')}</div>
      ${pageLabel(2)}
    </div>`,

  thingsLeft: `
    <div class="page little-things parchment-chapter">
      <span class="tiny-cap">${storyText('copy.chapter_two_little_treasures')}</span>
      <h2>${storyText('copy.the_little_treasures')}<br/><span class="emphasis">${storyText('copy.i_found_in_you')}</span></h2>
      <div class="list-line"><span class="num">01</span><p><strong>${storyText('copy.your_laugh')}</strong>${storyText('copy.it_can_change_the_temperature')}</p></div>
      <div class="list-line"><span class="num">02</span><p><strong>${storyText('copy.your_kindness')}</strong>${storyText('copy.even_the_quiet_kind_that')}</p></div>
      <div class="list-line"><span class="num">03</span><p><strong>${storyText('copy.your_presence')}</strong>${storyText('copy.somehow_every_place_feels_softer')}</p></div>
      ${pageKeepsake('flower', 'assets/cecilia-bookmark.svg')}
      ${pageLabel(3)}
    </div>`,

  thingsRight: `
    <div class="page scrapbook-page page-framed">
      <div class="tiny-cap scrapbook-title">${storyText('copy.treasures_from_the_voyage')}</div>
      <div class="photo-mini photo-a"><div class="mini-frame"><img data-story-image="photos.1" src="${photo2}" alt="Illustrated bouquet — placeholder for your memory" /></div><span>${storyText('copy.little_constellations')}</span></div>
      <div class="photo-mini photo-b"><div class="mini-frame"><img data-story-image="photos.2" src="${photo3}" alt="Illustrated crimson-sail ship at sea — replace with your photo" /></div><span>${storyText('copy.quiet_horizons')}</span></div>
      <span class="doodle">${storyText('copy.all_the_things_that_make')}</span>
      ${pageLabel(4)}
    </div>`,

  memoriesLeft: `
    <div class="page timeline-page parchment-chapter">
      <div class="tiny-cap">${storyText('copy.chapter_three_our_voyages')}</div>
      <h2>${storyText('copy.our_favorite')}<br/><span class="emphasis">${storyText('copy.uncharted_waters')}</span></h2>
      <div class="timeline-row"><span class="timeline-star">✦</span><div><strong>${storyText('copy.the_first_time_we_set')}</strong><p>${storyText('copy.a_moment_i_would_gladly')}</p></div></div>
      <div class="timeline-row"><span class="timeline-star">✦</span><div><strong>${storyText('copy.the_unexpected_detours')}</strong><p>${storyText('copy.sometimes_the_best_moments_are')}</p></div></div>
      <div class="timeline-row"><span class="timeline-star">✦</span><div><strong>${storyText('copy.everything_still_ahead')}</strong><p>${storyText('copy.there_are_so_many_horizons')}</p></div></div>
      ${pageKeepsake('voyage', 'assets/crimson-sail-bottle.svg')}
      ${pageLabel(5)}
    </div>`,

  memoriesRight: `
    <div class="page gallery-page page-framed">
      <span class="tiny-cap">${storyText('copy.a_gallery_of_favorites')}</span>
      <div class="gallery-grid">
        <div class="photo-tile"><div class="tile-image"><img data-story-image="photos.0" src="${photo1}" alt="Sunset illustration, replace with a couple photo" /></div><div class="tile-caption">${storyText('copy.one_unforgettable_day')}</div></div>
        <div class="photo-tile"><div class="tile-image"><img data-story-image="photos.4" src="${galleryPhoto2}" alt="Flower illustration, replace with a couple photo" /></div><div class="tile-caption">${storyText('copy.one_beautiful_feeling')}</div></div>
      </div>
      <div class="script gallery-script">${storyText('copy.every_memory_becomes_brighter_with')}</div>
      ${pageLabel(6)}
    </div>`,

  letterLeft: `
    <div class="page letter-left parchment-chapter">
      <span class="tiny-cap">${storyText('copy.chapter_four_a_sealed_letter')}</span>
      <h2>${storyText('copy.i_wrote_you')}<br/><span class="emphasis">${storyText('copy.something_sincere')}</span></h2>
      <p>${storyText('copy.some_feelings_deserve_more_than')}</p>
      <div class="envelope" aria-hidden="true"><div class="wax-seal">✦</div>${pageKeepsake('electro', 'assets/electro-tassel.svg')}</div>
      <button class="reveal-btn open-letter" type="button">${storyText('presentation.readLetterLabel')} <span aria-hidden="true">↗</span></button>
      ${pageLabel(7)}
    </div>`,

  letterRight: `
    <div class="page letter-right page-framed">
      <div class="letter-heading"><span class="tiny-cap">${storyText('copy.a_page_written_from_the')}</span></div>
      <div class="salutation">${storyText('copy.my_darling')}</div>
      <p>${storyText('copy.even_in_the_smallest_moments')}</p>
      <p>${storyText('copy.i_hope_this_next_year')}</p>
      <p>${storyText('copy.and_through_every_chapter_ahead')}</p>
      <div class="signature">${storyText('copy.with_all_my_love')}<span class="letter-sender">${storyText('signoff')}</span></div>
      ${pageLabel(8)}
    </div>`,

  wishesLeft: `
    <div class="page wishes-page parchment-chapter">
      <div class="tiny-cap">${storyText('copy.chapter_five_beyond_the_horizon')}</div>
      <h2>${storyText('copy.to_every_horizon')}<br/><span class="emphasis">${storyText('copy.still_ahead')}</span></h2>
      <div class="wish-item"><span>✦</span>${storyText('copy.more_long_talks_that_make')}</div>
      <div class="wish-item"><span>✦</span>${storyText('copy.more_laughter_that_sneaks_up')}</div>
      <div class="wish-item"><span>✦</span>${storyText('copy.more_places_memories_and_beautiful')}</div>
      <div class="wish-item"><span>✦</span>${storyText('copy.more_of_us_choosing_each')}</div>
      <div class="script">${storyText('copy.the_best_chapters_have_not')}</div>
      ${pageLabel(9)}
    </div>`,

  wishesRight: `
    <div class="page star-page page-framed">
      <div class="tiny-cap">${storyText('copy.one_wish_carried_by_the')}</div>
      <div class="primogem-cluster" aria-hidden="true">
        <img src="${primogem}" alt="" />
        <img src="${primogem}" alt="" />
        <img src="${primogem}" alt="" />
        <img src="${primogem}" alt="" />
        <img src="${primogem}" alt="" />
      </div>
      <div class="constellation wish-gem" aria-hidden="true"><img src="${primogem}" alt="" /></div>
      <h2>${storyText('copy.make_a_wish')}</h2>
      <p>${storyText('copy.close_your_eyes_and_make')}</p>
      <button class="wish-button make-wish" type="button">${storyText('presentation.makeWishLabel')} <span aria-hidden="true">↗</span></button>
      <div class="fine-print wish-note">${storyText('copy.may_every_good_thing_find')}</div>
      ${pageLabel(10)}
    </div>`,

  endingLeft: `
    <div class="page last-page parchment-chapter">
      <div class="tiny-cap">${storyText('copy.the_next_adventure_awaits')}</div>
      <div class="last-glyph">∞</div>
      <h2>${storyText('copy.to_be')}<br/><span class="emphasis">${storyText('copy.continued')}</span></h2>
      <div class="small-heart">♥</div>
      <p>${storyText('copy.another_birthday_another_reminder_that')}</p>
      <div class="script">${storyText('copy.and_we_still_have_so')}</div>
      ${pageLabel(11)}
    </div>`,

  rightBase: `
    <div class="page base-right">
      <div class="navigator-compass" aria-hidden="true"><span>✦</span></div>
      <div class="end-flower">✧</div>
      <div class="big-end">${storyText('copy.the_best_part')}</div>
      <p>${storyText('copy.there_are_still_so_many')}</p>
      <div class="end-gem" aria-hidden="true"><img src="${primogem}" alt="" /></div>
      <div class="end-script">${storyText('copy.love_you_always')}</div>
      <div class="fine-print end-note">${storyText('copy.the_voyage_continues')}</div>
    </div>`,
};

const sheetConfig = [
  [pages.cover, pages.openingLeft],
  [pages.openingRight, pages.thingsLeft],
  [pages.thingsRight, pages.memoriesLeft],
  [pages.memoriesRight, pages.letterLeft],
  [pages.letterRight, pages.wishesLeft],
  [pages.wishesRight, pages.endingLeft],
];

// Mobile uses the same story copy as the desktop spreads.
const photoStrip = (first, second) => `<div class="mobile-photo-strip"><img data-story-image="photos.${first}" src="${safeImage(STORY.photos[first])}" alt="${escapeHTML(STORY.photoAlts[first])}"><img data-story-image="photos.${second}" src="${safeImage(STORY.photos[second])}" alt="${escapeHTML(STORY.photoAlts[second])}"></div>`;
const mobileTemplates = [
  pages.cover,
  pages.openingLeft.replace('<h2>', `${keepsakePortrait}<h2>`),
  pages.thingsLeft.replace(pageLabel(3), photoStrip(1, 2)),
  pages.memoriesLeft.replace(pageLabel(5), photoStrip(0, 4)),
  pages.letterLeft,
  pages.wishesRight,
  pages.endingLeft,
];

const sheetsEl = document.getElementById('sheets');
const bookEl = document.getElementById('book');
const mobileBookEl = document.getElementById('mobileBook');
const pageCountEl = document.getElementById('pageCount');
const chapterLabelEl = document.getElementById('chapterLabel');
const dotsEl = document.getElementById('pagination');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dialog = document.getElementById('letterDialog');
dialog.querySelector('.signature').innerHTML = storyText('presentation.letterSignature') + '<br/>' + storyText('signoff');
dialog.querySelector('h2').textContent = STORY.letter.greeting;
dialog.querySelector('h2').dataset.storyText = 'letter.greeting';
dialog.querySelectorAll('.dialog-inner p').forEach(p => p.remove());
STORY.letter.paragraphs.forEach((text, index) => {
  const p = document.createElement('p');
  p.textContent = text;
  p.dataset.storyText = 'letter.paragraphs.' + index;
  dialog.querySelector('.signature').before(p);
});

let current = 0;
let isTurning = false;
let requested = 0;
let sourceCurrent = 0;
const total = sheetConfig.length + 1;

document.getElementById('leftBoard').innerHTML = pages.leftBase;
document.getElementById('rightBoard').innerHTML = pages.rightBase;
sheetConfig.forEach(([front, back], index) => {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.dataset.index = String(index);
  sheet.style.zIndex = String(sheetConfig.length - index);
  sheet.innerHTML = `<div class="face front">${front}</div><div class="face back">${back}</div>`;
  sheetsEl.appendChild(sheet);
});
mobileTemplates.forEach((html, index) => {
  const card = document.createElement('article');
  card.className = `mobile-card${index === 0 ? ' active' : ''}`;
  card.dataset.mobileIndex = String(index);
  card.setAttribute('aria-label', `${STORY.chapterNames[index]}`);
  card.innerHTML = html;
  mobileBookEl.appendChild(card);
});
const sheets = [...document.querySelectorAll('.sheet')];
const mobileCards = [...document.querySelectorAll('.mobile-card')];

STORY.chapterNames.forEach((label, index) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'page-dot';
  dot.setAttribute('aria-label', `Go to chapter ${index + 1}: ${label}`);
  dot.addEventListener('click', () => goTo(index));
  dotsEl.appendChild(dot);
});
const dots = [...dotsEl.children];

function render() {
  sheets.forEach((sheet, index) => {
    const flipped = index < current;
    sheet.classList.toggle('flipped', flipped);
    if (!sheet.classList.contains('turning')) sheet.style.zIndex = flipped ? String(20 + index) : String(sheetConfig.length - index);
    sheet.setAttribute('aria-hidden', String(index !== current && index !== current - 1));
    sheet.style.display = (index === current || index === current - 1 || (isTurning && (index === sourceCurrent || index === sourceCurrent - 1))) ? 'block' : 'none';
    sheet.querySelector('.front').inert = index !== current;
    sheet.querySelector('.back').inert = index !== current - 1;
    sheet.querySelector('.front').setAttribute('aria-hidden', String(index !== current));
    sheet.querySelector('.back').setAttribute('aria-hidden', String(index !== current - 1));
  });
  mobileCards.forEach((card, index) => {
    card.classList.toggle('active', index === current);
    card.classList.toggle('prev', index < current);
    card.setAttribute('aria-hidden', String(index !== current));
    card.inert = index !== current;
  });
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === current);
    dot.setAttribute('aria-current', String(index === current ? 'step' : 'false'));
  });
  pageCountEl.textContent = `${String(current + 1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
  chapterLabelEl.textContent = STORY.chapterNames[current];
  chapterLabelEl.dataset.storyText = 'chapterNames.' + current;
  prevBtn.disabled = requested === 0;
  nextBtn.disabled = requested === total - 1;
  document.getElementById('cornerPrev').disabled = requested === 0;
  document.getElementById('cornerNext').disabled = requested === total - 1;
  bookEl.classList.toggle('is-open', current > 0);
  bookEl.classList.toggle('is-turning', isTurning);
  document.getElementById('leftBoard').inert = current !== 0;
  document.getElementById('rightBoard').inert = current !== total - 1;
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileMode = () => window.matchMedia('(max-width: 900px)').matches;

// A temporary, segmented sheet bends in a continuous curve. At rest we use the
// original selectable DOM pages; the animation copies are inert and decorative.
function animateSheet(sheetIndex, direction) {
  return new Promise(resolve => {
    const sheet = sheets[sheetIndex];
    const width = bookEl.clientWidth / 2;
    const height = bookEl.clientHeight;
    const count = sheetIndex === 0 ? 1 : 24;
    const bandWidth = width / count;
    const mesh = document.createElement('div');
    mesh.className = 'page-mesh';
    mesh.setAttribute('aria-hidden', 'true');
    mesh.inert = true;
    const bands = [];
    for (let i = 0; i < count; i++) {
      const band = document.createElement('div');
      band.className = 'page-band';
      band.style.width = `${bandWidth + .6}px`;
      for (const side of ['front', 'back']) {
        const face = document.createElement('div');
        face.className = `band-face band-${side}`;
        const content = sheet.querySelector(`.${side} .page`).cloneNode(true);
        content.style.width = `${width}px`;
        content.style.height = `${height}px`;
        content.style.left = `${-(side === 'front' ? i : count - 1 - i) * bandWidth}px`;
        // Pixel padding avoids percentage padding being resolved against a strip.
        const style = getComputedStyle(sheet.querySelector(`.${side} .page`));
        content.style.padding = style.padding;
        face.appendChild(content);
        band.appendChild(face);
      }
      mesh.appendChild(band);
      bands.push(band);
    }
    bookEl.appendChild(mesh);
    sheet.style.visibility = 'hidden';
    const shadow = document.getElementById('turnShadow');
    const duration = sheetIndex === 0 ? 1450 : 1100;
    let start;
    function frame(time) {
      start ??= time;
      const elapsed = Math.min(1, (time - start) / duration);
      // Symmetric acceleration/deceleration, with no sudden stop at the spine.
      const eased = elapsed * elapsed * elapsed * (elapsed * (elapsed * 6 - 15) + 10);
      const p = direction === 1 ? eased : 1 - eased;
      const lift = Math.sin(Math.PI * p);
      let x = 0, z = 1;
      bands.forEach((band, i) => {
        const bend = count === 1 ? 0 : .52 * lift * Math.sin((i / (count - 1) - .5) * Math.PI);
        const angle = -Math.PI * p + bend;
        band.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${angle}rad)`;
        band.style.setProperty('--shade', (lift * (.12 + .13 * i / count)).toFixed(3));
        x += Math.cos(angle) * bandWidth;
        z -= Math.sin(angle) * bandWidth;
      });
      shadow.style.opacity = String(lift * .45);
      shadow.style.transform = `translateX(${p < .5 ? 100 : 0}%) scaleX(${.3 + lift * .7})`;
      if (elapsed < 1 && !reduceMotion() && !mobileMode()) requestAnimationFrame(frame);
      else {
        mesh.remove();
        sheet.style.visibility = '';
        shadow.style.opacity = '0';
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

async function drainTurns() {
  if (isTurning) return;
  while (current !== requested) {
    const direction = requested > current ? 1 : -1;
    const sheetIndex = direction === 1 ? current : current - 1;
    sourceCurrent = current;
    isTurning = true;
    current += direction;
    render();
    if (!reduceMotion() && !mobileMode()) await animateSheet(sheetIndex, direction);
    else if (!reduceMotion()) await new Promise(resolve => setTimeout(resolve, 360));
    isTurning = false;
    render();
  }
}

function goTo(target) {
  requested = Math.max(0, Math.min(total - 1, target));
  render();
  drainTurns();
}

function turn(direction) { goTo(requested + direction); }

prevBtn.addEventListener('click', () => turn(-1));
nextBtn.addEventListener('click', () => turn(1));
document.getElementById('cornerPrev').addEventListener('click', () => turn(-1));
document.getElementById('cornerNext').addEventListener('click', () => turn(1));
document.addEventListener('keydown', (event) => {
  if (dialog.open || document.getElementById('wishIntro')?.open || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); turn(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); turn(-1); }
});

const scene = document.getElementById('scene');
scene.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || reduceMotion() || isTurning) return;
  const bounds = scene.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  bookEl.style.setProperty('--tilt-x', `${(-y * 1.8).toFixed(2)}deg`);
  bookEl.style.setProperty('--tilt-y', `${(x * 2.4).toFixed(2)}deg`);
});
scene.addEventListener('pointerleave', () => {
  bookEl.style.setProperty('--tilt-x', '0deg');
  bookEl.style.setProperty('--tilt-y', '0deg');
});

let touchStart = null;
mobileBookEl.addEventListener('touchstart', event => {
  const point = event.changedTouches[0];
  touchStart = { x: point.clientX, y: point.clientY };
}, { passive: true });
mobileBookEl.addEventListener('touchend', event => {
  if (!touchStart) return;
  const point = event.changedTouches[0];
  const dx = point.clientX - touchStart.x;
  const dy = point.clientY - touchStart.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) turn(dx < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });
mobileBookEl.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });

document.addEventListener('click', event => {
  if (current === 0 && event.target.closest('.cover')) turn(1);
  if (event.target.closest('.open-letter')) dialog.showModal();
  if (event.target.closest('.make-wish')) {
    event.target.closest('.page').querySelector('.wish-note').textContent = 'Your wish is on its way. ✦';
    celebrate();
  }
});
document.getElementById('closeLetter').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

function celebrate() {
  if (reduceMotion()) return;
  const colors = ['#deab6a', '#f7ecd1', '#9cbdd1', '#e2c68b', '#bc5359'];
  const amount = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 12 : 90;
  for (let i = 0; i < amount; i++) {
    const petal = document.createElement('span');
    petal.className = 'confetti';
    petal.style.setProperty('--x', `${Math.random() * 100}%`);
    petal.style.setProperty('--size', `${4 + Math.random() * 10}px`);
    petal.style.setProperty('--drift', `${Math.random() * 300 - 150}px`);
    petal.style.setProperty('--fall-time', `${2.7 + Math.random() * 3}s`);
    petal.style.setProperty('--color', colors[i % colors.length]);
    document.body.appendChild(petal);
    petal.addEventListener('animationend', () => petal.remove(), { once: true });
  }
}

const stars = document.getElementById('stars');
for (let i = 0; i < 36; i++) {
  const star = document.createElement('span');
  star.className = 'star';
  const x = (i * 79.7 + 17) % 100;
  const y = (i * 47.3 + 5) % 100;
  const size = (i % 4 === 0 ? 2.8 : 1.25);
  star.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;--delay:${-i * .28}s;--duration:${3 + i % 4}s`;
  stars.appendChild(star);
}

render();
// The intro is independent of this book's navigation and works in the portable preview.
window.BIRTHDAY_BOOK = {
  beginning: () => goTo(0),
  refresh: () => {
    dialog.querySelectorAll('.dialog-inner p').forEach(p => p.remove());
    STORY.letter.paragraphs.forEach((text, index) => {
      const p = document.createElement('p');
      p.textContent = text;
      p.dataset.storyText = 'letter.paragraphs.' + index;
      dialog.querySelector('.signature').before(p);
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-label', `Go to chapter ${i + 1}: ${STORY.chapterNames[i]}`));
    mobileCards.forEach((card, i) => card.setAttribute('aria-label', STORY.chapterNames[i]));
    render();
  },
  open: async () => {
    if (current === 0) goTo(1);
    await new Promise(resolve => {
      const settled = () => isTurning ? requestAnimationFrame(settled) : resolve();
      settled();
    });
  },
  portrait: () => current === 1 ? (mobileMode() ? mobileCards[1] : sheets[1].querySelector('.front')).querySelector('.keepsake-portrait') : null,
  focus: () => document.getElementById('nextBtn').focus({preventScroll: true}),
};
