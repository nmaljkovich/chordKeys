(function () {
  "use strict";

  const form = document.getElementById("chord-form");
  const input = document.getElementById("chord-input");
  const status = document.getElementById("chord-status");
  const keyboard = document.getElementById("keyboard");
  const title = document.getElementById("result-title");
  const noteList = document.getElementById("note-list");
  const suggestions = document.getElementById("chord-suggestions");
  const playButton = document.getElementById("play-chord");
  const rangeLabel = document.getElementById("range-label");
  const rangeDown = document.getElementById("range-down");
  const rangeUp = document.getElementById("range-up");
  const WHITE_PITCHES = new Set([0, 2, 4, 5, 7, 9, 11]);
  let firstMidi = 48; // C3; exactly 24 semitones are always shown.
  let currentChord = null;
  let activeSuggestion = -1;
  let audioContext = null;

  function hideSuggestions() {
    suggestions.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeSuggestion = -1;
  }

  function renderSuggestions(query) {
    const matches = ChordKeys.suggestChords(query);
    if (!matches.length) { hideSuggestions(); return; }
    activeSuggestion = -1;
    suggestions.innerHTML = matches.map((symbol, index) =>
      `<div id="chord-option-${index}" class="suggestion-option" role="option" aria-selected="false" data-symbol="${symbol}" tabindex="-1"><strong>${symbol}</strong><span>Show this chord</span></div>`
    ).join("");
    suggestions.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.removeAttribute("aria-activedescendant");
  }

  function setActiveSuggestion(index) {
    const options = [...suggestions.querySelectorAll("[role=option]")];
    if (!options.length) return;
    activeSuggestion = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => option.setAttribute("aria-selected", String(optionIndex === activeSuggestion)));
    input.setAttribute("aria-activedescendant", options[activeSuggestion].id);
    options[activeSuggestion].scrollIntoView({ block: "nearest" });
  }

  function chooseSuggestion(symbol) {
    input.value = symbol;
    hideSuggestions();
    form.requestSubmit();
  }

  function midiName(midi, preferFlats) {
    const name = ChordKeys.noteName(midi % 12, preferFlats);
    return `${name}${Math.floor(midi / 12) - 1}`;
  }

  function renderKeyboard() {
    const lastMidi = firstMidi + 23;
    const preferFlats = currentChord ? currentChord.root.flat : false;
    const white = [];
    const black = [];
    for (let midi = firstMidi; midi <= lastMidi; midi += 1) {
      const pitch = midi % 12;
      if (WHITE_PITCHES.has(pitch)) white.push({ midi, pitch });
      else black.push({ midi, pitch });
    }

    const whiteIndex = new Map(white.map((key, index) => [key.midi, index]));
    const tones = currentChord ? new Set(currentChord.intervals.map((interval) => (currentChord.root.pitch + interval) % 12)) : new Set();
    const bassPitch = currentChord ? (currentChord.bass || currentChord.root).pitch : null;
    const rootPitch = currentChord ? currentChord.root.pitch : null;
    const displayPitches = new Set(tones);
    if (currentChord && currentChord.bass) displayPitches.add(bassPitch);
    const selectedMidi = currentChord
      ? ChordKeys.selectPitchInstances(firstMidi, 24, rootPitch, [...displayPitches])
      : new Set();
    const makeKey = (key, isBlack) => {
      const highlighted = selectedMidi.has(key.midi);
      const isRoot = highlighted && key.pitch === rootPitch;
      const isBass = Boolean(highlighted && currentChord && currentChord.bass && key.pitch === bassPitch);
      const classes = ["key", isBlack ? "black-key" : "white-key"];
      if (highlighted) classes.push("key-tone");
      if (isRoot) classes.push("root-tone");
      if (isBass) classes.push("bass-tone");
      const keyName = midiName(key.midi, preferFlats);
      const marker = highlighted ? `${keyName}, ${isRoot ? "root" : isBass ? "slash bass" : "chord tone"}` : keyName;
      const style = isBlack ? ` style="left:${((whiteIndex.get(key.midi - 1) + 1) / 14) * 100}%"` : "";
      return `<div class="${classes.join(" ")}"${style} role="img" aria-label="${marker}"><span class="key-label" aria-hidden="true">${keyName}</span></div>`;
    };

    keyboard.innerHTML = white.map((key) => makeKey(key, false)).join("") + black.map((key) => makeKey(key, true)).join("");
    keyboard.setAttribute("aria-label", currentChord
      ? `Two-octave piano from ${midiName(firstMidi, preferFlats)} to ${midiName(lastMidi, preferFlats)}. Highlighted chord tones: ${currentChord.intervals.map((interval) => ChordKeys.noteName(currentChord.root.pitch + interval, preferFlats)).join(", ")}.`
      : `Two-octave piano from ${midiName(firstMidi, false)} to ${midiName(lastMidi, false)}. Enter a chord to highlight its notes.`);
    rangeLabel.textContent = `${midiName(firstMidi, false)}–${midiName(lastMidi, false)}`;
    rangeDown.disabled = firstMidi <= 12;
    rangeUp.disabled = firstMidi >= 96;
  }

  function showChord(chord) {
    currentChord = chord;
    status.textContent = "";
    hideSuggestions();
    title.textContent = chord.input;
    const preferFlats = chord.root.flat;
    const notes = chord.intervals.map((interval) => ChordKeys.noteName(chord.root.pitch + interval, preferFlats));
    noteList.textContent = notes.length ? notes.join(" · ") : "No notes in this custom pitch set.";
    if (chord.bass) noteList.textContent += ` · bass ${chord.bass.name}`;
    playButton.disabled = !chord.intervals.length && !chord.bass;
    renderKeyboard();
  }

  function addSynthVoice(context, midi, volume, startTime) {
    const frequency = 440 * (2 ** ((midi - 69) / 12));
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(volume, startTime + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.15);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 1.17);

    // A quiet, quickly fading octave harmonic gives the synthesized tone a plucked edge.
    const harmonic = context.createOscillator();
    const harmonicEnvelope = context.createGain();
    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(frequency * 2, startTime);
    harmonicEnvelope.gain.setValueAtTime(0.0001, startTime);
    harmonicEnvelope.gain.exponentialRampToValueAtTime(volume * 0.16, startTime + 0.012);
    harmonicEnvelope.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
    harmonic.connect(harmonicEnvelope);
    harmonicEnvelope.connect(context.destination);
    harmonic.start(startTime);
    harmonic.stop(startTime + 0.3);
  }

  async function playChord() {
    if (!currentChord) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      status.textContent = "Audio playback is not supported by this browser.";
      return;
    }
    try {
      audioContext ||= new AudioContextClass();
      if (audioContext.state === "suspended") await audioContext.resume();
      const uniqueNotes = ChordKeys.getChordMidiNotes(currentChord, firstMidi);
      const volume = Math.min(0.075, 0.055 * Math.sqrt(3 / uniqueNotes.length));
      const startTime = audioContext.currentTime + 0.025;
      uniqueNotes.forEach((midi) => addSynthVoice(audioContext, midi, volume, startTime));
      status.textContent = `Playing a synthesized ${currentChord.input}.`;
    } catch (_error) {
      status.textContent = "Couldn't start audio. Try tapping Play chord again.";
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      showChord(ChordKeys.parseChord(input.value));
    } catch (error) {
      status.textContent = error.message;
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
  });

  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    renderSuggestions(input.value);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && !suggestions.hidden) {
      event.preventDefault();
      setActiveSuggestion(activeSuggestion + 1);
    } else if (event.key === "ArrowUp" && !suggestions.hidden) {
      event.preventDefault();
      setActiveSuggestion(activeSuggestion < 0 ? suggestions.children.length - 1 : activeSuggestion - 1);
    } else if (event.key === "Enter" && !suggestions.hidden && activeSuggestion >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions.children[activeSuggestion].dataset.symbol);
    } else if (event.key === "Escape" && !suggestions.hidden) {
      hideSuggestions();
    }
  });
  suggestions.addEventListener("click", (event) => {
    const option = event.target.closest("[data-symbol]");
    if (option) chooseSuggestion(option.dataset.symbol);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".input-wrap")) hideSuggestions();
  });
  playButton.addEventListener("click", playChord);
  document.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.example;
      form.requestSubmit();
    });
  });

  rangeDown.addEventListener("click", () => {
    if (firstMidi > 12) { firstMidi -= 12; renderKeyboard(); }
  });
  rangeUp.addEventListener("click", () => {
    if (firstMidi < 96) { firstMidi += 12; renderKeyboard(); }
  });

  renderKeyboard();
})();
