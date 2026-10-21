#!/bin/sh
# Builds the original C Slant generator and records reference puzzles
# for the TypeScript port's tests.
#
# Usage: tools/c-reference/generate-fixtures.sh [path-to-original-puzzles-repo]
# Needs: gcc, node. Default puzzles path: ../puzzles (sibling folder).

set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PUZZLES="${1:-$ROOT/../puzzles}"
BUILD="$HERE/build"
OUT="$ROOT/src/games/slant/testing/reference-puzzles.json"

mkdir -p "$BUILD" "$(dirname "$OUT")"
gcc -O2 -std=c99 -I"$PUZZLES" -o "$BUILD/slant-reference" \
    "$HERE/slant-reference.c" \
    "$PUZZLES/slant.c" "$PUZZLES/dsf.c" "$PUZZLES/findloop.c" \
    "$PUZZLES/random.c" "$PUZZLES/malloc.c" "$PUZZLES/misc.c" "$PUZZLES/nullfe.c"

# Parameter sets: both difficulties, every size we offer, odd shapes.
PARAMS="2x2de 2x2dh 3x5dh 4x4de 4x4dh 5x5de 5x5dh 6x6de 6x6dh 7x7de 7x7dh 8x8de 8x8dh 9x4de 10x10de 10x10dh 12x10dh"

# Seeds: a fixed mix of short seeds and 15-digit seeds like the app makes.
SEEDS=""
i=1
while [ $i -le 20 ]; do
    SEEDS="$SEEDS $i $((i * 7919))$((i * 104729))31337"
    i=$((i + 1))
done

TSV="$BUILD/reference.tsv"
: > "$TSV"
for p in $PARAMS; do
    "$BUILD/slant-reference" "$p" $SEEDS >> "$TSV"
done

node -e '
const fs = require("fs");
const rows = fs.readFileSync(process.argv[1], "utf8").trim().split(/\r?\n/)
  .map(l => { const [params, seed, description, solution] = l.split("\t");
              return { params, seed, description, solution }; });
fs.writeFileSync(process.argv[2], JSON.stringify(rows, null, 1) + "\n");
console.log(rows.length + " reference puzzles written to " + process.argv[2]);
' "$TSV" "$OUT"
