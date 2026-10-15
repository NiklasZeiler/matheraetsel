import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes, withComponentInputBinding())],
    }).compileComponents();
  });

  it('shows the three puzzle types on the start page', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Gleichungen');
    expect(text).toContain('Waage');
    expect(text).toContain('Mobile');
    expect(text).not.toContain('Knobler');
  });

  it('shows the four levels of a category', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/k/waage');
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    for (const level of ['Leicht', 'Mittel', 'Schwer', 'Knobler']) {
      expect(text).toContain(level);
    }
  });

  it('sends unknown categories back to the start page', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/k/unbekannt');
    await fixture.whenStable();
    expect(router.url).toBe('/');
  });
});
