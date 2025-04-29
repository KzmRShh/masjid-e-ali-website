export function initAudioControls(src) {
    const audio = document.getElementById('audio-player');
    audio.src = src;

    const playPause = document.getElementById('play-pause');
    const rewind = document.getElementById('rewind');
    const forward = document.getElementById('forward');
    const muteBtn = document.getElementById('mute-btn');
    const seek = document.getElementById('seek-bar');
    const volume = document.getElementById('volume-slider');
    const timeDisp = document.getElementById('time-display');
    const toggleBtn = document.getElementById('audio-toggle');
    const speedSelector = document.getElementById('speed-selector');
    const verses = Array.from(document.querySelectorAll('.verse'));

    speedSelector.addEventListener('change', () => {
      audio.playbackRate = parseFloat(speedSelector.value);
    });
    
    audio.playbackRate = parseFloat(speedSelector.value);

    const format = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

    playPause.addEventListener('click', () => {
        if (audio.paused) { audio.play(); playPause.textContent = '❚❚'; }
        else { audio.pause(); playPause.textContent = '▶️'; }
    });

    rewind.addEventListener('click', () => audio.currentTime = Math.max(0, audio.currentTime - 10));

    forward.addEventListener('click', () => audio.currentTime = Math.min(audio.duration, audio.currentTime + 10));

    muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        muteBtn.textContent = audio.muted ? '🔇' : '🔊';
    });

    audio.addEventListener('loadedmetadata', () => {
        timeDisp.textContent = `0:00 / ${format(audio.duration)}`;
    });

    audio.addEventListener('timeupdate', () => {
        seek.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        timeDisp.textContent = `${format(audio.currentTime)} / ${format(audio.duration)}`;
    });

    seek.addEventListener('input', () => audio.currentTime = (seek.value/100)*audio.duration);

    volume.addEventListener('input', () => {
        audio.volume = volume.value;
        audio.muted = volume.value == 0;
        muteBtn.textContent = audio.muted ? '🔇' : '🔊';
    });

    toggleBtn.addEventListener('click', () => {
        const bar = document.getElementById('audio-bar');
        // Read the actual computed display value.
        const isHidden = getComputedStyle(bar).display === 'none';
        bar.style.display = isHidden ? 'flex' : 'none';
        toggleBtn.classList.toggle('active');
    });

    const verseMap = verses.map(el => ({
        el,
        start: parseFloat(el.dataset.start),
        end:   parseFloat(el.dataset.end)
    }));
      
      // Highlight current verse.
    audio.addEventListener('timeupdate', () => {
        const t = audio.currentTime;
        verseMap.forEach(v => {
            v.el.classList.toggle('current', t >= v.start && t < v.end);
        });
    });
      
    // Seek on click.
    verseMap.forEach(v => {
        v.el.addEventListener('click', () => {
            audio.currentTime = v.start;
            audio.play();
        });
    });
}  