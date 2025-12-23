// Strudel music player using CDN imports
// Menu: tummaSylvia - Sylvian joululaulu
// Battle: sylviaBattle - Intense trance combat music

let menuMusicPlaying = false;
let battleMusicPlaying = false;
let scheduler = null;
let strudelModules = null;

async function initStrudel() {
    if (strudelModules) {
        console.log('Strudel already initialized');
        return strudelModules;
    }

    try {
        console.log('Loading Strudel modules from CDN...');

        // Import Strudel modules from CDN
        const [core, mini, tonal, webaudio, transpilerModule] = await Promise.all([
            import('https://esm.sh/@strudel/core'),
            import('https://esm.sh/@strudel/mini'),
            import('https://esm.sh/@strudel/tonal'),
            import('https://esm.sh/@strudel/webaudio'),
            import('https://esm.sh/@strudel/transpiler')
        ]);

        console.log('Modules loaded, initializing audio...');

        // Get or create audio context directly (don't wait for click)
        let audioCtx;
        try {
            audioCtx = webaudio.getAudioContext();
        } catch (e) {
            console.log('Creating new audio context...');
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume if suspended
        if (audioCtx.state === 'suspended') {
            console.log('Resuming audio context...');
            await audioCtx.resume();
        }
        console.log('Audio context state:', audioCtx.state);

        // Initialize Strudel's audio output with our context
        if (webaudio.initAudio) {
            await webaudio.initAudio(audioCtx);
        }

        // Register synths
        if (typeof webaudio.registerSynthSounds === 'function') {
            console.log('Registering synth sounds...');
            webaudio.registerSynthSounds();
        } else if (typeof webaudio.registerSynths === 'function') {
            console.log('Registering synths...');
            webaudio.registerSynths();
        } else {
            console.warn('No synth registration function found');
        }

        // Load drum samples for battle music
        console.log('Loading drum samples...');
        if (webaudio.samples) {
            webaudio.samples('github:tidalcycles/Dirt-Samples/master');
            console.log('Drum samples loading initiated');
        }

        // Make Strudel functions globally available
        const strudelScope = {
            ...core,
            ...mini,
            ...tonal
        };
        Object.assign(window, strudelScope);

        // Create REPL
        const replResult = core.repl({
            defaultOutput: webaudio.webaudioOutput,
            getTime: () => webaudio.getAudioContext().currentTime,
        });

        scheduler = replResult.scheduler;

        strudelModules = {
            core,
            mini,
            tonal,
            webaudio,
            transpiler: transpilerModule,
            repl: replResult
        };

        console.log('Strudel initialized successfully');
        return strudelModules;
    } catch (error) {
        console.error('Failed to initialize Strudel:', error);
        throw error;
    }
}

async function playMenuMusic() {
    try {
        if (menuMusicPlaying) {
            console.log('Menu music already playing');
            return;
        }

        console.log('Starting menu music...');
        const modules = await initStrudel();

        if (!modules) {
            console.error('Failed to get Strudel modules');
            return;
        }

        // Resume audio context if needed (requires user interaction)
        const audioCtx = modules.webaudio.getAudioContext();
        if (audioCtx.state === 'suspended') {
            console.log('Audio context suspended, attempting resume...');
            await audioCtx.resume();
        }

        menuMusicPlaying = true;
        console.log('Playing tummaSylvia menu music with Strudel...');

        // tummaSylvia - Sylvian joululaulu pattern
        const tummaSylviaCode = `
stack(
  note(\`
    ~@5.5 b3@0.5
    b3@1.5 e4@1 f#4@0.5 g4@1.5 f#4@1 e4@0.5
    f#4@1.5 g4@1 f#4@0.5 e4@1.5 d4@1 c4@0.5
    b3@1.5 b3@1 b3@0.5 a3@1.5 g3@1 a3@0.5
    b3@3 b3@1.5 ~@1 b3@0.5
    b3@1.5 c4@1 b3@0.5 g4@1.5 f#4@1 g4@0.5
    a4@1.5 g4@1 a4@0.5 b4@1.5 b4@0.5 ~@0.5 b4@0.5
    b4@1.5 e4@1 g4@0.5 f#4@1.5 e4@1 f#4@0.5
    g4@3 g4@0.5 ~@2 b4@0.5
    b4@1.5 f#4@1 b4@0.5 g4@1.5 f#4@1 g4@0.5
    a4@1.5 e4@1 a4@0.5 f#4@1.5 ~@1 f#4@0.5
    g4@1.5 d4@1 g4@0.5 e4@1.5 e4@1 e4@0.5
    e4@1.5 d#4@1 e4@0.5 f#4@1.5 f#4@0.5 ~@0.5 b3@0.5
    b3@1.5 c4@1 b3@0.5 g4@1.5 f#4@1 e4@0.5
    f#4@1.5 c#4@1 d#4@0.5 e4@1.5 e4@0.5 ~@0.5 c4@0.5
    f#4@1.5 e4@1 f#4@0.5 g4@1.5 f#4@1 e4@0.5
    b4@1.5 f#4@1 g4@0.5 e4@3
  \`)
  .slow(12)
  .s("triangle")
  .lpf(1500)
  .gain(0.3)
  .attack(0.05)
  .decay(0.1)
  .sustain(0.8)
  .release(0.5)
  .room(0.4),

  note(\`
    [e2,g2,b2]@6
    [e2,g2,b2]@6
    [b2,d#3,f#3]@3 [e2,g2,b2]@1.5 [d2,f#2,a2]@1.5
    [g2,b2,d3]@3 [a2,c3,e3]@3
    [b2,e3,f#3]@2.5 [b2,d#3,f#3]@3.5
    [b2,d#3,f#3]@3 [e2,g2,b2]@3
    [d2,f#2,a2]@3 [g2,b2,d3]@3
    [a2,c3,e3]@3 [d2,f#2,a2]@3
    [g2,c3,d3]@3 [g2,b2,d3]@3
    [b2,d#3,f#3]@3 [e2,g2,b2]@3
    [a2,c#3,e3]@3 [d2,f#2,a2]@3
    [g2,b2,d3]@3 [c3,e3,g3]@1.5 [c3,e3,g#3]@1.5
    [c3,e3,a3]@1.5 [c3,e3,bb3]@1.5 [b2,d#3,f#3]@3
    ~@3 [e2,g2,b2]@3
    [b2,d#3,f#3]@3 [e2,g2,b2]@3
    [a2,c3,e3]@3 [a#2,c#3,e3]@3
    [e2,g2,b2]@1.5 [b2,d#3,f#3]@1.5 [e2,g2,b2]@3
  \`)
  .slow(12)
  .s("triangle")
  .lpf(800)
  .gain(0.1)
  .room(0.4)
  .attack(0.1)
  .decay(0.1)
  .sustain(1)
  .release(1.5)
).cpm(70/6)
`;

        // Try using the transpiler
        let codeToEvaluate;
        try {
            console.log('Transpiling code...');
            const transpilerFn = modules.transpiler.transpiler || modules.transpiler.default;
            if (transpilerFn) {
                const transpiledCode = transpilerFn(tummaSylviaCode);
                codeToEvaluate = transpiledCode.output
                    .replace(/^return\s+/, '')
                    .replace(/;$/, '');
                console.log('Transpiled successfully');
            } else {
                console.log('No transpiler function found, using raw code');
                codeToEvaluate = tummaSylviaCode;
            }
        } catch (transpileError) {
            console.warn('Transpile failed, using raw code:', transpileError);
            codeToEvaluate = tummaSylviaCode;
        }

        console.log('Evaluating pattern...');
        await modules.repl.evaluate(codeToEvaluate);

        console.log('Starting scheduler...');
        await scheduler.start();

        console.log('tummaSylvia playing!');

    } catch (error) {
        console.error('Error playing menu music:', error);
    }
}

function stopMenuMusic() {
    try {
        menuMusicPlaying = false;

        if (scheduler) {
            scheduler.stop();
        }

        console.log('Menu music stopped');
    } catch (error) {
        console.error('Error stopping menu music:', error);
    }
}

// === BATTLE MUSIC ===
async function playBattleMusic() {
    try {
        if (battleMusicPlaying) {
            console.log('Battle music already playing');
            return;
        }

        // Stop menu music if playing
        if (menuMusicPlaying) {
            stopMenuMusic();
        }

        console.log('Starting battle music...');
        const modules = await initStrudel();

        if (!modules) {
            console.error('Failed to get Strudel modules');
            return;
        }

        // Resume audio context if needed
        const audioCtx = modules.webaudio.getAudioContext();
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        battleMusicPlaying = true;
        console.log('Playing sylviaBattle music with Strudel...');

        // sylviaBattle - Intense Trance for Combat
        const sylviaBattleCode = `
stack(
  // === HEAVY KICK ===
  s("bd").fast(4).gain(0.85).distort(0.3),

  // === OFFBEAT HI-HAT ===
  s("~ hh").fast(8).gain(0.2).lpf(8000),

  // === DRIVING BASS - E minor root, distorted ===
  note("e1!8")
    .fast(2)
    .s("sawtooth")
    .lpf(200)
    .gain(0.6)
    .distort(0.4)
    .attack(0.01)
    .decay(0.15),

  // === TRANSFORMED CHORDS - Fast & filtered ===
  note(\`
    e3 g3 b3 e3 g3 b3
    b2 d#3 f#3 e3 g3 b3 d3 f#3 a3 d3 f#3 a3
    g2 b2 d3 g2 b2 d3 a2 c3 e3 a2 c3 e3
    b2 d#3 f#3 b2 d#3 f#3 b2 d#3 f#3 b2 d#3 f#3
    e3 g3 b3 e3 g3 b3 d3 f#3 a3 d3 f#3 a3
    g2 b2 d3 g2 b2 d3 a2 c3 e3 a2 c3 e3
  \`)
  .fast(4)
  .s("supersaw")
  .lpf(2000)
  .gain(0.15)
  .attack(0.01)
  .decay(0.15)
  .sustain(0.4)
  .release(0.2)
  .room(0.3)
  .delay(0.25),

  // === INTENSE PAD - Dark atmosphere ===
  note("<[e2,b2,e3] [b1,f#2,b2] [g2,d3,g3] [a2,e3,a3]>")
    .slow(2)
    .s("sawtooth")
    .lpf(600)
    .gain(0.12)
    .attack(0.5)
    .decay(0.3)
    .sustain(0.7)
    .release(2)
    .room(0.6)
    .distort(0.15),

  // === TRANCE LEAD - Aggressive ===
  note("<e4 b4 g4 f#4 e4 d4 b3 e4>")
    .fast(2)
    .s("square")
    .lpf(2500)
    .gain(0.15)
    .attack(0.01)
    .decay(0.1)
    .sustain(0.5)
    .release(0.2)
    .delay(0.35)
    .room(0.4),

  // === SUB BASS ===
  note("<e1 e1 b0 a0>")
    .s("sine")
    .lpf(60)
    .gain(0.5),

  // === RISER/TENSION ===
  s("hh").lpf(6000).gain(0.06).room(0.4)

).cpm(140/4)
`;

        // Try using the transpiler
        let codeToEvaluate;
        try {
            console.log('Transpiling battle code...');
            const transpilerFn = modules.transpiler.transpiler || modules.transpiler.default;
            if (transpilerFn) {
                const transpiledCode = transpilerFn(sylviaBattleCode);
                codeToEvaluate = transpiledCode.output
                    .replace(/^return\s+/, '')
                    .replace(/;$/, '');
                console.log('Battle code transpiled successfully');
            } else {
                codeToEvaluate = sylviaBattleCode;
            }
        } catch (transpileError) {
            console.warn('Battle transpile failed:', transpileError);
            codeToEvaluate = sylviaBattleCode;
        }

        console.log('Evaluating battle pattern...');
        await modules.repl.evaluate(codeToEvaluate);

        console.log('Starting battle scheduler...');
        await scheduler.start();

        console.log('sylviaBattle playing!');

    } catch (error) {
        console.error('Error playing battle music:', error);
    }
}

function stopBattleMusic() {
    try {
        battleMusicPlaying = false;

        if (scheduler) {
            scheduler.stop();
        }

        console.log('Battle music stopped');
    } catch (error) {
        console.error('Error stopping battle music:', error);
    }
}

// Export to window for sounds.js
window.playMenuMusicStrudel = playMenuMusic;
window.stopMenuMusicStrudel = stopMenuMusic;
window.playBattleMusicStrudel = playBattleMusic;
window.stopBattleMusicStrudel = stopBattleMusic;
