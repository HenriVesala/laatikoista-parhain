// Sylvian joululaulu - Finnish Christmas Song
// "Ja niin joulu joutui jo taas Pohjolaan..."
// Karl Collan / Zacharias Topelius

// Soinnut:
// Em = [e2,g2,b2], B7 = [b2,d#3,f#3], D7 = [d2,f#2,a2]
// G = [g2,b2,d3], Am = [a2,c3,e3], Bsus = [b2,e3,f#3]
// Gsus = [g2,c3,d3], A = [a2,c#3,e3]
// C = [c3,e3,g3], C+ = [c3,e3,g#3], C6 = [c3,e3,a3], C7 = [c3,e3,bb3]
// A#o = [a#2,c#3,e3]

stack(
  // Main melody - Sylvian joululaulu
  // "Ja niin joulu joutui jo taas Pohjolaan"
  // Tahti = 6 iskua, 1 = täysi, 0.5 = puolikas
  note(`
    ~@5.5 b3@0.5
    b3@1.5 e4@1 f#4@0.5 g4@1.5 f#4@1 e4@0.5
    f#4@1.5 g4@1 f#4@0.5 e4@1.5 d4@1 c4@0.5
    b3@1.5 b3@1 b3@0.5 a3@1.5 g3@1 a3@0.5
    b3@3 b3@1.5 ~@1 b3@0.5
    b3@1.5 c4@1 b3@0.5 g4@1.5 f#4@1 g4@0.5
    a4@1.5 g4@1 a4@0.5 b4@1.5 b4@0.5 ~@0.5 b4@0.5
    b4@1.5 e4@1 g4@0.5 f#4@1.5 e4@1 f#4@0.5
    g4@3 g4@0.5  ~@2 b4@0.5 
    b4@1.5 f#4@1 b4@0.5 g4@1.5 f#4@1 g4@0.5
    a4@1.5 e4@1 a4@0.5 f#4@1.5 ~@1 f#4@0.5
    g4@1.5 d4@1 g4@0.5 e4@1.5 e4@1 e4@0.5
    e4@1.5 d#4@1 e4@0.5 f#4@1.5  f#4@0.5 ~@0.5 b3@0.5
    b3@1.5 c4@1 b3@0.5 g4@1.5 f#4@1 e4@0.5
    f#4@1.5 c#4@1 d#4@0.5 e4@1.5 e4@0.5 @0.5 c4@0.5
    f#4@1.5 e4@1 f#4@0.5 g4@1.5 f#4@1 e4@0.5 
    b4@1.5 f#4@1 g4@0.5 e4@3

  `)
  .slow(12)
  .s("supersaw")
  .lpf(1000)
  .gain(0.3)
  .attack(0.05)
  .decay(0.1)
  .sustain(0.9)
  .release(0.8)
  .room(0.5)
  .legato(1),


  note(`
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
  `)
  .slow(12)
  .s("supersaw")
    .lpf(1000)
  .gain(0.1)
  .room(0.5)
  .attack(0.1)
  .decay(0.1)
  .sustain(1)
  .release(2)
  .legato(1),
).cpm(140/4)