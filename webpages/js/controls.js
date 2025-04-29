import { switchView } from './renderer.js';

let pendingView = null;

export function initViewControls() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.view;
            const key = next === 'section' ? 'dua-currentSection' : 'dua-currentVerse';

            if ((next === 'section' || next === 'verse') && localStorage.getItem(key)) {
                // ask whether to resume or restart
                pendingView = next;
                document.getElementById('resume-text').textContent =
                    `Resume ${next} where you left off?`;
                document.getElementById('resume-modal').classList.remove('hidden');
            } else {
                // first time or full view
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
        // hide modal
        document.getElementById('resume-modal').classList.add('hidden');

        // clear *both* saved positions so we truly start from scratch
        localStorage.removeItem('dua-currentSection');
        localStorage.removeItem('dua-currentVerse');

        // if ever pendingView is null, fall back to full view
        const view = pendingView || 'full';
        switchView(view);
        pendingView = null;
    });
}

export function initToggleControls() {
    // only bind the *language/translation* toggles,
    // not the resume/restart buttons in your modal
    document.querySelectorAll('.toggle-btn[data-class]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            document.querySelectorAll(`.${btn.dataset.class}`)
                    .forEach(el => el.classList.toggle('hidden'));
        });
    });
}
