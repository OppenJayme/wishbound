/* Wishbound visitor-owned soundtrack & background settings (no server uploads). */
'use strict';
(() => {
  if (!document.querySelector('.topbar-right')) return;
  const media = window.WISHBOUND_EMBED_MEDIA || {};
  const config = window.BIRTHDAY_STORY.music || {};
  const clampVolume = value => Number.isFinite(+value) ? Math.max(0, Math.min(100, +value)) : 35;
  const validAudio = src => typeof src === 'string' && /^(?:assets\/|\.\/assets\/|https?:\/\/|data:audio\/)/i.test(src);
  const scope = window.WISHBOUND_GIFT_ID ? 'gift:' + window.WISHBOUND_GIFT_ID : 'page:' + location.pathname;
  const prefKey = 'wishbound-media-v1:' + scope;
  const maxBytes = 15 * 1024 * 1024;
  const defaults = {volume: clampVolume(media.volume ?? config.volume ?? 35), enabled: media.enabled ?? config.enabled ?? true, startAt: media.startAt || config.startAt || 'portrait', theme: media.theme || 'storm', customMusic: false, customBackground: false};
  let prefs = {...defaults};
  try { const old = JSON.parse(localStorage.getItem(prefKey) || 'null'); if (old && typeof old === 'object') prefs = {...defaults, ...old}; } catch (_) {}
  prefs.volume = Number.isFinite(+prefs.volume) ? Math.max(0,Math.min(100,+prefs.volume)) : 35;
  if (!['storm','alchemy','crimson'].includes(prefs.theme)) prefs.theme = 'storm';
  let musicBlob = null, backgroundBlob = null, musicUrl = '', backgroundUrl = '';
  if (!['portrait','book'].includes(prefs.startAt)) prefs.startAt = 'portrait';
  let bookOpened = false, manuallyPaused = false, fadeFrame = 0, playbackTicket = 0;
  const fadeMs = Number.isFinite(+config.fadeMs) ? Math.max(0, Math.min(5000, +config.fadeMs)) : 1200;
  let defaultMusic = validAudio(media.music) ? media.music : validAudio(config.src) ? config.src : '';
  let defaultImage = typeof media.background === 'string' && media.background.startsWith('data:image/') ? media.background : '';
  const audio = document.createElement('audio'); audio.loop = config.loop !== false; audio.preload = 'none'; audio.id = 'visitorMusicAudio';
  document.body.append(audio);
  const background = document.createElement('div'); background.id='visitorMediaBackground'; background.setAttribute('aria-hidden','true'); document.body.prepend(background);
  document.querySelector('.topbar-right').insertAdjacentHTML('beforeend', '<div class="visitor-music-controls"><button type="button" id="visitorMusicPlay" aria-label="Play music" title="Play or pause music">♫</button><button type="button" id="visitorMusicEdit" aria-haspopup="dialog" aria-controls="visitorMusicDialog">♫ Music &amp; background</button></div>');
  document.body.insertAdjacentHTML('beforeend', '<dialog id="visitorMusicDialog" aria-labelledby="visitorMusicTitle"><div class="visitor-music-panel"><button class="visitor-dialog-close" type="button" id="visitorMusicClose" aria-label="Close music settings">×</button><span class="visitor-kicker">YOUR PERSONAL WISHBOUND</span><h2 id="visitorMusicTitle">Music &amp; scenery</h2><p>Make this birthday story your own. Your files stay in this browser, not on the public website.</p><p class="visitor-current" id="visitorTrackName">No soundtrack selected</p><div class="visitor-actions"><button type="button" id="visitorMusicDialogPlay">▶ Play / Pause</button><label class="visitor-upload" for="visitorMusicFile">Choose music<input type="file" id="visitorMusicFile" accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm" /></label><button type="button" id="visitorMusicReset">Remove my music</button></div><label class="visitor-range">Volume <output id="visitorVolumeLabel">35%</output><input id="visitorMusicVolume" type="range" min="0" max="100" step="1" value="35"/></label><label class="visitor-check"><input type="checkbox" id="visitorMusicEnabled" checked/> Enable background music</label><label class="visitor-range">Start music at <select id="visitorMusicStart"><option value="portrait">Portrait reveal</option><option value="book">Book opening</option></select></label><h3>Background</h3><div class="visitor-choices"><label><input type="radio" name="visitorTheme" value="storm" checked/> Stormy seas</label><label><input type="radio" name="visitorTheme" value="alchemy"/> Alchemy night</label><label><input type="radio" name="visitorTheme" value="crimson"/> Crimson voyage</label></div><div class="visitor-actions"><label class="visitor-upload" for="visitorBackgroundFile">Choose an image<input type="file" id="visitorBackgroundFile" accept="image/jpeg,image/png,image/webp,image/avif"/></label><button type="button" id="visitorBackgroundReset">Remove image</button></div><p class="visitor-note">Music fades in at your chosen scene after you interact. You can pause it anytime. If your browser blocks it, press Play. Supported files up to 15 MB. Your downloaded gift includes your selected audio and background.</p><div id="visitorMusicStatus" role="status" aria-live="polite"></div></div></dialog>');
  const revealControls = document.createElement('div');
  revealControls.className = 'visitor-reveal-controls';
  revealControls.hidden = true;
  revealControls.innerHTML = '<button type="button" id="visitorRevealMusic">Play music</button><span id="visitorRevealMusicStatus" role="status" aria-live="polite"></span>';
  document.querySelector('#introReveal .reveal-copy')?.append(revealControls);
  const $ = id => document.getElementById(id);
  const status = message => { $('visitorMusicStatus').textContent = message; };
  const playbackStatus = message => { status(message); $('visitorRevealMusicStatus').textContent = message; };
  const save = () => { try { localStorage.setItem(prefKey, JSON.stringify(prefs)); } catch (_) { status('Browser storage is unavailable; these settings may not survive reloading.'); } };
  const dbName = 'wishbound-visitor-media';
  function store(action,key,value) {
    return new Promise((resolve,reject) => {
      if (!window.indexedDB) return reject(Error('Storage not supported'));
      const r = indexedDB.open(dbName,1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('files')) r.result.createObjectStore('files'); };
      r.onerror = () => reject(r.error);
      r.onsuccess = () => {
        const db = r.result, tx = db.transaction('files',action === 'get' ? 'readonly' : 'readwrite');
        const q = action === 'get' ? tx.objectStore('files').get(scope+':'+key) : action === 'put' ? tx.objectStore('files').put(value,scope+':'+key) : tx.objectStore('files').delete(scope+':'+key);
        q.onsuccess = () => { if (action === 'get') resolve(q.result || null); };
        tx.oncomplete = () => { db.close(); if (action !== 'get') resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
    });
  }
  function chooseAudio(src,label) {
    pause();
    manuallyPaused = false;
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    musicUrl = src && src.startsWith('blob:') ? src : '';
    audio.removeAttribute('src');
    if (src) audio.src = src;
    audio.load();
    $('visitorTrackName').textContent = label || 'No soundtrack selected';
    syncButtons();
  }
  function syncButtons() {
    const playing = !audio.paused && !audio.ended;
    $('visitorMusicPlay').textContent = playing ? 'Ⅱ' : '♫';
    $('visitorMusicPlay').setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    $('visitorMusicDialogPlay').textContent = playing ? 'Ⅱ Pause' : '▶ Play';
    $('visitorMusicVolume').value = String(prefs.volume);
    $('visitorVolumeLabel').textContent = Math.round(prefs.volume)+'%';
    $('visitorMusicEnabled').checked = prefs.enabled !== false;
    $('visitorMusicStart').value = prefs.startAt;
    revealControls.hidden = !audio.getAttribute('src');
    const audible = playing && audio.volume > 0;
    $('visitorRevealMusic').textContent = audible ? 'Pause music' : 'Play music';
    $('visitorRevealMusic').setAttribute('aria-label', audible ? 'Pause background music' : 'Play background music');
    for (const input of document.querySelectorAll('input[name="visitorTheme"]')) input.checked = input.value === prefs.theme;
  }
  function cancelFade() { cancelAnimationFrame(fadeFrame); fadeFrame = 0; }
  function fadeToVolume() {
    cancelFade();
    const from = audio.volume, to = prefs.volume / 100, began = performance.now();
    function tick(now) {
      const p = fadeMs ? Math.min(1, (now - began) / fadeMs) : 1;
      audio.volume = from + (to - from) * p * p * (3 - 2 * p);
      if (p < 1 && !audio.paused) fadeFrame = requestAnimationFrame(tick);
      else { fadeFrame = 0; syncButtons(); }
    }
    tick(began);
  }
  function pause(manual = false) {
    playbackTicket++; cancelFade(); audio.pause();
    if (manual) manuallyPaused = true;
    syncButtons();
  }
  function play(silent = false, automatic = false) {
    if (!audio.getAttribute('src')) {
      if (!automatic) { $('visitorMusicDialog').showModal(); status('Choose a soundtrack first.'); }
      return;
    }
    if (automatic && (!prefs.enabled || manuallyPaused || document.body.dataset.giftMode === 'draft')) return;
    if (!automatic) { manuallyPaused = false; prefs.enabled = true; save(); }
    if (!audio.paused) { if (!silent) fadeToVolume(); return; }
    cancelFade(); audio.volume = 0;
    const ticket = ++playbackTicket;
    // Starting silently inside the wish click keeps delayed reveal playback gesture-authorized.
    const promise = audio.play();
    if (promise) promise.then(() => {
      if (ticket !== playbackTicket) return;
      $('visitorRevealMusicStatus').textContent = '';
      if (/^(Press Play|This track)/.test($('visitorMusicStatus').textContent)) status('');
      if (!silent || $('wishIntro')?.dataset.stage === 'revealed' || bookOpened) fadeToVolume();
    }).catch(error => {
      if (ticket !== playbackTicket || error.name === 'AbortError') return;
      playbackStatus(error.name === 'NotAllowedError' ? 'Press Play music to start the soundtrack.' : 'This track could not play. Choose another audio file.');
      syncButtons();
    });
  }
  function toggle() { (!audio.paused && audio.volume > 0) ? pause(true) : play(); }
  function applyBackground(blobOrData) {
    if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
    backgroundUrl = '';
    background.style.backgroundImage = '';
    if (!blobOrData) return;
    const url = typeof blobOrData === 'string' ? blobOrData : URL.createObjectURL(blobOrData);
    if (url.startsWith('blob:')) backgroundUrl = url;
    background.style.backgroundImage = 'linear-gradient(#0a16235e,#0b122ac2),url("' + url + '")';
  }
  function applyTheme() {
    document.body.dataset.visitorTheme = prefs.theme;
    syncButtons();
  }
  $('visitorMusicEdit').onclick = () => $('visitorMusicDialog').showModal();
  $('visitorMusicClose').onclick = () => $('visitorMusicDialog').close();
  $('visitorMusicDialog').onclick = e => { if (e.target === $('visitorMusicDialog')) e.target.close(); };
  $('visitorMusicPlay').onclick = toggle;
  $('visitorRevealMusic').onclick = toggle;
  $('visitorMusicDialogPlay').onclick = toggle;
  audio.addEventListener('play',syncButtons); audio.addEventListener('pause',syncButtons); audio.addEventListener('ended',syncButtons);
  $('visitorMusicVolume').oninput = e => { cancelFade(); prefs.volume = clampVolume(e.target.value); audio.volume=prefs.volume/100; save(); syncButtons(); };
  $('visitorMusicStart').onchange = e => { prefs.startAt=e.target.value; save(); };
  audio.addEventListener('error', () => { cancelFade(); playbackStatus('This track could not load. Choose another audio file.'); syncButtons(); });
  $('visitorMusicEnabled').onchange = e => { prefs.enabled=e.target.checked; save(); if (!prefs.enabled) pause(true); else if ((bookOpened || $('wishIntro')?.dataset.stage === 'revealed') && audio.src) play(); syncButtons(); };
  for (const input of document.querySelectorAll('input[name="visitorTheme"]')) input.onchange = () => { if (input.checked) { prefs.theme=input.value; save(); applyTheme(); } };
  $('visitorMusicFile').onchange = async e => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value='';
    if (file.size > maxBytes || !(file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|webm)$/i.test(file.name))) {status('Choose a supported audio file smaller than 15 MB.');return;}
    const mime = {mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',ogg:'audio/ogg',webm:'audio/webm'};
    musicBlob = file.type.startsWith('audio/') ? file : new Blob([file], {type:mime[file.name.split('.').pop().toLowerCase()]});
    prefs.customMusic=true; save();
    chooseAudio(URL.createObjectURL(musicBlob),file.name);
    try { await store('put','music',musicBlob); status('Music saved in this browser. It will also be included when you download your gift.'); }
    catch (_) { status('Music works for this visit and downloads, but browser storage could not save it.'); }
    if ((bookOpened || $('wishIntro')?.dataset.stage === 'revealed') && prefs.enabled) play();
  };
  $('visitorMusicReset').onclick = async () => {
    musicBlob=null; prefs.customMusic=false; save(); chooseAudio(defaultMusic,defaultMusic?'Included gift soundtrack':'No soundtrack selected');
    try { await store('delete','music'); } catch (_) {}
    status('Your uploaded music was removed.'); 
  };
  $('visitorBackgroundFile').onchange = async e => {
    const file=e.target.files?.[0]; if (!file) return; e.target.value='';
    if (file.size > maxBytes || !/^image\/(png|jpeg|webp|avif)$/.test(file.type)) {status('Choose a JPG, PNG, WebP, or AVIF image smaller than 15 MB.');return;}
    backgroundBlob=file; prefs.customBackground=true; save(); applyBackground(file);
    try {await store('put','background',file); status('Background saved in this browser and will be included in downloads.');}
    catch (_) {status('Background works for this visit and downloads; this browser could not persist it.');}
  };
  $('visitorBackgroundReset').onclick = async () => {
    backgroundBlob=null; prefs.customBackground=false; save(); applyBackground(defaultImage);
    try {await store('delete','background');}catch(_){}
    status('Custom background removed.');
  };
  const canAutoStart = () => document.body.dataset.giftMode !== 'draft' && prefs.enabled && !manuallyPaused;
  document.addEventListener('click', e => {
    if (!canAutoStart()) return;
    if (e.target.closest('#startWish,#replayPortraitWish') && prefs.startAt === 'portrait') play(true, true);
    if (e.target.closest('#enterBook,#skipIntro,#cornerNext,#nextBtn,.cover')) {
      bookOpened = true; play(false, true);
    }
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,select,[contenteditable]') && !$('wishIntro')?.open && canAutoStart()) {
      bookOpened = true; play(false, true);
    }
  }, true);
  document.addEventListener('wishbound:intro', () => {
    const intro = $('wishIntro');
    if (intro?.open && intro.dataset.stage === 'revealed' && prefs.startAt === 'portrait' && canAutoStart()) play(false, true);
    if (!intro?.open && !audio.paused && audio.volume === 0 && !bookOpened) pause();
  });
  document.addEventListener('wishbound:refresh', () => {
    if (document.body.dataset.giftMode === 'draft') pause();
  });
  function blobData(blob) { return new Promise((resolve,reject) => {const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);}); }
  window.WISHBOUND_MEDIA = {
    async exportToDocument(doc) {
      let music = musicBlob ? await blobData(musicBlob) : defaultMusic;
      if (music && !music.startsWith('data:')) {
        const response = await fetch(music);
        if (!response.ok) throw Error('The soundtrack could not be included. Upload it in Music & background before downloading.');
        const blob = await response.blob();
        if (blob.size > maxBytes) throw Error('Choose a soundtrack smaller than 15 MB.');
        music = await blobData(new Blob([blob], {type:blob.type.startsWith('audio/') ? blob.type : 'audio/mpeg'}));
      }
      const bg = backgroundBlob ? await blobData(backgroundBlob) : defaultImage;
      const data = JSON.stringify({music,background:bg,volume:prefs.volume,enabled:prefs.enabled,startAt:prefs.startAt,theme:prefs.theme}).replace(/</g,'\\u003c');
      doc.getElementById('wishboundEmbeddedMedia')?.remove();
      const node=doc.createElement('script');node.id='wishboundEmbeddedMedia';node.textContent='window.WISHBOUND_EMBED_MEDIA='+data+';';
      doc.head.append(node);
    }
  };
  async function init() {
    audio.volume=prefs.volume/100; applyTheme();
    if (defaultImage) applyBackground(defaultImage);
    if (defaultMusic) chooseAudio(defaultMusic,'Included gift soundtrack');
    // Public owner may optionally supply licensed site audio at this path.
    if (!defaultMusic && location.protocol!=='file:') {
      try { const r=await fetch('assets/liyue-theme.mp3',{method:'HEAD'}); if (r.ok) { defaultMusic='assets/liyue-theme.mp3'; if (!prefs.customMusic) chooseAudio(defaultMusic,'Liyue theme · site soundtrack'); } }
      catch (_) {}
    }
    if (prefs.customMusic) {
      try { const f=await store('get','music'); if(f){musicBlob=f;chooseAudio(URL.createObjectURL(f),f.name || 'Your uploaded music');} else {prefs.customMusic=false;save();} }
      catch (_) {status('Could not restore previous music; choose the file again.');}
    }
    if (prefs.customBackground) {
      try {const b=await store('get','background');if(b){backgroundBlob=b;applyBackground(b);} else {prefs.customBackground=false;save();} }
      catch (_) {status('Could not restore the previous background; choose the image again.');}
    }
    applyTheme(); syncButtons();
  }
  init();
})();
