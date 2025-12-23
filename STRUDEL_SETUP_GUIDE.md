# Strudel Setup Guide for AI Agents

This guide documents the complete setup process for Strudel (live coding pattern language) with all pitfalls and solutions discovered during implementation.

## Project Structure

```
/
├── package.json          # Dependencies
├── index.html           # Web interface with play/stop buttons
├── main.js              # Main initialization and evaluation logic
├── music.ts             # Your actual music composition (main file)
└── mySample.ts          # Example/reference compositions (optional)
```

## Dependencies (package.json)

```json
{
  "name": "strudelointi",
  "type": "module",
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "@strudel/core": "latest",
    "@strudel/mini": "latest",
    "@strudel/tonal": "latest",
    "@strudel/transpiler": "latest",
    "@strudel/webaudio": "latest"
  },
  "devDependencies": {
    "vite": "^7.2.6"
  }
}
```

## Critical Setup Steps (main.js)

### 1. Import Webaudio as Namespace

**WRONG:**
```javascript
import { initAudioOnFirstClick, webaudioOutput } from '@strudel/webaudio';
```

**CORRECT:**
```javascript
import * as webaudio from '@strudel/webaudio';
```

**Why:** You need access to synth registration functions and all webaudio utilities.

### 2. Initialize Audio First

```javascript
await webaudio.initAudioOnFirstClick();
```

### 3. Register Built-in Synths (CRITICAL!)

Check what registration function is available and call it:

```javascript
if (typeof webaudio.registerSynthSounds === 'function') {
  webaudio.registerSynthSounds();
} else if (typeof webaudio.registerSynths === 'function') {
  webaudio.registerSynths();
}
```

**Without this step:** You'll get "sound square not found!" errors for all synths.

### 4. Load Samples

```javascript
webaudio.samples('github:tidalcycles/Dirt-Samples/master');
```

Available samples include: bd (kick), hh (hi-hat), cp (clap), sn (snare), etc.

### 5. Create Evaluation Scope

```javascript
import * as core from '@strudel/core';
import * as mini from '@strudel/mini';
import * as tonal from '@strudel/tonal';

const strudelScope = {
  ...core,
  ...mini,
  ...tonal
};

// Make functions globally available for eval
Object.assign(window, strudelScope);
```

**Why:** Strudel's evaluator needs functions like `s()`, `note()`, `stack()` in global scope.

### 6. Use Transpiler for Mini Notation

```javascript
import { transpiler } from '@strudel/transpiler';

const musicResponse = await fetch('/music.ts');
const musicCode = await musicResponse.text();

const transpiledCode = transpiler(musicCode);
const codeToEvaluate = transpiledCode.output
  .replace(/^return\s+/, '')  // Remove 'return' statement
  .replace(/;$/, '');          // Remove trailing semicolon
```

**Why:** Strudel's mini notation (e.g., "bd!4") needs transpiling to JavaScript.

### 7. Set Up REPL with Webaudio

```javascript
const { evaluate, scheduler } = repl({
  defaultOutput: webaudio.webaudioOutput,
  getTime: () => webaudio.getAudioContext().currentTime,
});

await evaluate(codeToEvaluate);
```

### 8. Control Playback

```javascript
// Start
await scheduler.start();

// Stop
scheduler.stop();
```

## Common Pitfalls and Solutions

### Error: "s is not defined"

**Cause:** Pattern functions not in scope.

**Solution:** Import from `@strudel/core` (not just `@strudel/mini`) and assign to `window`.

### Error: "sound square/sawtooth/triangle not found"

**Cause:** Built-in synths not registered.

**Solution:** Call `webaudio.registerSynthSounds()` or `webaudio.registerSynths()` after initializing audio.

**Note:** Synths are NOT loaded from CDN - they're Web Audio API oscillators. Don't try to load them with `samples()`.

### Error: "sound bd/hh/cp not found"

**Cause:** Drum samples not loaded.

**Solution:** Call `webaudio.samples('github:tidalcycles/Dirt-Samples/master')`.

