export function initAudioControls(src) {
    const audio = document.getElementById('audio-player');
    audio.src = src;

    const playPause = document.getElementById('play-pause');
    const rewind    = document.getElementById('rewind');
    const forward   = document.getElementById('forward');
    const muteBtn   = document.getElementById('mute-btn');
    const seek      = document.getElementById('seek-bar');
    const volume    = document.getElementById('volume-slider');
    const timeDisp  = document.getElementById('time-display');
    const toggleBtn = document.getElementById('audio-toggle');
    const continueBtn = document.getElementById('continue-toggle');
    const verses    = Array.from(document.querySelectorAll('.verse'));

    // Set initial aria-label for Continue Play toggle
    continueBtn.setAttribute('aria-label', 'Toggle Continue Play');

    // Grab the verse-display element.
    const verseDisplay = document.getElementById('current-verse-display');

    // Sync play/pause icon and aria-label via audio events.
    audio.addEventListener('play', () => {
        playPause.textContent = '❚❚';
        playPause.setAttribute('aria-label', 'Pause');
    });
    audio.addEventListener('pause', () => {
        playPause.textContent = '►';
        playPause.setAttribute('aria-label', 'Play');
    });

    // Playback speed control.
    const speedSelector = document.getElementById('speed-selector');
    speedSelector.addEventListener('change', () => {
        audio.playbackRate = parseFloat(speedSelector.value);
    });
    audio.playbackRate = parseFloat(speedSelector.value);

    const format = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

    // Play/pause toggle with cleanup of verse-stop
    playPause.addEventListener('click', () => {
        if (!continueBtn.classList.contains('active')) {
            audio.removeEventListener('timeupdate', audio._verseStopHandler);
            audio._verseStopHandler = null;
        }
        if (audio.paused) audio.play();
        else              audio.pause();
    });

    // Rewind and forward buttons.
    rewind.addEventListener('click', () => audio.currentTime = Math.max(0, audio.currentTime - 10));
    forward.addEventListener('click', () => audio.currentTime = Math.min(audio.duration, audio.currentTime + 10));

    // Mute/unmute toggle with aria-label update.
    muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        muteBtn.textContent = audio.muted ? '🔇' : '🔊';
        muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
    });

    audio.addEventListener('loadedmetadata', () => {
        timeDisp.textContent = `0:00 / ${format(audio.duration)}`;
    });

    // Update seek bar, time display, and verse number.
    audio.addEventListener('timeupdate', () => {
        const t = audio.currentTime;
        seek.value = audio.duration ? (t / audio.duration) * 100 : 0;
        timeDisp.textContent = `${format(t)} / ${format(audio.duration)}`;

        const current = verseMap.find(v => t >= v.start && t < v.end);
        if (current) {
            const num = current.el.querySelector('.verse-number').textContent;
            verseDisplay.textContent = `V ${num}`;
        } else {
            verseDisplay.textContent = 'V –';
        }
    });

    // Seek on input change.
    seek.addEventListener('input', () => {
        audio.currentTime = (seek.value/100)*audio.duration;
    });

    // Volume control also updates mute state and aria-label.
    volume.addEventListener('input', () => {
        audio.volume = volume.value;
        audio.muted  = volume.value == 0;
        muteBtn.textContent = audio.muted ? '🔇' : '🔊';
        muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
    });

    // Toggle audio bar visibility and update aria-pressed.
    toggleBtn.addEventListener('click', () => {
        const bar = document.getElementById('audio-bar');
        const isHidden = getComputedStyle(bar).display === 'none';
        bar.style.display = isHidden ? 'flex' : 'none';
        toggleBtn.classList.toggle('active');
        toggleBtn.setAttribute('aria-pressed', toggleBtn.classList.contains('active'));
    });

    // Continue Play toggle for verse-only play
    continueBtn.addEventListener('click', () => {
        const continueEnabled = continueBtn.classList.toggle('active');
        continueBtn.setAttribute('aria-pressed', continueEnabled);
        continueBtn.setAttribute('aria-label', continueEnabled ? 'Continue Play enabled' : 'Continue Play disabled');
        if (continueEnabled && audio._verseStopHandler) {
            audio.removeEventListener('timeupdate', audio._verseStopHandler);
            audio._verseStopHandler = null;
        }
    });

    const verseMap = verses.map(el => ({
        el,
        start: parseFloat(el.dataset.start),
        end:   parseFloat(el.dataset.end)
    }));

    // Seek from individual verse buttons with continue-play control.
    verseMap.forEach(v => {
        const btn = v.el.querySelector('.seek-btn');
        if (!btn) return;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            audio.currentTime = v.start;
            audio.play();

            if (!continueBtn.classList.contains('active')) {
                const handler = () => {
                    if (audio.currentTime >= v.end) {
                        audio.pause();
                        audio.removeEventListener('timeupdate', handler);
                    }
                };
                audio._verseStopHandler = handler;
                audio.addEventListener('timeupdate', handler);
            }
        });
    });

    // Highlight current verse.
    audio.addEventListener('timeupdate', () => {
        const t = audio.currentTime;
        verseMap.forEach(v => {
            v.el.classList.toggle('current', t >= v.start && t < v.end);
        });
    });

    // Click-to-seek on verse container.
    verseMap.forEach(v => {
        v.el.addEventListener('click', () => {
            audio.currentTime = v.start;
            audio.play();
        });
    });
}