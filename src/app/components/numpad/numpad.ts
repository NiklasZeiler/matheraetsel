import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-numpad',
  templateUrl: './numpad.html',
  styleUrl: './numpad.scss',
})
export class Numpad {
  readonly confirmDisabled = input(false);
  readonly digit = output<number>();
  readonly erase = output<void>();
  readonly confirm = output<void>();

  protected readonly topDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
}
