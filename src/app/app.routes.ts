import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home-page';
import { PuzzlePage } from './pages/puzzle/puzzle-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'r/:level/:seed', component: PuzzlePage },
  { path: '**', redirectTo: '' },
];
