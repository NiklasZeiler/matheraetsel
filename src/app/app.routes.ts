import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home-page';
import { CategoryPage } from './pages/category/category-page';
import { ProgressPage } from './pages/progress/progress-page';
import { PuzzlePage } from './pages/puzzle/puzzle-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'fortschritt', component: ProgressPage },
  { path: 'k/:type', component: CategoryPage },
  { path: 'r/:level/:seed', component: PuzzlePage, data: { type: 'gleichung' } },
  { path: 'w/:level/:seed', component: PuzzlePage, data: { type: 'waage' } },
  { path: 'm/:level/:seed', component: PuzzlePage, data: { type: 'mobile' } },
  { path: 'x/:level/:seed', component: PuzzlePage, data: { type: 'kreuzzahl' } },
  { path: 'p/:level/:seed', component: PuzzlePage, data: { type: 'pyramide' } },
  { path: 's/:level/:seed', component: PuzzlePage, data: { type: 'sudoku' } },
  { path: '**', redirectTo: '' },
];
