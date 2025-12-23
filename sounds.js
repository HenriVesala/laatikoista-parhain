// Ääniefektit Web Audio API:lla
const SoundManager = {
    audioContext: null,
    initialized: false,
    menuMusicPlaying: false,
    menuMusicNodes: [],
    menuMusicTimeout: null,

    init() {
        if (this.initialized) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    },

    // Lyöntiääni - nopea "whoosh"
    playPunch() {
        if (!this.initialized) this.init();
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    },

    // Osuma-ääni - märkä "splat" (laatikkoruoka)
    playHit() {
        if (!this.initialized) this.init();
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // 1. Alkuräjähdys - nopea "pop"
        const pop = ctx.createOscillator();
        const popGain = ctx.createGain();
        pop.connect(popGain);
        popGain.connect(ctx.destination);
        pop.type = 'sine';
        pop.frequency.setValueAtTime(400, now);
        pop.frequency.exponentialRampToValueAtTime(80, now + 0.05);
        popGain.gain.setValueAtTime(0.5, now);
        popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        pop.start(now);
        pop.stop(now + 0.05);

        // 2. Märkä kohina - "splat" tekstuuri
        const bufferSize = ctx.sampleRate * 0.25;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // Satunnainen kohina joka vaimenee
            const envelope = Math.exp(-i / (bufferSize * 0.15));
            // Lisää "kuplivia" piikkejä
            const bubbles = Math.random() < 0.1 ? Math.random() * 2 : 1;
            noiseData[i] = (Math.random() * 2 - 1) * envelope * bubbles;
        }

        const noise = ctx.createBufferSource();
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        const noiseFilter2 = ctx.createBiquadFilter();

        noise.buffer = noiseBuffer;
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseFilter2);
        noiseFilter2.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // Bandpass antaa "märän" soinnin
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1200, now);
        noiseFilter.Q.setValueAtTime(1, now);

        noiseFilter2.type = 'lowpass';
        noiseFilter2.frequency.setValueAtTime(2000, now);
        noiseFilter2.frequency.exponentialRampToValueAtTime(400, now + 0.15);

        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        noise.start(now);

        // 3. Matala "thump" pohjaääni - enemmän bassoa
        const thump = ctx.createOscillator();
        const thumpGain = ctx.createGain();
        const thumpFilter = ctx.createBiquadFilter();
        thump.connect(thumpFilter);
        thumpFilter.connect(thumpGain);
        thumpGain.connect(ctx.destination);

        thump.type = 'sine';
        thump.frequency.setValueAtTime(80, now);
        thump.frequency.exponentialRampToValueAtTime(25, now + 0.2);

        thumpFilter.type = 'lowpass';
        thumpFilter.frequency.setValueAtTime(120, now);

        thumpGain.gain.setValueAtTime(0.6, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        thump.start(now);
        thump.stop(now + 0.2);

        // 4. Sub-basso kerros - syvä "pomph"
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.connect(subGain);
        subGain.connect(ctx.destination);

        sub.type = 'sine';
        sub.frequency.setValueAtTime(50, now);
        sub.frequency.exponentialRampToValueAtTime(20, now + 0.15);

        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        sub.start(now);
        sub.stop(now + 0.15);
    },

    // Torjuttu lyönti - metallinen "clang"
    playBlock() {
        if (!this.initialized) this.init();
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    },

    // Voittoääni - iloinen fanfaari
    playVictory() {
        if (!this.initialized) this.init();
        const ctx = this.audioContext;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            const startTime = ctx.currentTime + index * 0.15;

            oscillator.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    },

    // Häviöääni - surullinen laskeva melodia
    playDefeat() {
        if (!this.initialized) this.init();
        const ctx = this.audioContext;
        const notes = [392, 349, 311, 261]; // G4, F4, Eb4, C4

        notes.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            const startTime = ctx.currentTime + index * 0.2;

            oscillator.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.35);
        });
    },

    // Kierroksen alkuääni
    playRoundStart() {
        if (!this.initialized) this.init();
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    },

    // Jouluinen taustamusiikki menulle - käyttää Strudel webiä
    startMenuMusic() {
        if (this.menuMusicPlaying) return;
        this.menuMusicPlaying = true;

        // Use Strudel web if available
        if (window.playMenuMusicStrudel) {
            window.playMenuMusicStrudel();
        } else {
            console.warn('Strudel menu music not available');
        }
    },

    stopMenuMusic() {
        this.menuMusicPlaying = false;

        // Stop Strudel music
        if (window.stopMenuMusicStrudel) {
            window.stopMenuMusicStrudel();
        }
    },

    // Battle music
    startBattleMusic() {
        console.log('SoundManager.startBattleMusic called');
        console.log('playBattleMusicStrudel exists:', !!window.playBattleMusicStrudel);
        if (window.playBattleMusicStrudel) {
            window.playBattleMusicStrudel();
        } else {
            console.warn('Strudel battle music not available');
        }
    },

    stopBattleMusic() {
        if (window.stopBattleMusicStrudel) {
            window.stopBattleMusicStrudel();
        }
    }
};
