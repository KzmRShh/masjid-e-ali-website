export let duaData;
export let viewType = 'full';
let currentIndex = 0;
let flatVerses = [];
const versesContainer = document.getElementById('verses-container');
const viewBtns = Array.from(document.querySelectorAll('.view-btn'));
const textToggles = {
  arabic:   document.querySelector('button[data-class="arabic"]').classList.contains('active'),
  english:  document.querySelector('button[data-class="english"]').classList.contains('active'),
  transliteration: document.querySelector('button[data-class="transliteration"]').classList.contains('active'),
  urdu:     document.querySelector('button[data-class="urdu"]').classList.contains('active'),
};

export async function fetchDua(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    duaData = await res.json();
    flatVerses = duaData.sections.flatMap(s => s.verses);
    renderView();
  } catch (err) {
    showError(err);
  }
}

export function switchView(type) {
  viewBtns.forEach(b => b.classList.toggle('active', b.dataset.view === type));
  viewType = type;
  currentIndex = Number(localStorage.getItem(`dua-${type}`)) || 0;
  renderView();
}

function renderView() {
  versesContainer.innerHTML = '';
  const fragment = document.createDocumentFragment();

  if (viewType === 'full') {
    duaData.sections.forEach(sec => {
      fragment.appendChild(makeSection(sec.sectionName, sec.verses));
    });
  } else {
    const items = viewType === 'section'
      ? [duaData.sections[currentIndex]]
      : [{ sectionName: findSectionName(flatVerses[currentIndex].id), verses: [flatVerses[currentIndex]] }];

    items.forEach(sec =>
      fragment.appendChild(makeSection(sec.sectionName, sec.verses))
    );
    fragment.appendChild(makeNav(items[0].verses, flatVerses.length));
  }

  versesContainer.appendChild(fragment);
}

function makeSection(titleText, verses) {
  const wrapper = document.createElement('div');
  wrapper.className = 'section-wrapper';
  wrapper.appendChild(Object.assign(document.createElement('h2'), { textContent: titleText }));

  const frag = document.createDocumentFragment();
  const parser = parseTimestamp;
  verses.forEach(v => {
    const div = document.createElement('div');
    div.className = 'verse';
    div.dataset.start = parser(v.timestamp.start);
    div.dataset.end   = parser(v.timestamp.end);

    // verse number
    const num = Object.assign(document.createElement('span'), {
      className: 'verse-number',
      textContent: v.verseNumber
    });
    div.appendChild(num);

    // content paragraphs
    ['arabic','english','transliteration','urdu'].forEach(cls => {
      const p = document.createElement('p');
      if (!textToggles[cls] && cls !== 'arabic') p.classList.add('hidden');
      p.classList.add(cls);
      p.textContent = (
        cls==='arabic' ? v.arabic
      : cls==='english' ? v['english-translation']
      : cls==='transliteration' ? v.transliteration
      : v['urdu-translation']
      );
      div.appendChild(p);
    });

    // seek button
    const btn = Object.assign(document.createElement('button'), {
      className: 'seek-btn',
      title: 'Play from here',
      textContent: '►',
      dataset: { start: parser(v.timestamp.start) }
    });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('audio-player').currentTime = btn.dataset.start;
      document.getElementById('audio-player').play();
    });

    div.appendChild(btn);
    frag.appendChild(div);
  });

  wrapper.appendChild(frag);
  return wrapper;
}

function makeNav(items, total) {
  const nav = document.createElement('div');
  nav.className = 'nav-arrows';
  const prev = createNavBtn('←', currentIndex > 0, () => updateIndex(-1, total));
  const next = createNavBtn('→', currentIndex < total - 1, () => updateIndex(1, total));
  nav.append(prev, next);
  return nav;
}

function createNavBtn(symbol, enabled, cb) {
  return Object.assign(document.createElement('button'), {
    textContent: symbol,
    disabled: !enabled,
    onclick: () => { cb(); renderView(); }
  });
}

function updateIndex(delta, total) {
  currentIndex = Math.max(0, Math.min(currentIndex + delta, total - 1));
  localStorage.setItem(`dua-${viewType}`, currentIndex);
}

function findSectionName(verseId) {
  for (const sec of duaData.sections) {
    if (sec.verses.some(v => v.id === verseId)) return sec.sectionName;
  }
}

export function parseTimestamp(ts) {
  const [m, s] = ts.split(':').map(Number);
  return m * 60 + s;
}

// Arrow and space handlers
export function handleLeftArrow()  { viewAction(-1); }
export function handleRightArrow() { viewAction( 1); }
export function handleSpace()      { const a = document.getElementById('audio-player'); a[a.paused?'play':'pause'](); }

function viewAction(delta) {
  if (viewType === 'full') {
    const a = document.getElementById('audio-player');
    a.currentTime = Math.max(0, a.currentTime + delta * 10);
  } else {
    updateIndex(delta, viewType==='section'
      ? duaData.sections.length
      : flatVerses.length
    );
    renderView();
  }
}