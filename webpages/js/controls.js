import { switchView, duaData, currentSection, currentVerse, parseTimestamp } from './renderer.js';

let pendingView = null;

export function initViewControls() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.view;
            const key = next === 'section' ? 'dua-currentSection' : 'dua-currentVerse';

            if ((next === 'section' || next === 'verse') && localStorage.getItem(key)) {
                // Ask whether to resume or restart.
                pendingView = next;
                document.getElementById('resume-text').textContent =
                    `Resume ${next} where you left off?`;
                document.getElementById('resume-modal').classList.remove('hidden');
            } else {
                // First time or full view.
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
        // Hide modal.
        document.getElementById('resume-modal').classList.add('hidden');

        // Clear *both* saved positions so we truly start from scratch.
        localStorage.removeItem('dua-currentSection');
        localStorage.removeItem('dua-currentVerse');

        // If ever pendingView is null, fall back to full view.
        const view = pendingView || 'full';
        switchView(view);
        pendingView = null;
    });

    // RESUME FROM AUDIO button
    document.getElementById('btn-resume-audio').addEventListener('click', () => {
        // Hide modal.
        document.getElementById('resume-modal').classList.add('hidden');
        if (!pendingView) return;

        const audio = document.getElementById('audio-player');
        const t = audio.currentTime;

        if (pendingView === 'section') {
            // Find section that covers current audio time.
            duaData.sections.forEach((sec, idx) => {
                if (sec.verses.some(v =>
                    parseTimestamp(v.timestamp.start) <= t &&
                    parseTimestamp(v.timestamp.end) > t
                )) {
                    currentSection = idx;
                    localStorage.setItem('dua-currentSection', currentSection);
                }
            });
        } else if (pendingView === 'verse') {
            // Find the verse matching current audio time.
            const flat = duaData.sections.flatMap(s => s.verses);
            const idx = flat.findIndex(v =>
                parseTimestamp(v.timestamp.start) <= t &&
                parseTimestamp(v.timestamp.end) > t
            );
            if (idx !== -1) {
                currentVerse = idx;
                localStorage.setItem('dua-currentVerse', currentVerse);
            }
        }

        // Now switch view at the correct position.
        switchView(pendingView);
        pendingView = null;
    });
}

export function initToggleControls() {
    // Only bind the *language/translation* toggles,
    // not the resume/restart buttons in your modal.
    document.querySelectorAll('.toggle-btn[data-class]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            document.querySelectorAll(`.${btn.dataset.class}`)
                .forEach(el => el.classList.toggle('hidden'));
        });
    });
}