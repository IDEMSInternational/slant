import { TestBed } from '@angular/core/testing';
import { SessionStore } from '@studio/container/session-store';
import { SlantMove } from '../games/slant/moves';
import { SlantState } from '../games/slant/state';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    history.replaceState(null, ''); // the home page
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  const sessionOf = (app: App) =>
    (app as unknown as { screens: { session: SessionStore<unknown, SlantState, SlantMove> } }).screens.session;

  it('starts with the tutorial: a Slant board inside the shared tutorial frame', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('How to play Slant');
    expect(element.querySelector('slant-board svg')).toBeTruthy();
    expect(element.querySelectorAll('.clue').length).toBe(6);
    expect(element.querySelector('puzzle-splash img')?.getAttribute('src')).toBe('studio/idems-games-logo.jpg');
  });

  it('shades the squares that have a line in them, solid or dotted', async () => {
    localStorage.setItem('slant.tutorialSeen', '1'); // straight to the home page
    const fixture = TestBed.createComponent(App);
    const session = sessionOf(fixture.componentInstance);
    (fixture.componentInstance as unknown as { screens: { openFreePlay(): void } }).screens.openFreePlay();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('slant-board .filled').length).toBe(0);

    session.move({ kind: 'set', changes: [{ x: 0, y: 0, slash: 1 }] });
    session.move({ kind: 'set', changes: [{ x: 1, y: 0, slash: 1, tentative: true }] });
    await fixture.whenStable();
    const shaded = Array.from(element.querySelectorAll('slant-board .filled'), (r) => r.getAttribute('x'));
    expect(shaded).toEqual(['0.03', '1.03']);
  });

  it('continues the game after a reload, dotted lines and Solve included', () => {
    const first = sessionOf(TestBed.createComponent(App).componentInstance);
    first.move({ kind: 'set', changes: [{ x: 0, y: 0, slash: 1, tentative: true }] });
    first.solve(); // a move holding an Int8Array
    const solved = Array.from(first.state().slashes);
    first.undo();

    const second = sessionOf(TestBed.createComponent(App).componentInstance);
    expect(second.gameId()).toBe(first.gameId());
    expect(second.state().tentative[0]).toBe(1);
    second.redo();
    expect(second.completed()).toBe(true);
    expect(Array.from(second.state().slashes)).toEqual(solved);
  });
});
