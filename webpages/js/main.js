import { fetchDua } from './renderer.js';
import { initViewControls, initToggleControls } from './controls.js';
import { initAudioControls } from './audio.js';

// Read data attributes from the current script tag.
const scriptTag = document.getElementById('main-script');
const jsonPath = scriptTag.dataset.jsonPath;
const audioSrc = scriptTag.dataset.audioSrc;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchDua(jsonPath);
    initViewControls();
    initToggleControls();
    initAudioControls(audioSrc);
});