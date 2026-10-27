/* Lost & Found uses one HTML document, one stylesheet, and this script. */
(() => {
  'use strict';

  const STORAGE_KEY = 'lost-found.daylight.v1';
  const MEMORY_SAVE_ERROR = "Your memory couldn't be saved. Copy your words before leaving this page, then try again.";
  const ARCHIVE_SAVE_ERROR = "Your changes couldn't be saved. Please try again.";
  const EMPTY_STORE = () => ({ next: 1, records: [], draft: null });
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const orbPage = $('#orb-main');
  const archivePage = $('#archive-main');
  const orbFooter = $('#orb-footer');
  const archiveFooter = $('#archive-footer');
  const skipLink = $('.skip-link');
  const orbNotice = $('#orb-notice');
  const archiveNotice = $('#archive-notice');

  const isValidStore = value => (
    value &&
    Number.isInteger(value.next) &&
    Array.isArray(value.records) &&
    Object.prototype.hasOwnProperty.call(value, 'draft')
  );

  let store;
  let storageReadError = '';

  try {
    store = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(EMPTY_STORE()));
    if (!isValidStore(store)) throw new Error('Invalid saved data');
  } catch {
    store = EMPTY_STORE();
    storageReadError = 'Your saved memories could not be read. Existing storage has not been overwritten.';
  }

  const showOrbMessage = text => { orbNotice.textContent = text; };
  const showArchiveMessage = text => { archiveNotice.textContent = text; };

  const save = (errorMessage, reportError) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch {
      reportError(errorMessage);
      return false;
    }
  };

  const mutate = (change, errorMessage, reportError) => {
    const previous = JSON.stringify(store);
    change();
    if (save(errorMessage, reportError)) return true;
    store = JSON.parse(previous);
    return false;
  };

  const memoryNumber = value => String(value).padStart(3, '0');
  const displayDate = iso => new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  });
  const createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  /* Memory Orb */
  let draft = store.draft;
  let fadeTimer = null;
  let wordsVisible = true;

  const setOrbState = name => {
    clearTimeout(fadeTimer);
    fadeTimer = null;
    $(`#${name}`).checked = true;
    orbPage.dataset.state = name;
    orbPage.classList.toggle('is-fading', name === 'fading');
  };

  const showHolding = () => {
    if (!draft) return;
    setOrbState('holding');
    wordsVisible = true;
    $('#held-words').textContent = draft.text;
    $('#held-words').hidden = false;
    $('#toggle-words').textContent = 'Hide Memory';
  };

  const renderArchiveSoon = () => {
    if (!archivePage.hidden) renderArchive();
  };

  const finishFading = () => {
    if (!draft) return;
    const record = { ...draft, status: 'released' };
    const saved = mutate(() => {
      store.records.unshift(record);
      store.draft = null;
    }, MEMORY_SAVE_ERROR, showOrbMessage);

    if (!saved) {
      showHolding();
      return;
    }

    draft = null;
    setOrbState('released');
    showOrbMessage('The smoke has cleared. Your memory remains in the archive.');
    renderArchiveSoon();
  };

  const startFading = () => {
    if (!draft) {
      showOrbMessage('Place a memory in the orb first.');
      return;
    }
    setOrbState('fading');
    showOrbMessage('The smoke is fading.');
    fadeTimer = setTimeout(finishFading, 3000);
  };

  $('#place').addEventListener('click', () => {
    const text = $('#memory').value.trim();
    if (!text) {
      showOrbMessage('Write a few words before placing your memory in the orb.');
      $('#memory').focus();
      return;
    }

    const next = {
      id: createId(),
      number: store.next,
      text,
      createdAt: new Date().toISOString()
    };

    const saved = mutate(() => {
      store.next += 1;
      store.draft = next;
    }, MEMORY_SAVE_ERROR, showOrbMessage);

    if (!saved) return;
    draft = next;
    showHolding();
    showOrbMessage('Your memory is here.');
  });

  $('#hold').addEventListener('click', () => {
    if (!draft) {
      showOrbMessage('Place a memory in the orb first.');
      return;
    }

    const record = { ...draft, status: 'held' };
    const saved = mutate(() => {
      store.records.unshift(record);
      store.draft = null;
    }, MEMORY_SAVE_ERROR, showOrbMessage);

    if (!saved) return;
    draft = null;
    setOrbState('empty');
    $('#memory').value = '';
    showOrbMessage('Saved to your archive as Held.');
    renderArchiveSoon();
  });

  $('#fade').addEventListener('click', startFading);
  $('#pause').addEventListener('click', () => {
    if (!draft) return;
    showHolding();
    showOrbMessage('Fading paused. Your memory is still held in the orb.');
  });
  $('#write').addEventListener('click', () => {
    setOrbState('empty');
    $('#memory').value = '';
    $('#memory').focus();
  });
  $('#toggle-words').addEventListener('click', () => {
    if (!draft) return;
    wordsVisible = !wordsVisible;
    $('#held-words').hidden = !wordsVisible;
    $('#toggle-words').textContent = wordsVisible ? 'Hide Memory' : 'Reveal Memory';
  });

  $('.dev-controls').hidden = new URLSearchParams(location.search).get('dev') !== '1';
  $('.state-picker').addEventListener('change', event => {
    if (draft) {
      showHolding();
      showOrbMessage('Finish your current memory before previewing states.');
      return;
    }
    setOrbState(event.target.id);
  });

  /* Memory Archive */
  let filter = 'all';
  let selected = store.records[0]?.id;
  let revealed = false;
  let deleteId = null;
  const archiveBody = $('#archive-main tbody');
  const recordDetail = $('#selected-record');
  const deleteDialog = $('#delete-dialog');
  const currentRecord = () => store.records.find(record => record.id === selected);

  function renderArchive() {
    const list = store.records.filter(record => filter === 'all' || record.status === filter);

    if (!list.some(record => record.id === selected)) {
      selected = list[0]?.id;
      revealed = false;
    }

    $$('[data-filter]').forEach(button => {
      const buttonFilter = button.dataset.filter;
      const count = store.records.filter(record => buttonFilter === 'all' || record.status === buttonFilter).length;
      const label = buttonFilter === 'all' ? 'All' : buttonFilter === 'held' ? 'Held' : 'Released';
      button.textContent = `${label} ${String(count).padStart(2, '0')}`;
      button.classList.toggle('selected', buttonFilter === filter);
      button.setAttribute('aria-pressed', String(buttonFilter === filter));
    });

    archiveBody.replaceChildren();

    if (!list.length) {
      const row = archiveBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 4;
      cell.textContent = filter === 'all'
        ? "No memories here yet. Begin with the orb, whenever you're ready."
        : filter === 'held' ? 'No held memories.' : 'No released memories.';

      if (!store.records.length) {
        cell.append(document.createElement('br'));
        const link = document.createElement('a');
        link.href = '#orb';
        link.dataset.viewLink = 'orb';
        link.className = 'text-link';
        link.textContent = 'Go to Memory Orb';
        cell.append(link);
      }
    }

    list.forEach(record => {
      const row = archiveBody.insertRow();
      row.classList.toggle('selected-row', record.id === selected);

      const recordCell = row.insertCell();
      const recordId = document.createElement('div');
      recordId.className = 'record-id';
      const orb = document.createElement('span');
      orb.className = 'mini-orb';
      const image = document.createElement('img');
      image.src = `assets/orb-${record.status === 'held' ? 'holding' : 'released'}.png`;
      image.alt = '';
      orb.append(image);
      recordId.append(orb, document.createTextNode(`Memory No. ${memoryNumber(record.number)}`));
      recordCell.append(recordId);

      const time = document.createElement('time');
      time.dateTime = record.createdAt;
      time.textContent = displayDate(record.createdAt);
      row.insertCell().append(time);
      row.insertCell().textContent = record.status === 'held' ? 'Held' : 'Released';

      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'quiet text-link';
      openButton.textContent = 'Open Record';
      openButton.setAttribute('aria-label', `Open Memory No. ${memoryNumber(record.number)}`);
      openButton.addEventListener('click', () => {
        selected = record.id;
        revealed = false;
        renderArchive();
      });
      row.insertCell().append(openButton);
      row.addEventListener('click', event => {
        if (event.target.closest('button')) return;
        selected = record.id;
        revealed = false;
        renderArchive();
      });
    });

    const record = currentRecord();
    recordDetail.hidden = !record;
    if (!record) return;

    $('#record-title').textContent = `Memory No. ${memoryNumber(record.number)}`;
    const detailTime = $('.record-detail time');
    detailTime.dateTime = record.createdAt;
    detailTime.textContent = displayDate(record.createdAt);
    $('.record-detail .status').textContent = record.status === 'held' ? 'Held' : 'Released';

    const detailImage = $('.detail-orb img');
    detailImage.src = `assets/orb-${record.status === 'held' ? 'holding' : 'released'}.png`;
    detailImage.alt = record.status === 'held' ? 'Smoke held in a glass orb' : 'Clear glass orb';

    const isHeld = record.status === 'held';
    $('#reveal').hidden = !isHeld;
    $('#reveal').textContent = revealed ? 'Hide Memory' : 'Reveal Memory';
    $('#restore').hidden = isHeld;
    $('.reveal-row span').textContent = isHeld
      ? 'Kept here, for whenever you choose to return.'
      : 'The smoke has faded. You can still bring this memory back.';
    $('#archive-words').hidden = !(revealed && isHeld);
    $('#archive-words').textContent = revealed && isHeld ? record.text : '';
  }

  $$('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      revealed = false;
      renderArchive();
    });
  });

  $('#reveal').addEventListener('click', () => {
    if (currentRecord()?.status !== 'held') return;
    revealed = !revealed;
    renderArchive();
  });

  $('#restore').addEventListener('click', () => {
    const record = currentRecord();
    if (!record || record.status !== 'released') return;

    const saved = mutate(() => {
      record.status = 'held';
      record.restoredAt = new Date().toISOString();
    }, ARCHIVE_SAVE_ERROR, showArchiveMessage);

    if (!saved) return;
    filter = 'all';
    revealed = true;
    renderArchive();
    showArchiveMessage('Restored to Held. Your memory is now visible.');
  });

  $('#delete').addEventListener('click', () => {
    deleteId = selected;
    deleteDialog.showModal();
    $('#cancel-delete').focus();
  });
  $('#cancel-delete').addEventListener('click', () => {
    deleteId = null;
    deleteDialog.close();
  });
  deleteDialog.addEventListener('cancel', () => { deleteId = null; });
  $('#confirm-delete').addEventListener('click', () => {
    if (!deleteId) return;
    const saved = mutate(() => {
      store.records = store.records.filter(record => record.id !== deleteId);
    }, ARCHIVE_SAVE_ERROR, showArchiveMessage);

    if (!saved) return;
    deleteId = null;
    deleteDialog.close();
    revealed = false;
    renderArchive();
    showArchiveMessage('Memory permanently deleted.');
  });

  /* Single-page navigation */
  let focusNextView = false;

  const showView = (view, focus = false) => {
    const archiveIsOpen = view === 'archive';
    document.body.classList.toggle('orb-view', !archiveIsOpen);
    document.body.classList.toggle('archive-view', archiveIsOpen);
    orbPage.hidden = archiveIsOpen;
    archivePage.hidden = !archiveIsOpen;
    orbFooter.hidden = archiveIsOpen;
    archiveFooter.hidden = !archiveIsOpen;
    skipLink.href = archiveIsOpen ? '#archive-main' : '#orb-main';

    $$('.site-header nav [data-view-link]').forEach(link => {
      if (link.dataset.viewLink === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.title = archiveIsOpen
      ? 'Memory Archive — Lost & Found'
      : 'What would you like to leave here? — Lost & Found';

    if (archiveIsOpen) renderArchive();
    if (focus) (archiveIsOpen ? archivePage : orbPage).focus();
  };

  document.addEventListener('click', event => {
    const link = event.target.closest('[data-view-link]');
    if (!link) return;
    event.preventDefault();
    const view = link.dataset.viewLink;
    focusNextView = true;
    if (location.hash === `#${view}`) {
      showView(view, true);
      focusNextView = false;
    } else {
      location.hash = view;
    }
  });

  window.addEventListener('hashchange', () => {
    const view = location.hash === '#archive' ? 'archive' : 'orb';
    showView(view, focusNextView);
    focusNextView = false;
  });

  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    try {
      const nextStore = event.newValue ? JSON.parse(event.newValue) : EMPTY_STORE();
      if (!isValidStore(nextStore)) throw new Error('Invalid saved data');
      store = nextStore;
      draft = store.draft;
      if (draft) showHolding();
      renderArchive();
    } catch {
      showArchiveMessage(ARCHIVE_SAVE_ERROR);
    }
  });

  if (draft) showHolding();
  else setOrbState('empty');
  renderArchive();
  showView(location.hash === '#archive' ? 'archive' : 'orb');
  if (storageReadError) showOrbMessage(storageReadError);
})();
