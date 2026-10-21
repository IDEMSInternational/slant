import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('starts with the tutorial: a Slant board inside the shared tutorial frame', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('How to play Slant');
    expect(element.querySelector('slant-board svg')).toBeTruthy();
    expect(element.querySelectorAll('.clue').length).toBe(6);
  });
});
