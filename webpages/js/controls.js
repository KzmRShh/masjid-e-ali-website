import { switchView, duaData, parseTimestamp } from './renderer.js';

let pendingView = null;

export function initViewControls() {
  const audioPlayer = document.getElementById('audio-player');
  const modal       = document.getElementById('resume-modal');
  const resumeBtn   = document.getElementById('btn-resume');
  const restartBtn  = document.getElementById('btn-restart');
  const audioBtn    = document.getElementById('btn-resume-audio');
  const cancelBtn   = document.getElementById('btn-cancel');

  // Always wire up the Section/Verse buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.view; // "full" | "section" | "verse"

      if (next === 'section' || next === 'verse') {
        const key   = `dua-${next}`;
        const saved = localStorage.getItem(key) !== null;   // index saved?
        const audioAtStart = audioPlayer.currentTime === 0; // audio at 0:00?

        const showResumeRestart = saved;            // only if we have a saved index
        const showAudioOption   = !audioAtStart;    // only if audio has progressed

        // If neither option makes sense, skip modal
        if (!showResumeRestart && !showAudioOption) {
          return switchView(next);
        }

        // Otherwise, prep & show modal with only the applicable buttons
        pendingView = next;
        document.getElementById('resume-text').textContent =
          `What would you like to do with the ${next} view?`;

        // toggle visibility
        resumeBtn .classList.toggle('hidden', !showResumeRestart);
        restartBtn.classList.toggle('hidden', !showResumeRestart);
        audioBtn  .classList.toggle('hidden', !showAudioOption);
        cancelBtn?.classList.remove('hidden');

        modal.classList.remove('hidden');
        return; // stop here—don’t switch view yet
      }

      // Full view: go straight in
      switchView(next);
    });
  });

  // Resume where you left off
  resumeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (pendingView) switchView(pendingView);
    pendingView = null;
  });

  // Restart from the beginning
  restartBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    localStorage.setItem(`dua-${pendingView}`, 0);
    switchView(pendingView);
    pendingView = null;
  });

  // Go to Audio position
  audioBtn?.addEventListener('click', () => {
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
    } else {
      const flat = duaData.sections.flatMap(s => s.verses);
      const idx  = flat.findIndex(v =>
        parseTimestamp(v.timestamp.start) <= t &&
        parseTimestamp(v.timestamp.end)   > t
      );
      if (idx !== -1) localStorage.setItem(key, idx);
    }

    switchView(pendingView);
    pendingView = null;
  });

  // Cancel / backdrop / Escape
  cancelBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    pendingView = null;
  });
  modal?.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      pendingView = null;
    }
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      pendingView = null;
    }
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