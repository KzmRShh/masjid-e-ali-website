import { switchView, duaData, parseTimestamp } from './renderer.js';

let pendingView = null;

// Compute the end time of the first section
function getFirstSectionEnd() {
  if (!duaData?.sections?.length) return 0;
  return duaData.sections[0].verses
    .reduce((max, v) => Math.max(max, parseTimestamp(v.timestamp.end)), 0);
}

// Compute the end time of the first verse
function getFirstVerseEnd() {
  if (!duaData?.sections?.length) return 0;
  const firstVerse = duaData.sections[0].verses[0];
  return parseTimestamp(firstVerse.timestamp.end);
}

export function initViewControls() {
  const audioPlayer = document.getElementById('audio-player');
  const modal       = document.getElementById('resume-modal');
  const resumeBtn   = document.getElementById('btn-resume');
  const restartBtn  = document.getElementById('btn-restart');
  const resumeAudio = document.getElementById('btn-resume-audio');
  const cancelBtn   = document.getElementById('btn-cancel');

  // Bail out if modal elements are missing
  if (!modal || !resumeBtn || !restartBtn || !resumeAudio || !cancelBtn) {
    console.warn('Resume modal elements not found in DOM. Skipping view controls.');
    return;
  }

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.view;             // "full" | "section" | "verse"
      const key  = `dua-${next}`;                // matches storage keys

      const stored     = parseInt(localStorage.getItem(key) || '0', 10);
      const progressed = (next === 'section')
        ? audioPlayer.currentTime > getFirstSectionEnd()
        : (next === 'verse')
          ? audioPlayer.currentTime > getFirstVerseEnd()
          : false;

      const showStoredModal    = stored > 0;
      const showProgressedOnly = !showStoredModal && progressed;

      if (showStoredModal || showProgressedOnly) {
        pendingView = next;
        document.getElementById('resume-text').textContent =
          showStoredModal
            ? `Resume ${next} where you left off?`
            : `Resume ${next} from where audio ended?`;

        // Toggle button visibility
        resumeBtn.classList.toggle('hidden', !showStoredModal);
        restartBtn.classList.toggle('hidden', !showStoredModal);
        resumeAudio.classList.toggle('hidden', !showProgressedOnly);
        cancelBtn.classList.remove('hidden');
        modal.classList.remove('hidden');
      } else {
        switchView(next);
      }
    });
  });

  // RESUME
  resumeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (pendingView) {
      switchView(pendingView);
      pendingView = null;
    }
  });

  // RESTART
  restartBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    localStorage.removeItem('dua-section');
    localStorage.removeItem('dua-verse');
    switchView(pendingView || 'full');
    pendingView = null;
  });

  // RESUME FROM AUDIO
  resumeAudio.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (!pendingView) return;

    const t   = audioPlayer.currentTime;
    const key = `dua-${pendingView}`;
    if (pendingView === 'section') {
      duaData.sections.forEach((sec, idx) => {
        if (sec.verses.some(v =>
            parseTimestamp(v.timestamp.start) <= t &&
            parseTimestamp(v.timestamp.end)   > t
        )) {
          localStorage.setItem(key, idx);
        }
      });
    } else if (pendingView === 'verse') {
      const flat = duaData.sections.flatMap(s => s.verses);
      const idx  = flat.findIndex(v =>
        parseTimestamp(v.timestamp.start) <= t &&
        parseTimestamp(v.timestamp.end)   > t
      );
      if (idx !== -1) {
        localStorage.setItem(key, idx);
      }
    }

    switchView(pendingView);
    pendingView = null;
  });

  // CANCEL
  cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
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
