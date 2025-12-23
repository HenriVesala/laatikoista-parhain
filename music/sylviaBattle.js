// SYLVIA BATTLE - Intense Trance for Combat
// Based on Sylvian joululaulu chord progression (transformed)
// 140 BPM Hard Trance

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
  // Original Sylvia chords but faster, filtered, unrecognizable
  note(`
    e3 g3 b3 e3 g3 b3
    b2 d#3 f#3 e3 g3 b3 d3 f#3 a3 d3 f#3 a3
    g2 b2 d3 g2 b2 d3 a2 c3 e3 a2 c3 e3
    b2 d#3 f#3 b2 d#3 f#3 b2 d#3 f#3 b2 d#3 f#3
    e3 g3 b3 e3 g3 b3 d3 f#3 a3 d3 f#3 a3
    g2 b2 d3 g2 b2 d3 a2 c3 e3 a2 c3 e3
  `)
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
