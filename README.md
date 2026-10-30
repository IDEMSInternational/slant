# Slant

An educational phone game from the IDEMS game studio, based on *Slant*
(also known as Gokigen Naname) from
[Simon Tatham's Portable Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/).

Draw a diagonal line in every square so that each numbered point touches
exactly that many lines, without the lines forming a closed loop.

- Swipe diagonally across a square to draw its line; tap a line to remove
  it. Connected lines share a colour.
- **Thinking mode** for hypotheses: lines are drawn dotted and still count
  towards the solution; keep or discard them all at once. Solid lines are
  protected while thinking.
- Sizes 4×4 to 10×10 (or custom up to 15×15), Easy and Hard.
- An interactive tutorial on first launch (and from the **?** button).
- Puzzles are generated on the device; the generator is an exact port of
  the original, so a game ID such as `8x8dh#123456789012345` gives the same
  puzzle as the original collection.

Built with Angular and Capacitor (Android, and iOS later).

## Getting started

The shared engine and shell come from the
[games-common-core](https://github.com/IDEMSInternational/games-common-core)
**submodule**, so clone with:

```sh
git clone --recurse-submodules https://github.com/IDEMSInternational/slant.git
cd slant
npm install
```

(If you already cloned without it: `git submodule update --init`.)
Run `npm install` here only, never inside `games-common-core`.

```sh
npm start              # dev server at http://localhost:4200
npm test               # unit tests, including 680 puzzles checked against the original
npm run build          # production web build
npm run apk            # Android debug APK -> Slant.apk
```

`npm run apk` needs JDK 21 (`JAVA_HOME`) and the Android SDK (`ANDROID_HOME`,
or `android/local.properties` with `sdk.dir=...`).

To use a newer version of the shared code:

```sh
git submodule update --remote games-common-core
npm test -- --watch=false
git commit -am "Update games-common-core"
```

## Releasing

The version lives in `package.json` only, as major.minor.patch (patch for
fixes, minor for new features, major for big changes). The menu shows it, and
the Android build reads it: `versionName` is the same text, and `versionCode`
(which must go up with every store upload) is major × 1,000,000 + minor × 1,000
+ patch, so 1.2.3 is 1002003. Each game has its own version.

To release, bump the version (this commits and tags it, e.g. `v1.0.1`), push
with the tag, then build:

```sh
npm version patch      # or minor / major
git push --follow-tags
```

While in beta the version stays below 1.0.0 (0.1.0, 0.2.0, ...); 1.0.0 is the
first full public release. For the first release, tag the current version
instead: `git tag v0.1.0`.

## Layout

```
src/games/slant/            the game: no Angular except board/
  generator/                puzzle generation (random maze, then clues)
  solver/                   deduction solver (Easy and Hard techniques)
  state, moves, input, ...  rules and touch handling
  tutorial.ts               the interactive tutorial's steps
  board/                    the Angular board component (SVG) and line colours
  testing/                  reference puzzles recorded from the original
src/app/                    wires the game into the shared shell
games-common-core/          shared engine and shell (submodule)
tools/c-reference/          builds the original C generator to record
                            reference puzzles (needs gcc and a checkout
                            of the original collection next to this one)
android/                    Capacitor's Android project
```

## Licence

MIT. Parts are ports of Simon Tatham's Portable Puzzle Collection; see
[LICENSE](LICENSE).
