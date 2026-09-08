# 🏥 Krankenhaus1

Eine moderne 2D-Krankenhaus-Managementsimulation im Browser.

## Aktueller Stand

Krankenhaus1 enthält einen spielbaren Simulationskern mit:

- 2D-Krankenhaus-Grundriss auf Phaser-Basis
- Echtzeit-Simulation mit Pause und ×1/×2/×4/×8
- dynamischen Patienten, Diagnosen und Vitalwerten
- Patientenprioritäten von Grün bis Akut
- Personal mit Skill, Stress, Müdigkeit und Zufriedenheit
- autonome einfache Personal-/Patientenlogik
- Räume bauen und Krankenhaus erweitern
- Wirtschaft mit Einnahmen, Gehältern, Betriebskosten und Reputation
- Notfallereignis „Massenanfall von Verletzten“
- Rettungsfahrzeug-/Patientenquellen als Teil der Simulation
- Live-Dashboard und Ereignisprotokoll
- prozedurales Audio für UI, Erfolg, Warnung und Notfälle
- lokalen Spielstand mit Autosave-Grundlage
- TypeScript + Vite + Phaser
- Vitest-Tests und GitHub Actions für Test + Build

## Lokal mit einem Klick starten

Windows-Nutzer können **`start-local.bat`** doppelklicken. Das Script installiert fehlende Abhängigkeiten, startet den Vite-Server und öffnet anschließend automatisch das Spiel unter:

`http://localhost:5173/Krankenhaus1/`

Alternativ:

```bash
npm install
npm run dev
```

Danach im Browser öffnen:

`http://localhost:5173/Krankenhaus1/`

## Produktionsbuild

```bash
npm run build
```

## Tests

```bash
npm test
```

## Steuerung

- Mausrad: Kamera-Zoom
- Mittlere Maustaste: Kamera verschieben
- Pause: Simulation anhalten/fortsetzen
- ×1/×2/×4/×8: Simulationsgeschwindigkeit
- Klick auf Patienten, Personal oder Räume: Details als Hinweis

## Architektur

```text
src/
  audio.ts
  main.ts
  save.ts
  style.css
  game/
    types.ts
    simulation.ts

tests/
  simulation.test.ts
```

Der Simulationszustand ist von der Darstellung getrennt. Weitere Systeme wie komplexeres Pathfinding, zusätzliche Etagen, Forschungsbaum, Kampagnen und detailliertere medizinische Abläufe können darauf aufsetzen.

## Hinweis

Die medizinischen Werte und Abläufe sind spielerische Simulationswerte und keine medizinischen Handlungsanweisungen.
