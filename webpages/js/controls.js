import { switchView } from './renderer.js';

let pendingView = null;

export function initViewControls() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.view;
            const key = next === 'section' ? 'dua-currentSection' : 'dua-currentVerse';
            if ((next === 'section' || next === 'verse') && localStorage.getItem(key)) {
                pendingView = next;
                document.getElementById('resume-text').textContent =
                    `Resume ${next} where you left off?`;
                document.getElementById('resume-modal').classList.remove('hidden');
            } else {
                switchView(next);
            }
        });
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        document.getElementById('resume-modal').classList.add('hidden');
        if (pendingView) switchView(pendingView);
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
        document.getElementById('resume-modal').classList.add('hidden');
        if (pendingView === 'section') localStorage.removeItem('dua-currentSection');
        if (pendingView === 'verse') localStorage.removeItem('dua-currentVerse');
        switchView(pendingView);
    });
}

export function initToggleControls() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            document.querySelectorAll(`.${btn.dataset.class}`)
            .forEach(el => el.classList.toggle('hidden'));
        });
    });
}