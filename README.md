# Matherätsel

Mobile PWA mit drei Rätselarten, in je vier Stufen. Jedes Bild steht für eine versteckte Zahl.

- **Gleichungen** (`#/r/<stufe>/<seed>`): Gleichungssystem aus Bildern, gefragt ist ein Wert oder Ausdruck.
- **Waage** (`#/w/<stufe>/<seed>`): Waagen im Gleichgewicht. Leicht und Mittel vergleichen Bilder
  nur untereinander, Schwer und Knobler haben Gewichte mit Zahlen.

- **Mobile** (`#/m/<stufe>/<seed>`): verschachtelte Balken im Gleichgewicht, ein Untermobile zählt
  mit der Summe aller Gewichte darin. Leicht und Mittel: Zahlen mit einer Lücke, Schwer und
  Knobler: Bilder (gesucht ein Bild oder das Gewicht eines markierten Untermobiles).

Rätsel werden aus Seed und Stufe erzeugt und lassen sich per Link teilen.

## Befehle

```bash
npm start        # Dev-Server auf http://localhost:4200
npm test         # Unit-Tests (Generator, Solver, App)
npm run build    # Produktions-Build nach dist/matheraetsel
```

## Wichtig

- Der Generator ist deterministisch: gleicher Seed + Stufe = gleiches Rätsel. Änderungen an
  `generator.ts`, `waage-generator.ts`, `mobile-generator.ts`, die jeweiligen `*-levels.ts` oder `themes.ts` (alle in `src/app/core/`) machen bestehende Links ungültig,
  die Golden-Tests in den `*-generator.spec.ts` schlagen dann an.
- Routing nutzt Hash-URLs (`#/r/<stufe>/<seed>`), damit jeder statische Host ohne Rewrite-Regeln reicht.

## Deployment (Vercel)

Konfiguration liegt in `vercel.json`. Die App ist eine statische PWA ohne Backend.

1. Repo bei GitHub, GitLab oder Bitbucket anlegen und pushen.
2. Auf vercel.com „Add New → Project" und das Repo importieren.
3. Framework „Angular" wird erkannt. Build-Befehl und Ausgabeordner kommen aus `vercel.json`
   (`npm run build`, `dist/matheraetsel/browser`), nichts weiter einstellen.
4. Nach dem Deploy die URL auf dem Handy öffnen und „Zum Startbildschirm hinzufügen".

Geteilte Links nutzen immer die aktuelle Adresse (`#/r/<stufe>/<seed>`). Eine eigene Domain
kann später ohne Codeänderung hinzugefügt werden.
