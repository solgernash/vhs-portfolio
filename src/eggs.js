// Easter eggs on the side shelves. Click one to pop up its sticky note.
//
// spot:  L1/L2/L3 = left column top/middle/bottom cubby, R1/R2/R3 = right column.
// x:     left/right offset inside the cubby (cubbies are 0.40 wide, so stay within about ±0.13).
// rot:   turn it a little so the shelf doesn't look too tidy.
// note:  sticky-note text. Leave it out to make an item decoration only.
// tape:  optional, adds a "Play tape ▶" button that inserts that tape.
// live:  'spotify' swaps the note for what's playing (functions/api/now-playing.js); `note` is the fallback.
export const EGGS = [
  { kind: 'cassette', spot: 'L1', x: 0, rot: 0.18, title: 'MIXTAPE', sub: 'Vol. 1', stripe: '#e5484d',
    live: 'spotify', note: "The mixtape's rewinding. Check back in a bit." },

  { kind: 'vr', spot: 'L2', x: 0, rot: -0.35,
    note: "I've kept a whole classroom fleet of VR headsets running and helped 900+ pharmacy students put them on." },

  { kind: 'danceShoe', spot: 'L3', x: -0.06, rot: 0.45,
    note: "I discovered ballroom in college and danced ballroom, salsa and West Coast Swing all the way through. I can't imagine living without it now. President of the Ballroom Dance Club at UGA (2024–26) and VP of the Ballroom Performance Group (2025–26)." },
  // Decoration until there's a photo: set image: '/eggs/photo.jpg' (put the file in public/eggs/) and add a note.
  { kind: 'polaroid', spot: 'L3', x: 0.12, rot: -0.25, caption: 'ATHENS, GA', image: null },

  { kind: 'gamecube', spot: 'R1', x: 0, rot: 0.2,
    note: "I've played video games since I was a little kid. Wondering how they actually worked is what got me interested in computer systems." },

  { kind: 'strawHat', spot: 'R2', x: 0, rot: 0.3,
    note: "I'm really into anime. One Piece especially." },

  { kind: 'books', spot: 'R3', x: -0.1,
    titles: [['DON QUIJOTE', '#7a2e2e'], ['ESPAÑOL for DUMMIES', '#f5c400', '#111111'], ['EL HOBBIT', '#2f5e45']],
    note: "¿Hablas español? I'm finishing a B.A. in Spanish alongside my CS degrees." },
  { kind: 'runningShoe', spot: 'R3', x: 0.09, rot: -0.45,
    note: 'I ran cross-country and track through high school and undergrad. Next goal: the Boston Marathon by 2030.' },
];
