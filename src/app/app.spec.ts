import { TestBed } from '@angular/core/testing';
import { SessionStore } from '@studio/container/session-store';
import { SlantMove } from '../games/slant/moves';
import { SlantState } from '../games/slant/state';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  const sessionOf = (app: App) =>
    (app as unknown as { session: SessionStore<unknown, SlantState, SlantMove> }).session;

  it('starts with the tutorial: a Slant board inside the shared tutorial frame', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('How to play Slant');
    expect(element.querySelector('slant-board svg')).toBeTruthy();
    expect(element.querySelectorAll('.clue').length).toBe(6);
    expect(element.querySelector('puzzle-splash img')?.getAttribute('src')).toBe('studio/idems-games-logo.jpg');
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
