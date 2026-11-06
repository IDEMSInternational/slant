# Slanted

An educational phone game from the IDEMS game studio, based on *Slant*
(also known as Gokigen Naname) from
[Simon Tatham's Portable Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/).

The game is called **Slanted** because the App Store already has an app
called Slant. The puzzle itself is still Slant, and the original C code in
`tools/c-reference/` keeps that name.

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

Built with Angular and Capacitor, for Android and iOS.

## Getting started

The shared engine and shell come from the
[games-common-core](https://github.com/IDEMSInternational/games-common-core)
**submodule**, so clone with:

```sh
git clone --recurse-submodules https://github.com/IDEMSInternational/slanted.git
cd slanted
npm install
```

(If you already cloned without it: `git submodule update --init`.)
Run `npm install` here only, never inside `games-common-core`.

```sh
npm start              # dev server at http://localhost:4200
npm test               # unit tests, including 680 puzzles checked against the original
npm run build          # production web build
npm run apk            # Android debug APK -> Slanted.apk
```

`npm run apk` needs JDK 21 (`JAVA_HOME`) and the Android SDK (`ANDROID_HOME`,
or `android/local.properties` with `sdk.dir=...`).

The iOS app needs a Mac with Xcode (or a macOS GitHub Actions runner). The
web build isn't committed in `ios/`, so build it and copy it in first, then
open or build `ios/App/App.xcodeproj` (scheme `App`; Swift Package Manager,
no CocoaPods):

```sh
npm ci
npm run build
npx cap sync ios
```

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
(which must go up with every store upload) is major × 1,000,000 + minor ×
1,000 + patch, so 1.2.3 is 1002003. `npm version` also writes the same two numbers
into the iOS project (`MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`, via
`games-common-core/ios-release/ios-version.mjs`). Each game has its own version.

To release, bump the version (this commits and tags it, e.g. `v1.0.1`), push
with the tag, then build:

```sh
npm version patch      # or minor / major
git push --follow-tags
```

For iOS, then run **iOS - Release** from the repository's Actions tab: it
builds the app and uploads it to TestFlight. As on Google Play, each upload
needs a new version.

While in beta the version stays below 1.0.0 (0.1.0, 0.2.0, ...); 1.0.0 is the
first full public release. For the first release, tag the current version
instead: `git tag v0.1.0`.

### iOS release setup

**iOS - Release** (`.github/workflows/ios-release.yml`) runs the iOS release
shared by every IDEMS game, from games-common-core:
[games-common-core/ios-release/README.md](https://github.com/IDEMSInternational/games-common-core/blob/main/ios-release/README.md)
explains how it works and how a game is set up for it. The IDEMS
organisation's signing variables and secrets are shared with this repository.
Before the first release, the App ID `international.idems.games.slanted` must
be registered with Apple, with its app in App Store Connect, and the first run
needs **allow_provisioning_changes** ticked (see
[#1](https://github.com/IDEMSInternational/slanted/issues/1)).

The App ID is set in several files;
[A game's App ID](https://github.com/IDEMSInternational/games-common-core#a-games-app-id)
lists them and explains how to change it.

## Layout

```
src/games/slanted/          the game: no Angular except board/
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
ios/                        Capacitor's iOS project (with Apple's privacy
                            manifest, App/App/PrivacyInfo.xcprivacy)
.github/workflows/          iOS - Release, which runs the iOS release shared
                            by every game (games-common-core/ios-release/)
assets/app/                 icon and launch screen sources (tools/make-icon.mjs,
                            then npm run app-images for both platforms)
```

## Licence

MIT. Parts are ports of Simon Tatham's Portable Puzzle Collection; see
[LICENSE](LICENSE).
