import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { hasSeenTutorial, markTutorialSeen } from '@studio/container/first-run';
import { PuzzleShell } from '@studio/container/puzzle-shell/puzzle-shell';
import { PuzzleTutorial } from '@studio/container/puzzle-tutorial/puzzle-tutorial';
import { SessionStore } from '@studio/container/session-store';
import { TutorialStore } from '@studio/container/tutorial-store';
import { SlantBoard } from '../games/slant/board/slant-board';
import { slantGame } from '../games/slant/slant-game';
import { slantTutorial } from '../games/slant/tutorial';

@Component({
  selector: 'app-root',
  imports: [PuzzleShell, PuzzleTutorial, SlantBoard],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly session = new SessionStore(slantGame);
  /** The tutorial in progress, if any. It runs automatically on first launch. */
  protected readonly tutorial = signal(hasSeenTutorial(slantGame.id) ? null : this.newTutorial());

  /** Thinking mode: swipes draw dotted lines, to try out a hypothesis. */
  protected readonly thinking = signal(false);
  protected readonly hasThoughts = computed(() => this.session.state().tentative.includes(1));

  protected startTutorial(): void {
    this.tutorial.set(this.newTutorial());
  }

  protected endTutorial(): void {
    markTutorialSeen(slantGame.id);
    this.tutorial.set(null);
  }

  /** Ends the hypothesis: keep its dotted lines as solid ones, or remove them. */
  protected resolveThoughts(keep: boolean): void {
    this.session.move({ kind: keep ? 'keep-thoughts' : 'discard-thoughts' });
  }

  private newTutorial() {
    return new TutorialStore(slantGame, slantTutorial, () => this.endTutorial());
  }
}
