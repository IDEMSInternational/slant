import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PuzzleHome } from '@studio/container/puzzle-home/puzzle-home';
import { PuzzleNotice } from '@studio/container/puzzle-notice/puzzle-notice';
import { PuzzleScreens } from '@studio/container/puzzle-screens';
import { PuzzleShell } from '@studio/container/puzzle-shell/puzzle-shell';
import { PuzzleStage } from '@studio/container/puzzle-stage/puzzle-stage';
import { PuzzleSplash } from '@studio/container/puzzle-splash/puzzle-splash';
import { PuzzleSwitch } from '@studio/container/puzzle-switch/puzzle-switch';
import { PuzzleTutorial } from '@studio/container/puzzle-tutorial/puzzle-tutorial';
import { SlantedBoard } from '../games/slanted/board/slanted-board';
import { slantedGame } from '../games/slanted/slanted-game';
import { slantedTutorial } from '../games/slanted/tutorial';

import { version } from '../../package.json';

@Component({
  selector: 'app-root',
  imports: [PuzzleHome, PuzzleNotice, PuzzleShell, PuzzleStage, PuzzleSplash, PuzzleSwitch, PuzzleTutorial, SlantedBoard],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly game = slantedGame;
  /** Home page, daily puzzles, Beat the clock, timed play and the tutorial. */
  protected readonly screens = new PuzzleScreens(slantedGame, slantedTutorial, version);

  /** Thinking mode: swipes draw dotted lines, to try out a hypothesis. */
  protected readonly thinking = signal(false);
  protected readonly hasThoughts = computed(() => this.screens.play()?.state().tentative.includes(1) ?? false);

  /** Ends the hypothesis: keep its dotted lines as solid ones, or remove them. */
  protected resolveThoughts(keep: boolean): void {
    this.screens.play()?.move({ kind: keep ? 'keep-thoughts' : 'discard-thoughts' });
  }
}
