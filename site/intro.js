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
  const welcome = document.getElementById('birthdayWelcome');
  const welcomeCanvas = document.getElementById('birthdayStarlight');
  const welcomeContinue = document.getElementById('birthdayContinue');
  const welcomeContext = welcomeCanvas.getContext('2d');
  let welcomeTimer, welcomeExitTimer, welcomeFrame = 0;
  let welcomeWidth = 0, welcomeHeight = 0;
  let revealTimer;
  let manifestTimer;
  let leaveTimer;
  let stage = 'ready';
  let journey = 0;
  let flight;
  let veil;
  let destination;
  const animations = new Set();

  function splitBirthdayTitle() {
    let order = 0;
    const lines = [...welcome.querySelectorAll('[data-birthday-letters]')];
    document.getElementById('birthdayTitle').setAttribute('aria-label', lines.map(line => line.textContent).join(' '));
    if (!intro.dataset.welcome || motion.matches) return;
    lines.forEach(line => {
      const value = line.textContent;
      // Keep unusually long custom greetings as ordinary wrapping text.
      if (value.length > 80) return;
      const fragment = document.createDocumentFragment();
      for (const letter of Array.from(value)) {
        const glyph = document.createElement('span');
        glyph.className = 'birthday-letter'; glyph.textContent = letter;
        glyph.setAttribute('aria-hidden', 'true');
        glyph.style.setProperty('--letter-order', order++);
        fragment.append(glyph);
      }
      line.replaceChildren(fragment);
    });
  }

  function resizeWelcome() {
    welcomeWidth = document.documentElement.clientWidth;
    welcomeHeight = innerHeight;
    const density = Math.min(devicePixelRatio || 1, 1.5);
    welcomeCanvas.width = Math.round(welcomeWidth * density);
    welcomeCanvas.height = Math.round(welcomeHeight * density);
    welcomeContext?.setTransform(density, 0, 0, density, 0, 0);
  }

  function stopWelcome() {
    clearTimeout(welcomeTimer); clearTimeout(welcomeExitTimer);
    cancelAnimationFrame(welcomeFrame); welcomeFrame = 0;
    welcomeCanvas.dataset.active = 'false';
    welcomeContext?.clearRect(0, 0, welcomeWidth, welcomeHeight);
    welcome.hidden = true;
    delete intro.dataset.welcome;
  }

  function finishWelcome(immediate = false) {
    if (!intro.dataset.welcome || !intro.open) return;
    if (intro.dataset.welcome === 'leaving' && !immediate) return;
    clearTimeout(welcomeTimer);
    cancelAnimationFrame(welcomeFrame); welcomeFrame = 0;
    welcomeCanvas.dataset.active = 'false';
    const complete = () => {
      stopWelcome(); invitation.hidden = false; start.disabled = false;
      intro.setAttribute('aria-labelledby', 'introTitle');
      start.focus({preventScroll: true});
      document.dispatchEvent(new CustomEvent('wishbound:intro'));
    };
    if (immediate || motion.matches || intro.dataset.welcome === 'editing') complete();
    else {
      invitation.hidden = false;
      intro.dataset.welcome = 'leaving';
      welcomeExitTimer = setTimeout(complete, 800);
    }
  }

  function playWelcome() {
    welcome.hidden = false; invitation.hidden = true; start.disabled = true;
    intro.dataset.welcome = 'playing';
    intro.setAttribute('aria-labelledby', 'birthdayTitle');
    splitBirthdayTitle();
    welcomeContinue.focus({preventScroll: true});
    resizeWelcome();
    const began = performance.now();
    const seed = n => { const v = Math.sin(n * 127.1 + 31.7) * 43758.5453; return v - Math.floor(v); };
    const particles = Array.from({length: welcomeWidth < 600 ? 64 : 112}, (_, i) => ({
      angle: seed(i + 1) * Math.PI * 2,
      radius: .35 + seed(i + 7) * .8, depth: (seed(i + 13) - .5) * 360,
      size: .7 + seed(i + 23) * 1.8, blue: i % 9 === 0
    }));
    function draw(now) {
      if (!intro.open || intro.dataset.welcome !== 'playing' || !welcomeContext) return;
      const t = (now - began) / 1000;
      const expansion = 1 - Math.pow(1 - Math.min(1, t / 2), 3);
      const radius = Math.min(380, welcomeWidth * .43);
      welcomeContext.clearRect(0, 0, welcomeWidth, welcomeHeight);
      welcomeContext.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i], angle = p.angle + t * .12;
        // Rotate a cloud of points in 3D, then project it toward the camera.
        const x = Math.cos(angle) * radius * p.radius * (.1 + .9 * expansion);
        const z = p.depth + Math.sin(angle) * 90;
        const rotation = t * .16;
        const depth = z * Math.cos(rotation) - x * Math.sin(rotation);
        const perspective = 700 / (700 + depth);
        const px = welcomeWidth / 2 + (x * Math.cos(rotation) + z * Math.sin(rotation)) * perspective;
        const py = welcomeHeight * .44 + Math.sin(angle) * radius * p.radius * .7 * expansion * perspective;
        const size = p.size * perspective;
        const alpha = Math.min(1, t * 1.5) * (.22 + .45 * (Math.sin(t * 1.8 + i) * .5 + .5));
        welcomeContext.fillStyle = p.blue ? `rgba(142,214,231,${alpha})` : `rgba(246,212,154,${alpha})`;
        welcomeContext.beginPath();
        if (i % 7 === 0) {
          welcomeContext.moveTo(px, py - size * 3);
          welcomeContext.lineTo(px + size, py); welcomeContext.lineTo(px, py + size * 3); welcomeContext.lineTo(px - size, py);
        } else welcomeContext.arc(px, py, size, 0, Math.PI * 2);
        welcomeContext.closePath(); welcomeContext.fill();
      }
      welcomeFrame = requestAnimationFrame(draw);
    }
    if (welcomeContext) {
      welcomeCanvas.dataset.active = 'true';
      welcomeFrame = requestAnimationFrame(draw);
    }
    welcomeTimer = setTimeout(() => finishWelcome(), 3400);
  }

  document.addEventListener('wishbound:refresh', splitBirthdayTitle);
  welcomeContinue.addEventListener('click', () => finishWelcome());

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
  text('revealEyebrow', config.eyebrow || 'Some wishes become people');
  text('revealRecipient', window.BIRTHDAY_STORY.recipient);
  text('revealTitle', config.title || 'My brightest wish.');
  text('revealSubtitle', config.subtitle || 'Among all the wonderful things life could bring, I am grateful it brought me you.');
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
    stopWelcome();
    start.disabled = true; portraitReplay.disabled = true;
    setStage('wishing');
    window.BIRTHDAY_WISH?.play();
    status.textContent = 'A sky full of possibilities.\nA little birthday magic for you.';
    skip.focus({preventScroll: true});
    if (motion.matches) showReveal();
    else {
      manifestTimer = setTimeout(prepareReveal, window.BIRTHDAY_WISH?.timing.manifest ?? 2600);
      revealTimer = setTimeout(showReveal, window.BIRTHDAY_WISH?.timing.reveal ?? 3500);
    }
  }

  function finish(openBook) {
    if (!intro.open || stage === 'leaving') return;
    stopWelcome();
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

  function showIntro(restart = false, celebrate = false) {
    if (intro.open && !restart) return;
    stopWelcome();
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
    if (celebrate && !motion.matches) playWelcome();
    else start.focus({preventScroll: true});
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
  intro.addEventListener('close', () => { stopWelcome(); clearTimeout(revealTimer); clearTimeout(manifestTimer); clearTimeout(leaveTimer); cleanupJourney(); window.BIRTHDAY_WISH?.stop(); document.dispatchEvent(new CustomEvent('wishbound:intro')); });
  motion.addEventListener('change', event => {
    if (event.matches) finishWelcome(true);
    if (event.matches) window.BIRTHDAY_WISH?.stop();
    if (event.matches && ['wishing', 'manifesting'].includes(stage)) showReveal();
    if (event.matches && stage === 'travelling') finish(false);
  });
  window.addEventListener('resize', () => { if (stage === 'travelling') finish(false); });
  window.addEventListener('resize', () => { if (intro.dataset.welcome === 'playing') resizeWelcome(); });
  window.WISHBOUND_INTRO = {
    start: (celebrate = false) => showIntro(true, celebrate),
    reveal: () => { showIntro(true); showReveal(); },
    greeting: () => {
      showIntro(true); welcome.hidden = false; invitation.hidden = true;
      intro.dataset.welcome = 'editing';
      intro.setAttribute('aria-labelledby', 'birthdayTitle');
      splitBirthdayTitle();
      document.dispatchEvent(new CustomEvent('wishbound:intro'));
      welcomeContinue.focus({preventScroll: true});
    }
  };
  replay.hidden = config.enabled === false;
  if (config.enabled !== false) showIntro(false, true);
  else stopWelcome();
  // Remove the first-paint cover only after the real modal is ready (or disabled).
  document.documentElement.removeAttribute('data-wishbound-starting');
})();
