(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ChordKeys = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PITCHES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SHARPS = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const FLATS = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const SUGGESTION_ROOTS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "Fb", "E#", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "Cb", "B#"];
  const SUGGESTION_SUFFIXES = [
    "", "M", "maj", "major", "m", "min", "dim", "dim7", "aug", "+", "5", "sus", "sus2", "sus4", "6", "m6", "7", "m7", "maj7", "M7", "m7b5",
    "9", "m9", "maj9", "M9", "11", "m11", "maj11", "M11", "13", "m13", "maj13", "M13", "7sus2", "7sus4", "maj7sus4",
    "add9", "add11", "sus2add9", "sus4add9", "7b5", "7#5", "7b9", "7#9", "7#11", "7b13", "7no5"
  ];
  let suggestionCatalog;

  function parseNote(text) {
    const match = /^([A-Ga-g])([#b♯♭]?)$/.exec(text);
    if (!match) throw new Error(`“${text}” is not a valid note. Use a note from A to G, optionally followed by # or b.`);
    const letter = match[1].toUpperCase();
    const accidental = match[2];
    const offset = accidental === "#" || accidental === "♯" ? 1 : accidental === "b" || accidental === "♭" ? -1 : 0;
    return { name: letter + accidental.replace("#", "♯").replace("b", "♭"), pitch: (PITCHES[letter] + offset + 12) % 12, flat: accidental === "b" || accidental === "♭" };
  }

  function intervalsFor(suffix) {
    let remaining = suffix;
    let intervals;
    let quality = "major";

    // Pull out explicit additions, omissions, and alterations before reading the quality/extension.
    const additions = [];
    const omissions = [];
    const alterations = [];
    remaining = remaining.replace(/add(13|11|9|7|6|5|4|3|2|1)|no(13|11|9|7|6|5|4|3|2|1)|([b#♭♯])(13|11|9|7|6|5|4|3|2|1)/gi, (token, add, omit, accidental, degree) => {
      if (add) additions.push(Number(add));
      else if (omit) omissions.push(Number(omit));
      else alterations.push({ accidental: accidental === "b" || accidental === "♭" ? -1 : 1, degree: Number(degree) });
      return "";
    });

    let suspended = null;
    remaining = remaining.replace(/sus(2|4)?/i, (_token, degree) => {
      suspended = degree === "2" ? 2 : 5;
      return "";
    });

    // Extension symbols may precede or follow the suspension marker (7sus4 / sus4add9).
    let extension = null;
    let majorExtension = false;
    remaining = remaining.replace(/(maj|major|M)?(13|11|9|7|6)/, (token, major, number) => {
      extension = Number(number);
      majorExtension = Boolean(major);
      return "";
    });

    const qualityToken = remaining.trim();
    if (qualityToken === "" || /^(M|maj|major)$/i.test(qualityToken) && qualityToken !== "m" && qualityToken !== "min") {
      quality = "major";
    } else if (/^(m|min|-)$/i.test(qualityToken)) {
      quality = "minor";
    } else if (/^(dim|o|°)$/i.test(qualityToken)) {
      quality = "diminished";
    } else if (/^(aug|\+|\+5)$/i.test(qualityToken)) {
      quality = "augmented";
    } else if (/^5$/.test(qualityToken)) {
      quality = "power";
    } else {
      throw new Error(`I couldn't read “${suffix || "the chord"}”. Check the quality/extension spelling, or use custom intervals like C:[0,4,7].`);
    }

    if (suspended !== null) intervals = [0, suspended, 7];
    else if (quality === "minor") intervals = [0, 3, 7];
    else if (quality === "diminished") intervals = [0, 3, 6];
    else if (quality === "augmented") intervals = [0, 4, 8];
    else if (quality === "power") intervals = [0, 7];
    else intervals = [0, 4, 7];

    if (extension !== null) {
      if (extension >= 7) {
        if (quality === "diminished" && extension === 7) intervals.push(9);
        else intervals.push(majorExtension ? 11 : 10);
      }
      if (extension >= 9) intervals.push(14);
      if (extension >= 11) intervals.push(17);
      if (extension >= 13) intervals.push(21);
      if (extension === 6) intervals.push(9);
    }

    const degreeIntervals = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: majorExtension ? 11 : 10, 9: 14, 11: 17, 13: 21 };
    for (const alteration of alterations) {
      const degree = alteration.degree;
      const base = degreeIntervals[degree];
      if (base === undefined) continue;
      const altered = base + alteration.accidental;
      const candidates = degree === 3 ? [3, 4] : degree === 5 ? [6, 7, 8] : degree === 7 ? [9, 10, 11] : degree === 9 ? [13, 14, 15] : degree === 11 ? [16, 17, 18] : degree === 13 ? [20, 21, 22] : [base - 1, base, base + 1];
      intervals = intervals.filter((value) => !candidates.includes(value));
      intervals.push(altered);
    }

    const addedIntervals = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 9: 14, 11: 17, 13: 21 };
    for (const degree of additions) if (addedIntervals[degree] !== undefined) intervals.push(addedIntervals[degree]);

    const omittedIntervals = { 2: [1, 2, 3], 3: [3, 4], 4: [4, 5, 6], 5: [6, 7, 8], 6: [8, 9, 10], 7: [9, 10, 11], 9: [13, 14, 15], 11: [16, 17, 18], 13: [20, 21, 22] };
    for (const degree of omissions) {
      if (degree === 1) intervals = intervals.filter((value) => value !== 0);
      else intervals = intervals.filter((value) => !(omittedIntervals[degree] || []).includes(value));
    }

    return [...new Set(intervals.map((value) => ((value % 12) + 12) % 12))].sort((a, b) => a - b);
  }

  function parseChord(input) {
    const source = String(input || "").trim();
    if (!source) throw new Error("Enter a chord symbol to get started.");

    // Custom interval syntax deliberately accepts only pitch-class intervals (0–11).
    const custom = /^([A-Ga-g][#b♯♭]?):\s*\[\s*(\d+(?:\s*,\s*\d+)*)?\s*\]$/.exec(source);
    if (custom) {
      const root = parseNote(custom[1]);
      const values = custom[2] ? custom[2].split(",").map(Number) : [];
      if (values.some((value) => value < 0 || value > 11)) throw new Error("Custom intervals must be semitones from 0 to 11.");
      return { input: source, root, bass: null, intervals: [...new Set(values)].sort((a, b) => a - b), custom: true };
    }

    let symbol = source;
    let bass = null;
    const slash = /\/([A-Ga-g][#b♯♭]?)$/.exec(symbol);
    if (slash) {
      bass = parseNote(slash[1]);
      symbol = symbol.slice(0, slash.index);
    }

    const match = /^([A-Ga-g][#b♯♭]?)(.*)$/.exec(symbol);
    if (!match) throw new Error("Start with a root note from A to G, such as C, F# or Bb.");
    const root = parseNote(match[1]);
    const intervals = intervalsFor(match[2].trim());
    return { input: source, root, bass, intervals, custom: false };
  }

  function noteName(pitch, preferFlats) {
    return (preferFlats ? FLATS : SHARPS)[((pitch % 12) + 12) % 12];
  }

  function selectPitchInstances(firstMidi, keyCount, rootPitch, pitches) {
    const lastMidi = firstMidi + keyCount - 1;
    const rootMidi = Array.from({ length: keyCount }, (_unused, index) => firstMidi + index)
      .find((midi) => midi % 12 === rootPitch);
    if (rootMidi === undefined) return new Set();

    const selected = new Set();
    for (const pitch of new Set(pitches.map((value) => ((value % 12) + 12) % 12))) {
      if (pitch === rootPitch) {
        selected.add(rootMidi);
        continue;
      }
      let chosen;
      for (let midi = rootMidi + 1; midi <= lastMidi; midi += 1) {
        if (midi % 12 === pitch) { chosen = midi; break; }
      }
      if (chosen === undefined) {
        for (let midi = rootMidi - 1; midi >= firstMidi; midi -= 1) {
          if (midi % 12 === pitch) { chosen = midi; break; }
        }
      }
      if (chosen !== undefined) selected.add(chosen);
    }
    return selected;
  }

  function suggestChords(query, limit = 7) {
    const normalized = String(query || "").trim().replace(/\s+/g, "").toLowerCase();
    if (!normalized) return [];
    suggestionCatalog ||= SUGGESTION_ROOTS.flatMap((root) => SUGGESTION_SUFFIXES.map((suffix) => `${root}${suffix}`));
    return suggestionCatalog.filter((symbol) => symbol.toLowerCase().startsWith(normalized)).slice(0, limit);
  }

  function getChordMidiNotes(chord, firstMidi) {
    const rootOffset = (chord.root.pitch - (firstMidi % 12) + 12) % 12;
    const rootMidi = firstMidi + rootOffset;
    const notes = chord.intervals.map((interval) => rootMidi + interval);
    if (chord.bass) {
      const bassOffset = (chord.bass.pitch - chord.root.pitch + 12) % 12;
      notes.push(rootMidi - 12 + bassOffset);
    }
    return [...new Set(notes)];
  }

  return { parseChord, parseNote, noteName, selectPitchInstances, suggestChords, getChordMidiNotes, SHARPS, FLATS };
});
