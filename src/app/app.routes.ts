import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home-page';
import { PuzzlePage } from './pages/puzzle/puzzle-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'r/:level/:seed', component: PuzzlePage, data: { type: 'gleichung' } },
  { path: 'w/:level/:seed', component: PuzzlePage, data: { type: 'waage' } },
  { path: '**', redirectTo: '' },
];
