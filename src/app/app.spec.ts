import { TestBed } from '@angular/core/testing';
import { SessionStore } from '@studio/container/session-store';
import { SlantedMove } from '../games/slanted/moves';
import { SlantedState } from '../games/slanted/state';
import { slantedGame } from '../games/slanted/slanted-game';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    history.replaceState(null, ''); // the home page
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  /** A puzzle session as timed play keeps it (opening the app again: another one). */
  const newSession = () =>
    TestBed.runInInjectionContext(
      () => new SessionStore<unknown, SlantedState, SlantedMove>(slantedGame as never),
    );

  it('starts with the tutorial: a Slanted board inside the shared tutorial frame', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('How to play Slanted');
    expect(element.querySelector('slanted-board svg')).toBeTruthy();
    expect(element.querySelectorAll('.clue').length).toBe(6);
    expect(element.querySelector('puzzle-splash img')?.getAttribute('src')).toBe('studio/idems-games-logo.jpg');
  });

  it('shades the squares that have a line in them, solid or dotted', async () => {
    localStorage.setItem('slanted.tutorialSeen', '1'); // straight to the home page
    const fixture = TestBed.createComponent(App);
    const screens = (
      fixture.componentInstance as unknown as {
        screens: { openTimed(): void; timed: { move(move: SlantedMove): void } };
      }
    ).screens;
    screens.openTimed();
    const session = screens.timed;
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('slanted-board .filled').length).toBe(0);

    session.move({ kind: 'set', changes: [{ x: 0, y: 0, slash: 1 }] });
    session.move({ kind: 'set', changes: [{ x: 1, y: 0, slash: 1, tentative: true }] });
    await fixture.whenStable();
    const shaded = Array.from(element.querySelectorAll('slanted-board .filled'), (r) => r.getAttribute('x'));
    expect(shaded).toEqual(['0.03', '1.03']);
  });

  it('continues the game after a reload, dotted lines and Solve included', () => {
    const first = newSession();
    first.move({ kind: 'set', changes: [{ x: 0, y: 0, slash: 1, tentative: true }] });
    first.solve(); // a move holding an Int8Array
    const solved = Array.from(first.state().slashes);
    first.undo();

    const second = newSession();
    expect(second.gameId()).toBe(first.gameId());
    expect(second.state().tentative[0]).toBe(1);
    second.redo();
    expect(second.completed()).toBe(true);
    expect(Array.from(second.state().slashes)).toEqual(solved);
  });
});
