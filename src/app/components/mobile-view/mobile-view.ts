import { Component, computed, input } from '@angular/core';
import { MobileBar, MobileItem, mobileLabel } from '../../core/mobile';

interface ViewItem {
  kind: 'picture' | 'number' | 'unknown' | 'mobile';
  text: string;
  bar: MobileBar | null;
  label: string;
  asked: boolean;
}

/** One bar with its hangers; sub-mobiles render this component again (recursion). */
@Component({
  selector: 'app-mobile-view',
  templateUrl: './mobile-view.html',
  styleUrl: './mobile-view.scss',
})
export class MobileView {
  readonly bar = input.required<MobileBar>();
  readonly symbols = input.required<readonly string[]>();
  /** Numbers mode: letters on sub-mobiles so hints can name them. */
  readonly showLabels = input(false);
  /** Set by the parent for sub-mobiles. */
  readonly label = input('');
  readonly asked = input(false);

  protected readonly arms = computed(() => [
    this.bar().left.map((item) => this.toView(item)),
    this.bar().right.map((item) => this.toView(item)),
  ]);

  protected readonly badge = computed(() => {
    if (this.asked()) {
      return '?';
    }
    return this.showLabels() ? this.label() : '';
  });

  private toView(item: MobileItem): ViewItem {
    switch (item.kind) {
      case 'picture':
        return {
          kind: 'picture',
          text: this.symbols()[item.symbol],
          bar: null,
          label: '',
          asked: false,
        };
      case 'number':
        return { kind: 'number', text: String(item.weight), bar: null, label: '', asked: false };
      case 'unknown':
        return { kind: 'unknown', text: '?', bar: null, label: '', asked: false };
      case 'mobile':
        return {
          kind: 'mobile',
          text: '',
          bar: item.bar,
          label: mobileLabel(item.id),
          asked: item.asked,
        };
    }
  }
}
