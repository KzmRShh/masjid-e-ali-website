// controls.js

import { switchView, duaData, parseTimestamp } from './renderer.js';

let pendingView = null;

export function initViewControls() {
  const audioPlayer = document.getElementById('audio-player');
  const modal       = document.getElementById('resume-modal');
  const resumeBtn   = document.getElementById('btn-resume');
  const restartBtn  = document.getElementById('btn-restart');
  const audioBtn    = document.getElementById('btn-resume-audio');
  const cancelBtn   = document.getElementById('btn-cancel');

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.view; // "full" | "section" | "verse"

      if (next === 'section' || next === 'verse') {
        const key           = `dua-${next}`;
        const savedIndex    = Number(localStorage.getItem(key));
        const hasSavedIndex = savedIndex > 0;                 // only treat >0 as saved
        const audioAtStart  = audioPlayer.currentTime === 0;  // no audio progress

        const showResumeRestart = hasSavedIndex;
        const showAudioOption   = !audioAtStart;

        // If no option is relevant, go straight to view
        if (!showResumeRestart && !showAudioOption) {
          switchView(next);
          return;
        }

        // Otherwise, show modal with only applicable buttons
        pendingView = next;
        document.getElementById('resume-text').textContent =
          `What would you like to do with the ${next} view?`;

        resumeBtn  .classList.toggle('hidden', !showResumeRestart);
        restartBtn .classList.toggle('hidden', !showResumeRestart);
        audioBtn   .classList.toggle('hidden', !showAudioOption);
        cancelBtn?.classList.remove('hidden');
        modal.classList.remove('hidden');
        return;
      }

      // Full view: switch immediately
      switchView(next);
    });
  });

  // Modal button handlers
  resumeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (pendingView) switchView(pendingView);
    pendingView = null;
  });

  restartBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    // clear saved index so it's treated as "first"
    localStorage.removeItem(`dua-${pendingView}`);
    switchView(pendingView);
    pendingView = null;
  });

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
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
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