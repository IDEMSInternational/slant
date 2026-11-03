import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PuzzleScreens } from '@studio/container/puzzle-screens';
import { SlantMove } from '../games/slant/moves';
import { SlantParams } from '../games/slant/params';
import { SlantState } from '../games/slant/state';
import { App } from './app';

type Screens = PuzzleScreens<SlantParams, SlantState, SlantMove, unknown>;

/** The ladder in a game with difficulties: it asks for one first. */
describe('Ladder (Slant)', () => {
  let fixture: ComponentFixture<App>;
  let screens: Screens;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('slant.noticeSeen', '2026-10-28');
    localStorage.setItem('slant.tutorialSeen', '1');
    history.replaceState(null, '');
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    fixture = TestBed.createComponent(App);
    screens = (fixture.componentInstance as unknown as { screens: Screens }).screens;
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const text = (selector: string) => element.querySelector(selector)?.textContent?.trim();
  const texts = (selector: string) =>
    Array.from(element.querySelectorAll(selector), (b) => b.textContent!.trim());
  async function openSheet(): Promise<void> {
    screens.openChallenges();
    await fixture.whenStable();
    (element.querySelectorAll('puzzle-home .card button.primary')[2] as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  it('asks for Easy or Hard, then climbs every size at it', async () => {
    localStorage.setItem('slant.ladder.best', JSON.stringify({ 1: 754_000 }));
    await openSheet();
    expect(text('.chooser p')).toBe('Choose a difficulty');
    expect(texts('.chooser .level .name')).toEqual(['Easy', 'Hard']);
    expect(texts('.chooser .level .state')).toEqual(['No best time yet', 'Your best time: 12:34']);

    (element.querySelectorAll('.chooser .level')[1] as HTMLButtonElement).click(); // Hard
    await fixture.whenStable();
    const ladder = screens.ladder()!;
    expect(text('h1')).toBe('Ladder');
    expect(ladder.difficultyName).toBe('Hard');
    expect(ladder.label()).toBe('5×5 Hard');
    expect(element.querySelectorAll('.rungs li').length).toBe(6); // 5×5 to 10×12
  });

  it('offers to continue the unfinished ladder, or start again at either difficulty', async () => {
    screens.openLadder(0, true);
    await fixture.whenStable();
    const popped = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
    screens.goHome();
    await popped;
    await openSheet();
    expect(text('.chooser .level .size')).toBe('Easy · Size 1 of 6');
    expect(text('.chooser p')).toBe('Or start again');
    expect(texts('.chooser .level .name')).toEqual(['Continue', 'Easy', 'Hard']);
  });
});
