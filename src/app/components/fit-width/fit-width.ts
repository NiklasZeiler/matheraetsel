import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';

/**
 * Shrinks its content to the available width (never enlarges). Wide mobiles stay readable
 * on phones without horizontal scrolling.
 */
@Component({
  selector: 'app-fit-width',
  template: '<div #outer class="outer"><div #inner class="inner"><ng-content /></div></div>',
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .outer {
      display: flex;
      justify-content: center;
      width: 100%;
      overflow: hidden;
    }
    .inner {
      display: inline-block;
    }
  `,
})
export class FitWidth {
  private readonly outer = viewChild.required<ElementRef<HTMLElement>>('outer');
  private readonly inner = viewChild.required<ElementRef<HTMLElement>>('inner');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.fit());
      observer.observe(this.outer().nativeElement);
      observer.observe(this.inner().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
      this.fit();
    });
  }

  private fit(): void {
    const inner = this.inner().nativeElement;
    const available = this.outer().nativeElement.clientWidth;
    inner.style.zoom = '1';
    const natural = inner.getBoundingClientRect().width;
    const zoom = natural > available && natural > 0 ? available / natural : 1;
    // Only touch the style when it changes, so the observer does not loop.
    if (inner.style.zoom !== String(zoom)) {
      inner.style.zoom = String(zoom);
    }
  }
}
