import { fetchDua, handleLeftArrow, handleRightArrow, handleSpace } from './renderer.js';
import { initViewControls, initToggleControls } from './controls.js';
import { initAudioControls } from './audio.js';

const scriptTag = document.getElementById('main-script');
const jsonPath = scriptTag.dataset.jsonPath;
const audioSrc = scriptTag.dataset.audioSrc;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchDua(jsonPath);
    initViewControls();
    initToggleControls();
    initAudioControls(audioSrc);

    // Keyboard support for arrows and spacebar
    document.addEventListener('keydown', e => {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handleLeftArrow();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            handleRightArrow();
        } else if (e.code === 'Space') {
            e.preventDefault();
            handleSpace();
        }
    });
});