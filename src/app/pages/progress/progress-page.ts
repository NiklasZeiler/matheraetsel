import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { dayKey } from '../../core/daily';
import { PUZZLE_TYPES } from '../../core/puzzle';
import {
  DEMOTION_DAYS,
  LEAGUES,
  LEAGUE_ICONS,
  PROMOTION_DAYS,
  activeDays,
  badges,
  weekDays,
  weekStart,
  weekXp,
} from '../../core/progress';
import { GameService } from '../../services/game.service';

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

@Component({
  selector: 'app-progress-page',
  imports: [RouterLink],
  templateUrl: './progress-page.html',
  styleUrl: './progress-page.scss',
})
export class ProgressPage {
  private readonly game = inject(GameService);

  protected readonly leagues = LEAGUES;
  protected readonly icons = LEAGUE_ICONS;
  protected readonly promotionDays = PROMOTION_DAYS;
  protected readonly demotionDays = DEMOTION_DAYS;

  protected readonly progress = this.game.progress;
  protected readonly league = computed(() => this.progress().league);
  private readonly week = computed(() => weekStart(dayKey()));
  protected readonly days = computed(() => {
    const progress = this.progress();
    const today = dayKey();
    return weekDays(this.week()).map((day, index) => ({
      label: WEEKDAY_LABELS[index],
      active: (progress.xpByDay[day] ?? 0) > 0,
      today: day === today,
      future: day > today,
    }));
  });
  protected readonly activeCount = computed(() => activeDays(this.progress(), this.week()));
  protected readonly thisWeekXp = computed(() => weekXp(this.progress(), this.week()));
  protected readonly badgeList = computed(() => {
    const stats = this.game.stats();
    const solvedByType = PUZZLE_TYPES.map((type) =>
      Object.values(stats[type]).reduce((sum, level) => sum + level.solved, 0),
    );
    return badges(this.progress(), {
      solvedTotal: solvedByType.reduce((sum, count) => sum + count, 0),
      typesSolved: solvedByType.filter((count) => count > 0).length,
      typesTotal: PUZZLE_TYPES.length,
    });
  });
  protected readonly earnedCount = computed(
    () => this.badgeList().filter((badge) => badge.earned).length,
  );

  protected weekOutlook(): string {
    const active = this.activeCount();
    if (active >= PROMOTION_DAYS) {
      return this.league() === LEAGUES.length - 1
        ? 'Du hältst die höchste Liga. Weiter so!'
        : 'Geschafft: Du steigst zum Wochenende auf.';
    }
    const missing = PROMOTION_DAYS - active;
    const text = `Noch ${missing} ${missing === 1 ? 'Tag' : 'Tage'} bis zum Aufstieg.`;
    return active <= DEMOTION_DAYS && this.league() > 0
      ? `${text} Mit höchstens ${DEMOTION_DAYS} aktiven ${DEMOTION_DAYS === 1 ? 'Tag' : 'Tagen'} steigst du ab.`
      : text;
  }
}
