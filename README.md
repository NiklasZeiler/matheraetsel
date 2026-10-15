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

## Deployment (Vercel)

Konfiguration liegt in `vercel.json`. Die App ist eine statische PWA ohne Backend.

1. Repo bei GitHub, GitLab oder Bitbucket anlegen und pushen.
2. Auf vercel.com „Add New → Project" und das Repo importieren.
3. Framework „Angular" wird erkannt. Build-Befehl und Ausgabeordner kommen aus `vercel.json`
   (`npm run build`, `dist/matheraetsel/browser`), nichts weiter einstellen.
4. Nach dem Deploy die URL auf dem Handy öffnen und „Zum Startbildschirm hinzufügen".

Geteilte Links nutzen immer die aktuelle Adresse (`#/r/<stufe>/<seed>`). Eine eigene Domain
kann später ohne Codeänderung hinzugefügt werden.
