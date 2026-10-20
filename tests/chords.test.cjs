const test = require("node:test");
const assert = require("node:assert/strict");
const { parseChord, parseNote, noteName, selectPitchInstances, suggestChords, getChordMidiNotes } = require("../chords.js");

function pitches(symbol) {
  return parseChord(symbol).intervals;
}

test("parses the roadmap example symbols", () => {
  assert.deepEqual(pitches("CM7"), [0, 4, 7, 11]);
  assert.deepEqual(pitches("F#7sus4"), [0, 5, 7, 10]);
  assert.deepEqual(pitches("DbM"), [0, 4, 7]);
  assert.deepEqual(pitches("C7"), [0, 4, 7, 10]);
  assert.deepEqual(pitches("F#m"), [0, 3, 7]);
});

test("parses Italian solfege roots, bass notes, and custom interval roots", () => {
  assert.deepEqual(parseChord("DoM7", "it").intervals, [0, 4, 7, 11]);
  assert.deepEqual(parseChord("Fa#7sus4", "it").intervals, [0, 5, 7, 10]);
  assert.deepEqual(parseChord("Rem", "it").intervals, [0, 3, 7]);
  assert.equal(parseChord("Do/Mi", "it").bass.pitch, 4);
  assert.deepEqual(parseChord("Do:[0,4,7]", "it").intervals, [0, 4, 7]);
  assert.equal(parseNote("Sib", "it").pitch, 10);
  assert.equal(noteName(7, false, "it"), "Sol");
  assert.equal(noteName(10, true, "it"), "Si♭");
});

test("supports common qualities and extensions", () => {
  assert.deepEqual(pitches("Bbmaj9"), [0, 2, 4, 7, 11]);
  assert.deepEqual(pitches("Cdim7"), [0, 3, 6, 9]);
  assert.deepEqual(pitches("G7b9"), [0, 1, 4, 7, 10]);
  assert.deepEqual(pitches("Asus2"), [0, 2, 7]);
  assert.deepEqual(pitches("Cadd9"), [0, 2, 4, 7]);
  assert.deepEqual(pitches("C+"), [0, 4, 8]);
});

test("handles additions, omissions, and altered chord tones", () => {
  assert.deepEqual(pitches("Cm7b5"), [0, 3, 6, 10]);
  assert.deepEqual(pitches("C7#9"), [0, 3, 4, 7, 10]);
  assert.deepEqual(pitches("C7#11"), [0, 4, 6, 7, 10]);
  assert.deepEqual(pitches("C7b13"), [0, 4, 7, 8, 10]);
  assert.deepEqual(pitches("C7no5"), [0, 4, 10]);
  assert.deepEqual(pitches("Csus4add9"), [0, 2, 5, 7]);
});

test("parses slash bass separately", () => {
  const chord = parseChord("C/E");
  assert.deepEqual(chord.intervals, [0, 4, 7]);
  assert.equal(chord.bass.pitch, 4);
});

test("custom syntax describes arbitrary pitch-class sets", () => {
  assert.deepEqual(pitches("C:[0,4,7,10]"), [0, 4, 7, 10]);
  assert.deepEqual(pitches("Db:[0,1,11,11]"), [0, 1, 11]);
  assert.deepEqual(pitches("C:[]"), []);
  assert.throws(() => parseChord("C:[0,12]"), /0 to 11/);
});

test("maps enharmonic spellings to the same pitch class", () => {
  assert.equal(parseNote("C#").pitch, parseNote("Db").pitch);
  assert.equal(noteName(parseNote("Db").pitch, true), "D♭");
});

test("selects one keyboard key per chord tone instead of repeating octaves", () => {
  const fSharpMinor = selectPitchInstances(48, 24, 6, [6, 9, 1]);
  assert.deepEqual([...fSharpMinor].sort((a, b) => a - b), [54, 57, 61]);
  assert.equal(selectPitchInstances(48, 24, 0, [0, 4, 7]).size, 3);
});

test("playback notes follow the keyboard register by octaves", () => {
  const chord = parseChord("F#m");
  const lower = getChordMidiNotes(chord, 48);
  const higher = getChordMidiNotes(chord, 60);
  assert.deepEqual(lower, [54, 57, 61]);
  assert.deepEqual(higher, lower.map((midi) => midi + 12));
});

test("suggestions match typed chord prefixes and are parseable", () => {
  const sharpDominant = suggestChords("F#7s");
  assert.ok(sharpDominant.includes("F#7sus4"));
  assert.ok(suggestChords("DbM").includes("DbM"));
  assert.ok(suggestChords("  c m ").includes("Cm"));
  for (const suggestion of [...suggestChords("F#"), ...suggestChords("C7")]) {
    assert.doesNotThrow(() => parseChord(suggestion), suggestion);
  }
  for (const root of ["C", "C#", "Db", "D", "D#", "Eb", "E", "Fb", "E#", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "Cb", "B#"]) {
    for (const suggestion of suggestChords(root, 1000)) assert.doesNotThrow(() => parseChord(suggestion), suggestion);
  }
  assert.ok(suggestChords("Fa#7s", 7, "it").includes("Fa#7sus4"));
  assert.ok(suggestChords("Fa♯7s", 7, "it").includes("Fa#7sus4"));
  for (const root of ["Do", "Do#", "Reb", "Re", "Re#", "Mib", "Mi", "Mi#", "Fab", "Fa", "Fa#", "Solb", "Sol", "Sol#", "Lab", "La", "La#", "Sib", "Si", "Si#", "Dob"]) {
    for (const suggestion of suggestChords(root, 1000, "it")) assert.doesNotThrow(() => parseChord(suggestion, "it"), suggestion);
  }
  assert.deepEqual(suggestChords(""), []);
});

test("rejects malformed or unknown symbols with useful errors", () => {
  assert.throws(() => parseChord(""), /Enter a chord/);
  assert.throws(() => parseChord("H7"), /Start with a root/);
  assert.throws(() => parseChord("Cfoo"), /couldn't read/);
});
