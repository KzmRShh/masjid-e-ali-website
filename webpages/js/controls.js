import { switchView, duaData, parseTimestamp } from './renderer.js';

let pendingView = null;

export function initViewControls() {
  const viewBtns    = Array.from(document.querySelectorAll('.view-btn'));
  const audioPlayer = document.getElementById('audio-player');
  const modal       = document.getElementById('resume-modal');
  const resumeBtn   = document.getElementById('btn-resume');
  const restartBtn  = document.getElementById('btn-restart');
  const audioBtn    = document.getElementById('btn-resume-audio');
  const closeBtn    = document.getElementById('btn-close-modal');

  // Handle view button clicks
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.view; // "full" | "section" | "verse"

      // Full view: switch immediately and update aria-pressed
      if (next === 'full') {
        switchView(next);
        viewBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === next));
        return;
      }

      // Section or Verse view: determine if resume modal is needed
      if (next === 'section' || next === 'verse') {
        const key           = `dua-${next}`;
        const savedIndex    = Number(localStorage.getItem(key));
        const hasSavedIndex = savedIndex > 0;
        const audioAtStart  = audioPlayer.currentTime === 0;

        const showResumeRestart = hasSavedIndex;
        const showAudioOption   = !audioAtStart;

        // No resume options needed: switch immediately
        if (!showResumeRestart && !showAudioOption) {
          switchView(next);
          viewBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === next));
          return;
        }

        // Show resume modal
        pendingView = next;
        document.getElementById('resume-text').textContent =
          `What would you like to do with the ${next} view?`;

        // Toggle buttons visibility in modal
        resumeBtn .classList.toggle('hidden', !showResumeRestart);
        restartBtn.classList.toggle('hidden', !showResumeRestart);
        audioBtn  .classList.toggle('hidden', !showAudioOption);
        // show close icon
        closeBtn .classList.remove('hidden');
        modal     .classList.remove('hidden');

        // Focus first available button in modal
        const focusables = Array.from(modal.querySelectorAll('button:not(.hidden)'));
        if (focusables.length) focusables[0].focus();
        return;
      }
    });
  });

  // Resume Progress
  resumeBtn?.addEventListener('click', () => {
    hideModalAndSwitch();
  });

  // Restart Progress
  restartBtn?.addEventListener('click', () => {
    localStorage.removeItem(`dua-${pendingView}`);
    hideModalAndSwitch();
  });

  // Resume from Audio
  audioBtn?.addEventListener('click', () => {
    if (pendingView) {
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
    }
    hideModalAndSwitch();
  });

  // Close button in top-right corner: cancel without switching
  closeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    pendingView = null;
  });

  // Click outside modal or Escape → close and switch
  modal?.addEventListener('click', e => {
    if (e.target === modal) {
      hideModalAndSwitch();
    }
  });

  modal?.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const focusables = Array.from(modal.querySelectorAll('button:not(.hidden)'));
      const idx = focusables.indexOf(document.activeElement);
      e.preventDefault();
      const nextIdx = e.shiftKey
        ? (idx - 1 + focusables.length) % focusables.length
        : (idx + 1) % focusables.length;
      focusables[nextIdx].focus();
    } else if (e.key === 'Escape') {
      hideModalAndSwitch();
    }
  });

  function hideModalAndSwitch() {
    modal.classList.add('hidden');
    if (pendingView) {
      switchView(pendingView);
      viewBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === pendingView));
    }
    pendingView = null;
  }
}

export function initToggleControls() {
  document.querySelectorAll('.toggle-btn[data-class]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nowOn = btn.classList.toggle('active');
      btn.setAttribute('aria-pressed', nowOn);
      document.querySelectorAll(`.${btn.dataset.class}`)
        .forEach(el => el.classList.toggle('hidden'));
    });
  });
}