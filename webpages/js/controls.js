import { switchView, duaData, parseTimestamp } from './renderer.js';

let pendingView = null;

export function initViewControls() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.view;               // "full" | "section" | "verse"
      const key  = `dua-${next}`;                  // matches updateIndex storage keys

      if ((next === 'section' || next === 'verse') && localStorage.getItem(key)) {
        // show resume/restart modal
        pendingView = next;
        document.getElementById('resume-text').textContent =
          `Resume ${next} where you left off?`;
        document.getElementById('resume-modal').classList.remove('hidden');
      } else {
        // first time or full view → jump straight in
        switchView(next);
      }
    });
  });

  // RESUME button
  document.getElementById('btn-resume').addEventListener('click', () => {
    document.getElementById('resume-modal').classList.add('hidden');
    if (pendingView) {
      switchView(pendingView);
      pendingView = null;
    }
  });

  // RESTART button
  document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('resume-modal').classList.add('hidden');
    // clear saved positions
    localStorage.removeItem('dua-section');
    localStorage.removeItem('dua-verse');
    // fallback to full view if none
    switchView(pendingView || 'full');
    pendingView = null;
  });

  // RESUME FROM AUDIO button
  document.getElementById('btn-resume-audio').addEventListener('click', () => {
    document.getElementById('resume-modal').classList.add('hidden');
    if (!pendingView) return;

    const t = document.getElementById('audio-player').currentTime;

    if (pendingView === 'section') {
      duaData.sections.forEach((sec, idx) => {
        if (sec.verses.some(v =>
            parseTimestamp(v.timestamp.start) <= t &&
            parseTimestamp(v.timestamp.end)   > t
        )) {
          localStorage.setItem('dua-section', idx);
        }
      });
    } else {
      // verse
      const flat = duaData.sections.flatMap(s => s.verses);
      const idx  = flat.findIndex(v =>
        parseTimestamp(v.timestamp.start) <= t &&
        parseTimestamp(v.timestamp.end)   > t
      );
      if (idx !== -1) {
        localStorage.setItem('dua-verse', idx);
      }
    }

    switchView(pendingView);
    pendingView = null;
  });
}

export function initToggleControls() {
  document.querySelectorAll('.toggle-btn[data-class]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      document.querySelectorAll(`.${btn.dataset.class}`)
        .forEach(el => el.classList.toggle('hidden'));
    });
  });
}
