import { Component, input } from '@angular/core';
import { Scale } from '../../core/waage';
import { PanView } from '../pan-view/pan-view';

@Component({
  selector: 'app-scale-view',
  imports: [PanView],
  templateUrl: './scale-view.html',
  styleUrl: './scale-view.scss',
})
export class ScaleView {
  readonly scale = input.required<Scale>();
  readonly symbols = input.required<readonly string[]>();
}
