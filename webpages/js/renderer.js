export let duaData;
let currentSection = 0;
let currentVerse = 0;
let viewType = 'full';

/*
    Fetches Dua JSON and renders initial view.
*/
export async function fetchDua(path) {
    const container = document.getElementById('verses-container');

    try {
        const res = await fetch(path);
        if (!res.ok) {
            throw new Error(`Network error: ${res.status} ${res.statusText}`);
        }
        duaData = await res.json();
        renderView();
        return duaData;
    } catch (err) {
        console.error('Failed to load Dua:', err);
        // Hide other controls so user focuses on the error.
        document.getElementById('view-controls').style.display = 'none';
        document.getElementById('controls').style.display = 'none';
        document.getElementById('audio-bar').style.display = 'none';

        // Show an error banner with a retry button.
        container.innerHTML = `
          <div class="error-banner">
            <p>⚠️ Sorry, we couldn’t load the content.<br>${err.message}</p>
            <button id="retry-btn">Retry</button>
          </div>
        `;

        document.getElementById('retry-btn').addEventListener('click', async () => {
            // Clear the banner, restore controls, and retry.
            container.innerHTML = '';
            document.getElementById('view-controls').style.display = '';
            document.getElementById('controls').style.display = '';
            document.getElementById('audio-bar').style.display = '';
            await fetchDua(path);
        });
    }
}

/*
    Switches to a given view type and re-renders.
*/
export function switchView(type) {
    if (type === 'section') {
        currentSection = parseInt(localStorage.getItem('dua-currentSection') || '0', 10);
    } else if (type === 'verse') {
        currentVerse   = parseInt(localStorage.getItem('dua-currentVerse')   || '0', 10);
    }
    
    const activeBtn = document.querySelector('.view-btn.active');
    if (activeBtn) activeBtn.classList.remove('active');
    const nextBtn = document.querySelector(`.view-btn[data-view="${type}"]`);
    if (nextBtn) nextBtn.classList.add('active');
    viewType = type;
    renderView();
}

/*
    Renders current viewType into the container.
*/
export function renderView() {
    const container = document.getElementById('verses-container');
    container.innerHTML = '';
    if (viewType === 'full') renderFull();
    else if (viewType === 'section') renderSection();
    else if (viewType === 'verse') renderVerse();
    updateDividers();
}

function renderFull() {
    duaData.sections.forEach(sec => {
        const wrapper = document.createElement('div');
        wrapper.className = 'section-wrapper';
        const title = document.createElement('h2');
        title.textContent = sec.sectionName;
        wrapper.appendChild(title);
        sec.verses.forEach(v => wrapper.appendChild(createVerseDiv(v)));
        document.getElementById('verses-container').appendChild(wrapper);
    });
}

function renderSection() {
    const sec = duaData.sections[currentSection];
    const wrapper = document.createElement('div');
    wrapper.className = 'section-wrapper';
    const title = document.createElement('h2');
    title.textContent = sec.sectionName;
    wrapper.appendChild(title);
    sec.verses.forEach(v => wrapper.appendChild(createVerseDiv(v)));
    document.getElementById('verses-container').appendChild(wrapper);

    const nav = document.createElement('div');
    nav.className = 'nav-arrows';
    const prev = document.createElement('button');
    prev.textContent = '←';
    prev.disabled = currentSection === 0;
    prev.onclick = () => {
        currentSection--;
        localStorage.setItem('dua-currentSection', currentSection);
        renderView();
    };
    const next = document.createElement('button');
    next.textContent = '→';
    next.disabled = currentSection === duaData.sections.length - 1;
    next.onclick = () => {
        currentSection++;
        localStorage.setItem('dua-currentSection', currentSection);
        renderView();
    };
    nav.append(prev, next);
    document.getElementById('verses-container').appendChild(nav);
}

function renderVerse() {
    const flat = duaData.sections.flatMap(s => s.verses);
    const verse = flat[currentVerse];
    const sectionIndex = duaData.sections.findIndex(s =>
    s.verses.some(v => v.id === verse.id)
    );
    const wrapper = document.createElement('div');
    wrapper.className = 'section-wrapper';
    const title = document.createElement('h2');
    title.textContent = duaData.sections[sectionIndex].sectionName;
    wrapper.appendChild(title);
    wrapper.appendChild(createVerseDiv(verse));
    document.getElementById('verses-container').appendChild(wrapper);

    const nav = document.createElement('div');
    nav.className = 'nav-arrows';
    const prev = document.createElement('button');
    prev.textContent = '←';
    prev.disabled = currentVerse === 0;
    prev.onclick = () => {
        currentVerse--;
        localStorage.setItem('dua-currentVerse', currentVerse);
        renderView();
    };
    const next = document.createElement('button');
    next.textContent = '→';
    next.disabled = currentVerse === flat.length - 1;
    next.onclick = () => {
        currentVerse++;
        localStorage.setItem('dua-currentVerse', currentVerse);
        renderView();
    };
    nav.append(prev, next);
    document.getElementById('verses-container').appendChild(nav);
}

function parseTimestamp(ts) {
    const [mins, secs] = ts.split(':').map(Number);
    return mins * 60 + secs;
}

function createVerseDiv(v) {
    const div = document.createElement('div');
    div.className = 'verse';

    div.dataset.start = parseTimestamp(v.timestamp.start);
    div.dataset.end   = parseTimestamp(v.timestamp.end);

    const num = document.createElement('span');
    num.className = 'verse-number';
    num.textContent = v.verseNumber;
    div.appendChild(num);

    ['arabic', 'english', 'transliteration', 'urdu'].forEach(cls => {
        const btn = document.querySelector(`button[data-class="${cls}"]`);
        const p = document.createElement('p');
        p.className = cls + (cls !== 'arabic' && !btn.classList.contains('active') ? ' hidden' : '');
        p.textContent =
            cls === 'arabic' ? v.arabic :
            cls === 'english' ? v['english-translation'] :
            cls === 'transliteration' ? v.transliteration :
            v['urdu-translation'];
        div.appendChild(p);
    });

    const seekBtn = document.createElement('button');
    seekBtn.className = 'seek-btn';
    seekBtn.title     = 'Play from here';
    seekBtn.textContent = '►';
    seekBtn.dataset.start = parseTimestamp(v.timestamp.start);

    div.appendChild(seekBtn);
    return div;
}

function updateDividers() {
    document.querySelectorAll('.verse').forEach(v => {
        v.querySelectorAll('hr').forEach(hr => hr.remove());
        const visible = Array.from(v.querySelectorAll('p')).filter(p =>
            !p.classList.contains('hidden')
        );
        visible.slice(1).forEach(p => v.insertBefore(document.createElement('hr'), p));
    });
}
