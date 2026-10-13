'use strict';
(() => {
  const state = window.WISHBOUND;
  state.refresh();
  if (window.WISHBOUND_GIFT) {
    document.querySelectorAll('[data-editor-ui]').forEach(node => node.remove());
    return;
  }
  const $ = id => document.getElementById(id);
  const textDialog = $('giftTextDialog'); const imageDialog = $('giftImageDialog');
  let editing = false; let textPath; let imagePath; let cropImage; let imageTicket = 0;
  let ownDraft = state.snapshot(); let draftActive = false;
  let saveTimer; let db; let revision = 0; let saving = Promise.resolve();
  const draftKey = 'current:' + location.pathname.replace(/(?:index|ONE_FILE_PREVIEW)\.html$/i, '');
  const status = message => { $('giftSaveStatus').textContent = message; };
  const error = (id, message = '') => { $(id).hidden = !message; $(id).textContent = message; };

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('wishbound-gifts', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('Draft storage is blocked.'));
    });
  }
  function readDraft(database) {
    return new Promise((resolve, reject) => {
      const request = database.transaction('drafts').objectStore('drafts').get(draftKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function writeDraft(database, value) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('drafts', 'readwrite');
      transaction.objectStore('drafts').put(value, draftKey);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || Error('Draft could not be saved.'));
    });
  }
  function saveNow() {
    clearTimeout(saveTimer);
    if (!draftActive) return saving;
    ownDraft = state.snapshot();
    const version = revision; const snapshot = state.snapshot();
    saving = saving.catch(() => {}).then(async () => {
      if (!db) { status('Download your gift to keep it. Browser saving is unavailable.'); return; }
      try {
        await writeDraft(db, {version: 1, story: snapshot});
        if (version === revision) status('Saved in this browser.');
      } catch { status('Draft could not be saved. Download your gift to keep it.'); }
    });
    return saving;
  }
  function changed() {
    revision++; ownDraft = state.snapshot(); state.refresh(); status('Saving your draft…');
    clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250);
  }
  function decorate() {
    document.querySelectorAll('[data-story-text], img[data-story-image]').forEach(node => {
      if (editing) { node.tabIndex = 0; node.setAttribute('role', 'button'); node.setAttribute('aria-label', node.matches('img') ? 'Replace this photo' : 'Edit this text'); }
      else { node.removeAttribute('tabindex'); node.removeAttribute('role'); node.removeAttribute('aria-label'); }
    });
  }
  // Dialogs live in the browser's top layer. Keep the editor controls inside
  // the opening dialog while it is open so they stay visible and usable.
  function syncEditorView() {
    const intro = $('wishIntro');
    const host = intro.open ? intro : document.body;
    for (const id of ['giftToolbar', 'giftPreviewNote']) {
      const node = $(id); if (node.parentElement !== host) host.append(node);
    }
    $('giftViewSelect').value = !intro.open ? 'book' : intro.dataset.stage === 'ready' ? 'opening' : 'reveal';
  }
  function setEditing(value, preview = false) {
    editing = value; document.body.classList.toggle('is-editing', value);
    document.body.classList.toggle('is-gift-preview', preview);
    document.body.dataset.giftMode = draftActive ? (preview ? 'preview' : 'draft') : 'template';
    $('giftToolbar').hidden = !value; $('giftPreviewNote').hidden = !preview;
    $('editGift').hidden = $('introEditGift').hidden = value || preview;
    syncEditorView(); decorate();
  }
  function beginEditing() {
    if (!draftActive) {
      state.reset(); state.apply(ownDraft); draftActive = true; state.refresh();
    }
    window.BIRTHDAY_BOOK?.beginning();
    setEditing(true);
    window.WISHBOUND_INTRO?.start();
  }
  function backToTemplate() {
    saveNow(); // Capture the draft before restoring the original demo.
    draftActive = false; state.reset(); window.BIRTHDAY_BOOK?.beginning();
    setEditing(false); window.WISHBOUND_INTRO?.start();
  }
  document.body.dataset.giftMode = 'template';
  document.addEventListener('wishbound:refresh', decorate);
  document.addEventListener('wishbound:intro', syncEditorView);
  $('editGift').addEventListener('click', beginEditing);
  $('introEditGift').addEventListener('click', beginEditing);
  $('giftBackButton').addEventListener('click', () => setEditing(true));
  $('giftDemoButton').addEventListener('click', backToTemplate);
  $('giftPreviewDemoButton').addEventListener('click', backToTemplate);
  $('giftViewSelect').addEventListener('change', event => {
    if (event.target.value === 'opening') window.WISHBOUND_INTRO?.start();
    else if (event.target.value === 'reveal') window.WISHBOUND_INTRO?.reveal();
    else if ($('wishIntro').open) $('skipIntro').click();
  });
  $('giftSaveButton').addEventListener('click', async () => {
    const button = $('giftSaveButton');
    button.disabled = true; button.textContent = 'Saving…';
    status('Saving in this browser…');
    try { await saveNow(); }
    finally { button.disabled = false; button.textContent = 'Save draft'; }
  });
  $('giftPreviewButton').addEventListener('click', () => {
    saveNow(); window.BIRTHDAY_BOOK?.beginning(); setEditing(false, true);
    if (state.story.reveal.enabled !== false) window.WISHBOUND_INTRO?.start();
    else if ($('wishIntro').open) $('skipIntro').click();
  });

  function openText(path) {
    textPath = path; const letter = path === 'letter.paragraphs';
    $('giftTextTitle').textContent = letter ? 'Write your letter' : 'Edit your words';
    $('giftTextHelp').textContent = letter ? 'Separate paragraphs with a blank line.' : 'Keep it personal. Shorter text fits the book best.';
    $('giftTextValue').maxLength = letter ? 20000 : 5000;
    $('giftTextValue').value = letter ? state.story.letter.paragraphs.join('\n\n') : state.get(path);
    error('giftTextError'); textDialog.showModal(); $('giftTextValue').focus();
  }
  $('giftTextForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const value = $('giftTextValue').value;
      state.set(textPath, textPath === 'letter.paragraphs' ? value.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : value);
      changed(); textDialog.close();
    } catch (e) { error('giftTextError', e.message); }
  });
  $('giftLetterButton').addEventListener('click', () => openText('letter.paragraphs'));

  function field(parent, path, label, multiline = false) {
    const wrap = document.createElement('div'); const title = document.createElement('label');
    const input = document.createElement(multiline ? 'textarea' : 'input');
    input.id = 'gift-field-' + path.replaceAll('.', '-'); input.dataset.field = path;
    if (!multiline) input.type = 'text'; input.maxLength = 5000; input.value = state.get(path);
    title.htmlFor = input.id; title.textContent = label; wrap.append(title, input); parent.append(wrap);
  }
  $('giftDetailsButton').addEventListener('click', () => {
    const basic = $('giftDetailsFields'); const all = $('giftAllTextFields'); basic.replaceChildren(); all.replaceChildren();
    field(basic, 'recipient', 'Birthday celebrant'); field(basic, 'signoff', 'Your name');
    const label = document.createElement('label'); const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.id = 'giftIntroEnabled'; checkbox.checked = state.story.reveal.enabled;
    label.append(checkbox, document.createTextNode('Play the opening wish')); basic.append(label);
    state.story.chapterNames.forEach((_, i) => field(basic, 'chapterNames.' + i, 'Chapter ' + (i + 1) + ' label'));
    for (const [path, label] of [['reveal.eyebrow','Reveal introduction'],['reveal.title','Reveal heading'],['reveal.subtitle','Reveal message'],['letter.greeting','Letter greeting']]) field(all, path, label, true);
    for (const [key, value] of Object.entries(state.story.presentation)) field(all, 'presentation.' + key, key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()), true);
    for (const [key, value] of Object.entries(state.story.copy)) field(all, 'copy.' + key, value.replace(/\n/g, ' ').slice(0, 75) || 'Chapter text', true);
    error('giftDetailsError'); $('giftDetailsDialog').showModal();
  });
  $('giftDetailsForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      $('giftDetailsForm').querySelectorAll('[data-field]').forEach(input => state.set(input.dataset.field, input.value));
      state.set('reveal.enabled', $('giftIntroEnabled').checked); changed(); $('giftDetailsDialog').close();
    } catch (e) { error('giftDetailsError', e.message); }
  });

  function openImage(path) {
    imagePath = path; imageTicket++; cropImage = null;
    $('giftImageTitle').textContent = 'Replace photo · ' + state.photoSlot(path).label;
    $('giftImageFile').value = ''; $('giftCropPreview').hidden = true; $('giftCropControls').hidden = true;
    $('giftImageApply').disabled = true;
    $('giftImageAlt').value = state.get(state.photoSlot(path).altPath);
    error('giftImageError'); imageDialog.showModal();
  }
  function drawCrop() {
    if (!cropImage) return;
    const canvas = $('giftCropPreview'); const portrait = state.photoSlot(imagePath).portrait;
    canvas.width = portrait ? 900 : 1200; canvas.height = 1200;
    const scale = Math.max(canvas.width / cropImage.naturalWidth, canvas.height / cropImage.naturalHeight) * Number($('giftCropZoom').value);
    const width = cropImage.naturalWidth * scale; const height = cropImage.naturalHeight * scale;
    const x = -(width - canvas.width) / 2 * (1 + Number($('giftCropX').value) / 100);
    const y = -(height - canvas.height) / 2 * (1 + Number($('giftCropY').value) / 100);
    const context = canvas.getContext('2d'); context.fillStyle = '#f6eedb'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(cropImage, x, y, width, height);
  }
  for (const id of ['giftCropZoom','giftCropX','giftCropY']) $(id).addEventListener('input', drawCrop);
  $('giftImageFile').addEventListener('change', async () => {
    const file = $('giftImageFile').files[0]; if (!file) return;
    const ticket = ++imageTicket; cropImage = null; $('giftImageApply').disabled = true;
    $('giftCropPreview').hidden = true; $('giftCropControls').hidden = true; error('giftImageError');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
      error('giftImageError', 'Choose a JPG, PNG, or WebP photo smaller than 20 MB.'); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      if (ticket !== imageTicket || !imageDialog.open) return;
      if (image.naturalWidth * image.naturalHeight > 60e6) throw Error('This photo is too large. Choose a smaller copy.');
      cropImage = image; $('giftCropZoom').value = '1'; $('giftCropX').value = $('giftCropY').value = '0';
      drawCrop(); $('giftCropPreview').hidden = false; $('giftCropControls').hidden = false; $('giftImageApply').disabled = false;
    } catch (e) { if (ticket === imageTicket) error('giftImageError', e.message || 'This image could not be opened. Try another photo.'); }
    finally { URL.revokeObjectURL(url); }
  });
  $('giftImageForm').addEventListener('submit', event => {
    event.preventDefault(); if (!cropImage) return;
    try {
      state.set(imagePath, $('giftCropPreview').toDataURL('image/jpeg', .88));
      state.set(state.photoSlot(imagePath).altPath, $('giftImageAlt').value);
      changed(); imageDialog.close();
    } catch (e) { error('giftImageError', e.message); }
  });
  $('giftImageDefault').addEventListener('click', () => {
    const value = imagePath.split('.').reduce((obj, key) => obj[key], state.defaults);
    state.set(imagePath, value);
    const altPath = state.photoSlot(imagePath).altPath;
    state.set(altPath, altPath.split('.').reduce((obj, key) => obj[key], state.defaults));
    changed(); imageDialog.close();
  });
  imageDialog.addEventListener('close', () => { imageTicket++; cropImage = null; });
  $('giftPhotosButton').addEventListener('click', () => {
    const grid = $('giftPhotoGrid'); grid.replaceChildren();
    state.photoSlots.forEach(({path, label}) => {
      const button = document.createElement('button'); button.type = 'button';
      const img = document.createElement('img'); img.src = state.get(path); img.alt = '';
      button.append(img, document.createTextNode(label));
      button.addEventListener('click', () => { $('giftPhotosDialog').close(); openImage(path); }); grid.append(button);
    });
    $('giftPhotosDialog').showModal();
  });

  function editTarget(event) {
    if (!editing || event.target.closest('[data-editor-ui]')) return;
    const node = event.target.closest('[data-story-text], img[data-story-image]'); if (!node) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (node.matches('img')) openImage(node.dataset.storyImage); else openText(node.dataset.storyText);
  }
  document.addEventListener('click', editTarget, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.target.matches('[data-story-text], img[data-story-image]')) editTarget(event);
    }
  }, true);
  document.querySelectorAll('[data-close-editor]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('giftResetButton').addEventListener('click', () => $('giftResetDialog').showModal());
  $('giftConfirmReset').addEventListener('click', () => { state.reset(); changed(); $('giftResetDialog').close(); });

  const blobData = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
  async function exportGift() {
    await saveNow();
    let markup = state.template;
    if (!markup.includes('data-wishbound-source="story-config.js"')) {
      if (location.protocol === 'file:') throw Error('Open ONE_FILE_PREVIEW.html to download a complete gift, or use the live preview. Your edits stay saved in this browser.');
      const response = await fetch('ONE_FILE_PREVIEW.html'); if (!response.ok) throw Error('The portable template could not be loaded. Use the live preview to download your gift.');
      markup = await response.text();
    }
    const snapshot = state.snapshot();
    async function embed(value) {
      if (!/^(?:assets\/|\.\/assets\/)/i.test(value)) return value;
      const response = await fetch(value); if (!response.ok) throw Error('A photo could not be included. Replace it with an upload and try again.');
      return blobData(await response.blob());
    }
    snapshot.reveal.portrait = await embed(snapshot.reveal.portrait);
    snapshot.photos = await Promise.all(snapshot.photos.map(embed));
    const doc = new DOMParser().parseFromString(markup, 'text/html');
    // The template snapshot may have been captured while the opening was booting.
    doc.documentElement.removeAttribute('data-wishbound-starting');
    const config = doc.querySelector('script[data-wishbound-source="story-config.js"]');
    if (!config) throw Error('The portable template is unavailable. Please refresh the live preview.');
    const json = JSON.stringify(snapshot).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    config.textContent = `document.addEventListener('DOMContentLoaded', () => { window.BIRTHDAY_STORY = ${json}; window.WISHBOUND_GIFT = true; });`;
    // A gift with its wish disabled opens straight to the book, including first paint.
    if (snapshot.reveal.enabled === false) doc.getElementById('wishboundStartup')?.setAttribute('data-enabled', 'false');
    doc.querySelectorAll('[data-editor-ui]').forEach(node => node.remove());
    const html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    const blob = new Blob([html], {type:'text/html;charset=utf-8'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); const name = snapshot.recipient.normalize('NFKD').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,40) || 'you';
    a.href = url; a.download = 'wishbound-for-' + name.toLowerCase() + '.html'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000); status('Gift downloaded. Open the HTML file to check it before sharing.');
  }
  $('giftDownloadButton').addEventListener('click', async () => {
    const button = $('giftDownloadButton'); button.disabled = true; button.textContent = 'Preparing…';
    try { await exportGift(); } catch (e) { status(e.message || 'Download failed. Please try again.'); }
    finally { button.disabled = false; button.textContent = 'Download gift'; }
  });

  (async () => {
    try {
      db = await openDatabase(); const saved = await readDraft(db);
      if (saved?.version === 1 && saved.story && revision === 0) {
        ownDraft = state.clone(saved.story);
        status('Your saved draft is ready. Only your copy changes.');
      }
    } catch { status('Download your gift to keep it. Browser saving is unavailable.'); }
    $('editGift').hidden = $('introEditGift').hidden = false;
  })();
})();
