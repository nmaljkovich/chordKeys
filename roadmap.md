# chordKeys Roadmap

## Product goal

Build **chordKeys**, a mobile-friendly, fully offline piano chord dictionary. A user enters a chord symbol (for example `CM7`, `F#7sus4`, `DbM`, `C7`, or `F#m`), taps **Show keys**, and sees the chord tones highlighted with circles on a virtual piano keyboard.

The app will be a self-contained static HTML/CSS/JavaScript solution: no server, build step, network connection, external fonts, libraries, or assets are required to use it. The keyboard displays no more than two octaves at a time.

## Product principles

- **Offline first:** all parsing, chord data, styles, and UI ship locally.
- **Mobile first:** controls and keys are touch-friendly, responsive, and usable in portrait orientation.
- **Musically explicit:** show the parsed chord tones and explain invalid or ambiguous input instead of silently guessing.
- **Flexible chord vocabulary:** support conventional chord symbols and a documented interval-based form so users can request unusual combinations, not just a fixed list of chord presets.
- **Small keyboard, clear answer:** keep the displayed range to at most 24 semitones; make the selected voicing/range behavior understandable.

## Roadmap

### 1. Define notation and behavior

- Specify accepted root spellings: A–G, optional `#`/`b`, and enharmonic equivalents.
- Define chord-quality aliases and symbol conventions, including major (`M`, `maj`, or no suffix), minor (`m`, `min`, `-`), diminished, augmented, suspended, power, and common seventh chords.
- Define extensions and alterations: 6, 7, 9, 11, 13; `b`/`#` alterations; added tones (`add9`, etc.); omitted tones (`no3`, `no5`); and combinations such as `7sus4`.
- Decide how slash chords work (for example, `C/E`): identify the bass note and distinguish it visually while still showing the chord tones.
- Document supported aliases and parsing precedence. In particular, distinguish a flat sign in a root such as `Db` from a flat alteration later in a symbol.
- Define octave/range behavior: show a fixed two-octave window around a default register, allow shifting the window, and mark every occurrence of a pitch class in that window. Never render more than 24 semitones.
- Decide how to show enharmonic spellings: preserve the user's root spelling where possible while mapping notes to the same keyboard keys.

**Deliverable:** a short notation reference and agreed behavior for ambiguous or unsupported symbols.

### 2. Create the offline app shell

- Add a semantic HTML page with a chord prompt, **Show keys** button, result/status area, and piano keyboard.
- Add locally authored CSS and JavaScript; use no remote resources or runtime dependencies.
- Make the layout responsive, with a readable input, visible focus states, and touch targets suitable for phones.
- Ensure the form works with both the button and the mobile keyboard's submit/Go action.
- Add a brief offline/use note and keep the essential interface usable without network access.

**Acceptance checks:** the page opens directly from local files in current mobile and desktop browsers; no network requests are needed; keyboard width never exceeds two octaves.

### 3. Implement chord-symbol parsing and pitch mapping

- Parse the root and suffix separately, normalize aliases, and produce a set of semitone intervals from the root.
- Represent chord construction as composable interval operations rather than a finite list of named chord templates. This lets qualities, extensions, alterations, added notes, and omissions combine.
- Include a documented explicit interval notation (for example, `C:[0,4,7,10]`) as an escape hatch for any user-defined pitch-class combination, including combinations without a standard chord name.
- Convert intervals to pitch classes modulo 12, deduplicate resulting notes, and retain useful spelling/role labels where possible (root, third, seventh, altered ninth, and so on).
- Resolve enharmonic roots and slash bass notes to keyboard pitch classes.
- Return actionable parse errors for malformed or unsupported syntax.

**Acceptance checks:** example inputs `CM7`, `F#7sus4`, `DbM`, `C7`, and `F#m` resolve correctly; combinations and alterations produce the expected pitch classes; custom interval input can express any subset of the 12 pitch classes.

### 4. Build the virtual piano and chord display

- Render a correct keyboard with white and black keys for a configurable window of one or two octaves.
- Place clear, high-contrast circular markers over every matching key in the visible range, including repeated notes across octaves.
- Use a secondary visual cue or label for the root and slash bass so these remain distinguishable without relying on color alone.
- Show the interpreted chord name and note list beside or below the keyboard.
- Add controls to move the two-octave window up or down while enforcing the 24-semitone maximum.
- Handle narrow screens without clipping controls or making keys too small to identify.

**Acceptance checks:** black-key geometry and note positions are correct; markers align on both key colors; shifting register updates notes without changing the chord; small screens remain usable.

### 5. Accessibility, resilience, and polish

- Associate a visible label and helpful example with the input; expose parse results and errors to assistive technology with appropriate live status semantics.
- Provide text descriptions for highlighted notes and distinguish root/other tones by shape, outline, or label as well as color.
- Verify keyboard-only operation, browser zoom, reduced-motion preferences, and sufficient contrast.
- Handle empty input, whitespace, case/alias normalization, invalid roots, duplicate intervals, and unusual valid interval combinations.
- Keep the app functional with JavaScript and CSS loaded from the local project only; provide a helpful message if scripting is unavailable.

### 6. Test and document

- Add a compact test suite or browser-check page for parsing, enharmonic mappings, alterations, slash chords, custom intervals, and keyboard boundaries.
- Include regression cases for the example symbols and representative edge cases such as `Bbmaj7`, `Cdim7`, `G7b9`, `Asus2`, `Cadd9`, and `C/E`.
- Manually test on narrow mobile viewports and at least one desktop browser, including direct file opening and airplane/offline mode.
- Document supported syntax, examples, local launch instructions, and known notation limitations in the project README.

## Initial release scope

The first usable release should include the offline single-page app, common chord-symbol parsing, arbitrary custom interval input, a two-octave keyboard with a movable range, root/bass distinction, responsive styling, and basic regression checks. More specialized naming conventions can be added incrementally without changing the interval-based core.

## Definition of done

- A user can enter a supported chord symbol or custom interval set and see the corresponding keys highlighted.
- The keyboard shows at most two octaves and can be shifted to reveal other registers.
- The app runs locally without internet access or external dependencies.
- The core flow works on mobile and desktop, and parsing errors are understandable.
- The notation and launch instructions are documented, and key musical mappings have regression coverage.
