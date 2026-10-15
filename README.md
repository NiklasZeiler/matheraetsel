# Matherätsel

Mobile PWA mit Bild-Gleichungssystemen: Jedes Bild steht für eine versteckte Zahl,
gefragt ist ein einzelner Wert oder ein Ausdruck. Rätsel werden aus Seed und Stufe
erzeugt und lassen sich per Link teilen.

## Befehle

```bash
npm start        # Dev-Server auf http://localhost:4200
npm test         # Unit-Tests (Generator, Solver, App)
npm run build    # Produktions-Build nach dist/matheraetsel
```

## Wichtig

- Der Generator ist deterministisch: gleicher Seed + Stufe = gleiches Rätsel. Änderungen an
  `src/app/core/generator.ts`, `levels.ts` oder `themes.ts` machen bestehende Links ungültig,
  der Golden-Test in `generator.spec.ts` schlägt dann an.
- Routing nutzt Hash-URLs (`#/r/<stufe>/<seed>`), damit jeder statische Host ohne Rewrite-Regeln reicht.
