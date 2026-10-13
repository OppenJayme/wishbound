/* Wishbound visitor-owned soundtrack & background settings (no server uploads). */
'use strict';
(() => {
  if (!document.querySelector('.topbar-right')) return;
  const media = window.WISHBOUND_EMBED_MEDIA || {};
  const scope = window.WISHBOUND_GIFT_ID ? 'gift:' + window.WISHBOUND_GIFT_ID : 'page:' + location.pathname;
  const prefKey = 'wishbound-media-v1:' + scope;
  const maxBytes = 15 * 1024 * 1024;
  const defaults = {volume: 35, enabled: true, theme: 'storm', customMusic: false, customBackground: false};
  let prefs = {...defaults};
  try { const old = JSON.parse(localStorage.getItem(prefKey) || 'null'); if (old && typeof old === 'object') prefs = {...defaults, ...old}; } catch (_) {}
  prefs.volume = Number.isFinite(+prefs.volume) ? Math.max(0,Math.min(100,+prefs.volume)) : 35;
  if (!['storm','alchemy','crimson'].includes(prefs.theme)) prefs.theme = 'storm';
  let musicBlob = null, backgroundBlob = null, musicUrl = '', backgroundUrl = '';
  let bookOpened = false;
  let defaultMusic = typeof media.music === 'string' && media.music.startsWith('data:audio/') ? media.music : '';
  let defaultImage = typeof media.background === 'string' && media.background.startsWith('data:image/') ? media.background : '';
  const audio = document.createElement('audio'); audio.loop = true; audio.preload = 'none'; audio.id = 'visitorMusicAudio';
  document.body.append(audio);
  const background = document.createElement('div'); background.id='visitorMediaBackground'; background.setAttribute('aria-hidden','true'); document.body.prepend(background);
  document.querySelector('.topbar-right').insertAdjacentHTML('beforeend', '<div class="visitor-music-controls"><button type="button" id="visitorMusicPlay" aria-label="Play music" title="Play or pause music">♫</button><button type="button" id="visitorMusicEdit" aria-haspopup="dialog" aria-controls="visitorMusicDialog">♫ Music &amp; background</button></div>');
  document.body.insertAdjacentHTML('beforeend', '<dialog id="visitorMusicDialog" aria-labelledby="visitorMusicTitle"><div class="visitor-music-panel"><button class="visitor-dialog-close" type="button" id="visitorMusicClose" aria-label="Close music settings">×</button><span class="visitor-kicker">YOUR PERSONAL WISHBOUND</span><h2 id="visitorMusicTitle">Music &amp; scenery</h2><p>Make this birthday story your own. Your files stay in this browser, not on the public website.</p><p class="visitor-current" id="visitorTrackName">No soundtrack selected</p><div class="visitor-actions"><button type="button" id="visitorMusicDialogPlay">▶ Play / Pause</button><label class="visitor-upload" for="visitorMusicFile">Choose music<input type="file" id="visitorMusicFile" accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm" /></label><button type="button" id="visitorMusicReset">Remove my music</button></div><label class="visitor-range">Volume <output id="visitorVolumeLabel">35%</output><input id="visitorMusicVolume" type="range" min="0" max="100" step="1" value="35"/></label><label class="visitor-check"><input type="checkbox" id="visitorMusicEnabled" checked/> Enable music when opening the book</label><h3>Background</h3><div class="visitor-choices"><label><input type="radio" name="visitorTheme" value="storm" checked/> Stormy seas</label><label><input type="radio" name="visitorTheme" value="alchemy"/> Alchemy night</label><label><input type="radio" name="visitorTheme" value="crimson"/> Crimson voyage</label></div><div class="visitor-actions"><label class="visitor-upload" for="visitorBackgroundFile">Choose an image<input type="file" id="visitorBackgroundFile" accept="image/jpeg,image/png,image/webp,image/avif"/></label><button type="button" id="visitorBackgroundReset">Remove image</button></div><p class="visitor-note">Audio starts after a book-opening click, subject to browser playback settings. Supported files up to 15 MB. Your downloaded gift includes your selected audio and background.</p><div id="visitorMusicStatus" role="status" aria-live="polite"></div></div></dialog>');
  const $ = id => document.getElementById(id);
  const status = message => { $('visitorMusicStatus').textContent = message; };
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
    audio.pause();
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
    for (const input of document.querySelectorAll('input[name="visitorTheme"]')) input.checked = input.value === prefs.theme;
  }
  function play() {
    if (!audio.src) { $('visitorMusicDialog').showModal(); status('Choose your music first. The public template does not contain copyrighted game audio.'); return; }
    if (!prefs.enabled) { prefs.enabled = true; save(); }
    const promise = audio.play();
    if (promise && promise.catch) promise.catch(() => status('Playback was blocked. Press Play again to start your music.'));
  }
  function toggle() { audio.paused ? play() : audio.pause(); }
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
  $('visitorMusicDialogPlay').onclick = toggle;
  audio.addEventListener('play',syncButtons); audio.addEventListener('pause',syncButtons); audio.addEventListener('ended',syncButtons);
  $('visitorMusicVolume').oninput = e => { prefs.volume = +e.target.value; audio.volume=prefs.volume/100; save(); syncButtons(); };
  $('visitorMusicEnabled').onchange = e => { prefs.enabled=e.target.checked; save(); if (!prefs.enabled) audio.pause(); else if (bookOpened && audio.src) play(); syncButtons(); };
  for (const input of document.querySelectorAll('input[name="visitorTheme"]')) input.onchange = () => { if (input.checked) { prefs.theme=input.value; save(); applyTheme(); } };
  $('visitorMusicFile').onchange = async e => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value='';
    if (file.size > maxBytes || !(file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|webm)$/i.test(file.name))) {status('Choose a supported audio file smaller than 15 MB.');return;}
    musicBlob=file; prefs.customMusic=true; save();
    chooseAudio(URL.createObjectURL(file),file.name);
    try { await store('put','music',file); status('Music saved in this browser. It will also be included when you download your gift.'); }
    catch (_) { status('Music works for this visit and downloads, but browser storage could not save it.'); }
    if (bookOpened && prefs.enabled) play();
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
  document.addEventListener('click',e => {
    if (e.target.closest('#enterBook,#skipIntro,#cornerNext,#nextBtn,.cover')) {
      if (document.body.dataset.giftMode === 'draft') return;
      if (!bookOpened) { bookOpened = true; if (prefs.enabled && audio.src) play(); }
    }
  },true);
  document.addEventListener('keydown',e => {
    if (e.key==='ArrowRight' && !bookOpened && !e.altKey && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,select,[contenteditable]') && !$('wishIntro')?.open) {
      bookOpened=true; if (prefs.enabled && audio.src) play();
    }
  },true);
  function blobData(blob) { return new Promise((resolve,reject) => {const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);}); }
  window.WISHBOUND_MEDIA = {
    async exportToDocument(doc) {
      const music = musicBlob ? await blobData(musicBlob) : defaultMusic;
      const bg = backgroundBlob ? await blobData(backgroundBlob) : defaultImage;
      const data = JSON.stringify({music,background:bg,volume:prefs.volume,enabled:prefs.enabled,theme:prefs.theme}).replace(/</g,'\\u003c');
      doc.getElementById('wishboundEmbeddedMedia')?.remove();
      const node=doc.createElement('script');node.id='wishboundEmbeddedMedia';node.textContent='window.WISHBOUND_EMBED_MEDIA='+data+';';
      doc.head.append(node);
    }
  };
  async function init() {
    audio.volume=prefs.volume/100; applyTheme();
    if (media && Number.isFinite(+media.volume)) { prefs.volume=+media.volume; audio.volume=prefs.volume/100; }
    if (media && media.enabled === false) prefs.enabled=false;
    if (media && ['storm','alchemy','crimson'].includes(media.theme)) prefs.theme=media.theme;
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