# chordKeys

An offline piano chord dictionary. Enter a chord symbol to see its notes highlighted on a responsive virtual piano. The app is plain HTML, CSS, and JavaScript with no build step or third-party dependencies.

## Run it

Open `index.html` directly in a browser, or serve this folder locally (for example, `python3 -m http.server`) and open the local address. The page and its assets make no external requests. Automated chord-parser tests use Node's built-in test runner:

```sh
node --test
```

To create a single-file version for easy transfer to a phone, run `node build-single-file.js`. This writes `chordKeys.html` with the CSS and JavaScript embedded. You can choose another output path with `node build-single-file.js /path/to/chordKeys.html`.

As you type, the prompt suggests common chord symbols. Select one with the mouse/touch, or use the arrow keys and Enter. **Play chord** synthesizes a short chord using the browser's built-in Web Audio API; it uses no sample files or network connection. Playback follows the currently selected keyboard octave. Audio is started only after you press the button and may be unavailable in older browsers.

## Chord notation

Use the **English / Italiano** toggle to switch root names and note labels between A–G and Do–Si. Chord suffixes (such as `m`, `7`, `M7`, and `sus4`) work the same in both modes. Changing modes converts a valid chord already in the input and keeps its pitch result.

### Roots and bass notes

Roots are A–G or Do–Si with an optional sharp or flat: `C`, `F#`, `Bb`, `D♭`, `Do`, `Fa#`, `Sib`. Common enharmonic spellings map to the same piano key. A slash note sets the bass marker, for example `C/E` or `Do/Mi`.

### Qualities and extensions

The default quality is major. Supported quality aliases:

| Quality | Symbols |
| --- | --- |
| Major | (no suffix), `M`, `maj`, `major` |
| Minor | `m`, `min`, `-` |
| Diminished | `dim`, `o`, `°` |
| Augmented | `aug`, `+`, `+5` |
| Suspended | `sus`, `sus4`, `sus2` |
| Power chord | `5` |

Supported extensions are `6`, `7`, `9`, `11`, and `13`. A `maj`/`M` before an extension makes its seventh major (for example `Bbmaj9` or `CM7`). Otherwise 7ths use the dominant/minor seventh. Extensions include the chord tones below them, e.g. `C13` contains a 7th, 9th, 11th, and 13th.

Alter or add tones with `b`/`#` plus a degree, or `add` plus a degree: `G7b9`, `C#11`, `Cadd9`. Omit tones with `no` plus a degree: `C7no5`. These can be combined with qualities/extensions, such as `F#7sus4` or `Cdim7`. Degree alterations supported are 1–7, 9, 11, and 13; additions and omissions support 1–7, 9, 11, and 13.

### Any pitch-class combination

To describe any custom set, use a root followed by a colon and a list of semitone intervals from that root, each from 0 to 11:

```text
C:[0,4,7,10]
```

This yields C, E, G, and B♭. Any pitch-class subset can be represented, including an empty list (`C:[]`). Duplicate intervals are deduplicated.

## Keyboard and register

The keyboard displays exactly two octaves (24 semitones) at a time. Use −/+ to shift the view by an octave. One key is marked for each chord tone, arranged above the root where possible; root and slash bass use distinct colors, and the note names remain available as text. The view can shift from C0–B1 through C7–B8.

## Notes

This is a pitch-class dictionary, not a voicing or fingering generator. Altered extensions are mapped to equal-tempered keys; enharmonic spelling is simplified for display. Chord symbols have multiple conventions, so for an unusual or ambiguous combination the custom interval form is the unambiguous option.