### Error: "Can't do arithmetic on control pattern"

**Cause:** Arithmetic operations must come BEFORE `.scale()`.

**WRONG:**
```javascript
note("0 -3 2").scale("c:minor").add(12)
```

**CORRECT:**
```javascript
note("0 -3 2").add(12).scale("c:minor")
```

### Error: "Unexpected token ';'"

**Cause:** Strudel evaluator doesn't handle JavaScript semicolons.

**Solution:** Use transpiler and strip semicolons from output.

### Error: "Unable to decode audio data" for synths

**Cause:** Trying to load synth sounds as audio files from CDN.

**Solution:** Remove any attempts to load synths via `samples()`. Synths are built-in.

## Music File Structure (music.ts)

```javascript
// @ts-nocheck  // Recommended: Strudel uses dynamic patterns

stack(
  // Drums
  s("bd!4").gain(0.8),           // Kick on every beat
  s("hh*8").gain(0.3),           // Fast hi-hats
  s("~ cp ~ cp").gain(0.6),      // Claps on 2 and 4

  // Bass synth
  note("c2 c2 [eb2 f2]")
    .slow(2)
    .s("sawtooth")
    .lpf(400)
    .gain(0.7),

  // Melodic synth
  note("c4 eb4 g4 bb4")
    .fast(2)
    .s("square")
    .lpf(2000)
    .gain(0.4)
    .delay(0.5),

  // Pad with arithmetic BEFORE scale
  note("0 2 4")
    .add(12)           // Arithmetic first
    .scale("c:minor")  // Then scale
    .s("triangle")
    .gain(0.3)
).cpm(140/4)  // BPM/4 for cycles per minute
```

## Available Built-in Synths

- `"sawtooth"` - Rich, buzzy tone (good for bass, leads)
- `"square"` - Hollow, clarinet-like (good for melodies)
- `"triangle"` - Soft, flute-like (good for pads)
- `"sine"` - Pure tone (good for subs, simple melodies)

## Pattern Syntax Quick Reference

- `"bd!4"` - Play "bd" 4 times evenly
- `"bd*8"` - Play "bd" 8 times per cycle
- `"bd cp"` - Play "bd" then "cp"
- `"~ cp"` - Rest then "cp"
- `"[bd cp]"` - Group as single unit
- `"<bd cp sn>"` - Alternate per cycle

## Effects

- `.gain(0.5)` - Volume (0-1)
- `.lpf(1000)` - Low-pass filter (cutoff frequency)
- `.hpf(1000)` - High-pass filter
- `.delay(0.5)` - Delay effect
- `.room(0.9)` - Reverb
- `.fast(2)` - Speed up 2x
- `.slow(2)` - Slow down 2x

## Timing

- `.cpm(35)` - Cycles per minute (BPM/4 for 4/4 time)
- BPM 140 = CPM 35

## Troubleshooting Checklist

1. ✓ Import `* as webaudio` (not destructured imports)
2. ✓ Call `initAudioOnFirstClick()`
3. ✓ Register synths with `registerSynthSounds()` or `registerSynths()`
4. ✓ Load samples with `samples('github:tidalcycles/Dirt-Samples/master')`
5. ✓ Import core, mini, tonal and assign to window
6. ✓ Use transpiler on music code
7. ✓ Strip 'return' and semicolons from transpiled output
8. ✓ Use webaudio namespace in repl config
9. ✓ Arithmetic operations before `.scale()`

## Working Example

See `main.js` and `music.ts` in this repository for a complete working implementation of a trance track with drums, bass, arpeggiator, lead synth, and atmospheric pad.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173/ and click Play.

## Key Insights

1. **Synths are NOT loaded like samples** - They're Web Audio API oscillators
2. **Registration is required** - But the function name varies by version
3. **Scope matters** - Functions must be in `window` for eval to work
4. **Order matters** - Arithmetic → Scale → Effects → Timing
5. **Transpiler is essential** - Mini notation won't work without it

---

*This guide was created after encountering and solving all these issues. Following it exactly will save hours of debugging.*
