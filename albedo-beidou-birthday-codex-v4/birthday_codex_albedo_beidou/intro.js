'use strict';
(() => {
  const config = window.BIRTHDAY_STORY.reveal || {};
  const intro = document.getElementById('wishIntro');
  const invitation = document.getElementById('introInvitation');
  const reveal = document.getElementById('introReveal');
  const start = document.getElementById('startWish');
  const enter = document.getElementById('enterBook');
  const skip = document.getElementById('skipIntro');
  const replay = document.getElementById('replayIntro');
  const portraitReplay = document.getElementById('replayPortraitWish');
  const status = document.getElementById('introStatus');
  const portrait = document.getElementById('revealPortrait');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revealTimer;
  let manifestTimer;
  let leaveTimer;
  let stage = 'ready';
  let journey = 0;
  let flight;
  let veil;
  let destination;
  const animations = new Set();

  function cleanupJourney() {
    journey++;
    animations.forEach(animation => animation.cancel());
    animations.clear();
    flight?.remove();
    veil?.remove();
    destination?.classList.remove('portrait-in-transit');
    flight = veil = destination = null;
  }

  async function animate(element, frames, duration, easing = 'cubic-bezier(.22,.65,.22,1)') {
    const animation = element.animate(frames, {duration, easing, fill: 'forwards'});
    animations.add(animation);
    await animation.finished.catch(() => {});
  }

  async function carryPortrait() {
    const ticket = ++journey;
    const source = portrait.parentElement.getBoundingClientRect();
    flight = portrait.parentElement.cloneNode(true);
    flight.querySelector('img').removeAttribute('id');
    flight.classList.add('travel-portrait');
    flight.setAttribute('aria-hidden', 'true');
    Object.assign(flight.style, {left: `${source.left}px`, top: `${source.top}px`, width: `${source.width}px`, height: `${source.height}px`});
    veil = document.createElement('div');
    veil.className = 'travel-veil';
    const backdrop = intro.querySelector('.character-stage');
    if (backdrop) {
      const resting = backdrop.cloneNode(true);
      resting.style.display = 'block';
      // Freeze the current light and constellation positions as they recede.
      // This avoids resetting the reveal backdrop when the photograph lifts.
      const originals = [backdrop, ...backdrop.querySelectorAll('*')];
      const copies = [resting, ...resting.querySelectorAll('*')];
      originals.forEach((element, index) => {
        const style = getComputedStyle(element);
        Object.assign(copies[index].style, {animation: 'none', opacity: style.opacity, transform: style.transform});
      });
      veil.append(resting);
    }
    intro.append(veil, flight);
    setStage('travelling');
    status.textContent = 'Your wish becomes the first page of your story.';
    // The photograph stays in view while the world behind it becomes the desk.
    animate(veil, [{opacity: 1}, {opacity: 0}], 1000);
    const scale = innerWidth > 900 ? .58 : .7;
    // Keep the tilted photograph centered on its path with a top-left origin.
    const angle = -7 * Math.PI / 180;
    const x = innerWidth * (innerWidth > 900 ? .62 : .5) - source.left - scale * (source.width * Math.cos(angle) - source.height * Math.sin(angle)) / 2;
    const y = innerHeight * .43 - source.top - scale * (source.width * Math.sin(angle) + source.height * Math.cos(angle)) / 2;
    const hover = `translate(${x}px, ${y}px) scale(${scale}) rotate(-7deg)`;
    const lifting = animate(flight, [{transform: 'none'}, {transform: hover}], 950);
    const opening = window.BIRTHDAY_BOOK?.open();
    destination = window.BIRTHDAY_BOOK?.portrait();
    destination?.classList.add('portrait-in-transit');
    await Promise.all([lifting, opening]);
    if (ticket !== journey || !intro.open) return;
    destination = window.BIRTHDAY_BOOK?.portrait();
    if (destination) {
      const bounds = destination.getBoundingClientRect();
      if (bounds.top < 20 || bounds.bottom > innerHeight - 20) destination.scrollIntoView({block: 'center', behavior: 'instant'});
    }
    // The print lands on the image, not on the surrounding paper mount.
    const target = destination?.querySelector('img').getBoundingClientRect();
    flight.classList.add('is-landing');
    const landing = target
      ? `translate(${target.left - source.left}px, ${target.top - source.top}px) scale(${target.width / source.width}, ${target.height / source.height}) rotate(0deg)`
      : `translate(${innerWidth / 2 - source.left - source.width / 2}px, ${y + 60}px) scale(.12) rotate(0deg)`;
    await animate(flight, [{transform: hover, opacity: 1}, {transform: landing, opacity: target ? 1 : 0}], 800);
    if (ticket !== journey || !intro.open) return;
    destination?.classList.remove('portrait-in-transit');
    await animate(flight, [{opacity: target ? 1 : 0}, {opacity: 0}], 120, 'linear');
    if (ticket !== journey || !intro.open) return;
    intro.close();
    cleanupJourney();
    status.textContent = '';
    window.BIRTHDAY_BOOK?.focus();
  }

  const text = (id, value) => { document.getElementById(id).textContent = value; };
  text('revealEyebrow', config.eyebrow || 'A once-in-a-lifetime kind of wish');
  text('revealRecipient', window.BIRTHDAY_STORY.recipient);
  text('revealTitle', config.title || 'My favorite person.');
  text('revealSubtitle', config.subtitle || 'Of all the stars I could have wished for, I found you.');
  const fallback = 'assets/portrait-placeholder.svg';
  const imagePath = String(config.portrait || fallback);
  const allowed = /^(?:https?:\/\/|assets\/|\.\/assets\/)/i.test(imagePath) || /^data:image\/(?:svg\+xml|png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(imagePath);
  portrait.addEventListener('error', () => { if (portrait.getAttribute('src') !== fallback) portrait.src = fallback; });
  portrait.src = allowed ? imagePath : fallback;
  portrait.alt = config.portraitAlt || `A portrait of ${window.BIRTHDAY_STORY.recipient}`;

  function setStage(next) {
    stage = next;
    intro.dataset.stage = next;
    document.dispatchEvent(new CustomEvent('wishbound:intro'));
  }

  function showReveal() {
    clearTimeout(revealTimer);
    clearTimeout(manifestTimer);
    if (!intro.open || stage === 'leaving') return;
    invitation.hidden = true;
    reveal.hidden = false;
    setStage('revealed');
    enter.disabled = false; portraitReplay.disabled = false;
    intro.setAttribute('aria-labelledby', 'revealTitle');
    status.textContent = 'Five stars. Your birthday story is ready.';
    enter.focus({preventScroll: true});
  }

  function prepareReveal() {
    if (!intro.open || stage !== 'wishing') return;
    invitation.hidden = true;
    reveal.hidden = false;
    enter.disabled = true; portraitReplay.disabled = true;
    setStage('manifesting');
    status.textContent = 'Your wish, finding its way to you.';
  }

  function makeWish() {
    if (stage !== 'ready') return;
    start.disabled = true; portraitReplay.disabled = true;
    setStage('wishing');
    window.BIRTHDAY_WISH?.play();
    status.textContent = 'A little alchemy. A little courage.\nOne extraordinary you.';
    skip.focus({preventScroll: true});
    if (motion.matches) showReveal();
    else {
      manifestTimer = setTimeout(prepareReveal, window.BIRTHDAY_WISH?.timing.manifest ?? 2600);
      revealTimer = setTimeout(showReveal, window.BIRTHDAY_WISH?.timing.reveal ?? 3500);
    }
  }

  function finish(openBook) {
    if (!intro.open || stage === 'leaving') return;
    portraitReplay.disabled = true;
    clearTimeout(revealTimer);
    clearTimeout(manifestTimer);
    window.BIRTHDAY_WISH?.stop();
    if (stage === 'travelling') {
      cleanupJourney();
      intro.close();
      window.BIRTHDAY_BOOK?.focus();
      return;
    }
    if (openBook && stage === 'revealed' && !motion.matches) {
      carryPortrait();
      return;
    }
    setStage('leaving');
    const close = () => {
      intro.close();
      status.textContent = '';
      window.BIRTHDAY_BOOK?.focus();
      if (openBook) window.BIRTHDAY_BOOK?.open();
    };
    if (motion.matches) close();
    else leaveTimer = setTimeout(close, 400);
  }

  function showIntro(restart = false) {
    if (intro.open && !restart) return;
    cleanupJourney();
    clearTimeout(revealTimer);
    clearTimeout(manifestTimer);
    window.BIRTHDAY_WISH?.stop();
    clearTimeout(leaveTimer);
    invitation.hidden = false;
    reveal.hidden = true;
    start.disabled = false;
    enter.disabled = false; portraitReplay.disabled = true;
    status.textContent = '';
    intro.setAttribute('aria-labelledby', 'introTitle');
    setStage('ready');
    if (!intro.open) intro.showModal();
    document.dispatchEvent(new CustomEvent('wishbound:intro'));
    intro.scrollTop = 0;
    start.focus({preventScroll: true});
  }

  start.addEventListener('click', makeWish);
  skip.addEventListener('click', () => finish(false));
  enter.addEventListener('click', () => finish(true));
  replay.addEventListener('click', () => showIntro());
  portraitReplay.addEventListener('click', () => {
    if (!intro.open || stage !== 'revealed') return;
    showIntro(true);
    makeWish();
  });
  intro.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
  intro.addEventListener('close', () => { clearTimeout(revealTimer); clearTimeout(manifestTimer); clearTimeout(leaveTimer); cleanupJourney(); window.BIRTHDAY_WISH?.stop(); document.dispatchEvent(new CustomEvent('wishbound:intro')); });
  motion.addEventListener('change', event => {
    if (event.matches) window.BIRTHDAY_WISH?.stop();
    if (event.matches && ['wishing', 'manifesting'].includes(stage)) showReveal();
    if (event.matches && stage === 'travelling') finish(false);
  });
  window.addEventListener('resize', () => { if (stage === 'travelling') finish(false); });
  window.WISHBOUND_INTRO = {
    start: () => showIntro(true),
    reveal: () => { showIntro(true); showReveal(); }
  };
  replay.hidden = config.enabled === false;
  if (config.enabled !== false) showIntro();
  // Remove the first-paint cover only after the real modal is ready (or disabled).
  document.documentElement.removeAttribute('data-wishbound-starting');
})();
