# 🩺 Webentwicklung für Dr. Mahmoud — Der Gastroenterologen-Guide

> Jedes Konzept erklärt mit Eselbrücken aus der Gastroenterologie.
> Ziel: Du verstehst WIRKLICH wie das alles funktioniert — nicht nur copy/paste.

---

## 🔬 Das große Bild: Was ist eine Web-App?

> **Eselbrücke:** Eine Web-App ist wie der menschliche Verdauungstrakt.
>
> - **Frontend (React)** = Mund + Speiseröhre — Was der Patient sieht und eingibt
> - **Backend (API)** = Magen + Darm — Verarbeitung der Daten, Logik, Regeln
> - **Datenbank (Supabase)** = Leber — Speichert, filtert, gibt auf Anfrage raus
> - **DNS / Domain** = Die Adresse der Praxis — Patienten finden dich damit
> - **HTTPS / SSL** = Handschuhe + Maske im OP — Verschlüsselung, Schutz

---

## 📚 Phase 1: Grundlagen (Woche 1–2)

### 1.1 HTML — Das Skelett

> **Eselbrücke:** HTML ist wie ein Endoskopiebericht.
> Er hat eine feste Struktur: Kopf → Befund → Empfehlung.
> In HTML: `<head>` → `<body>` → `<footer>`

```html
<!-- Wie ein Befundbericht -->
<html>
  <head>
    <title>Befund: Magenspiegelung</title>
  </head>
  <body>
    <h1>Patient: Mahmoud</h1>
    <p>Befund: Keine Polypen sichtbar.</p>
  </body>
</html>
```

**Was du lernen musst:**
- [ ] Tags: `<h1>`, `<p>`, `<div>`, `<button>`, `<input>`
- [ ] Attribute: `id="..."`, `class="..."`, `href="..."`
- [ ] Formulare: `<form>`, `<input>`, `<label>`

**Ressource:** [MDN HTML Grundlagen](https://developer.mozilla.org/de/docs/Learn/HTML)

---

### 1.2 CSS — Das Aussehen (TailwindCSS)

> **Eselbrücke:** CSS ist wie die Einrichtung der Praxis.
> Das Skelett steht (HTML), jetzt bestimmst du: Welche Farbe hat die Wand? Wie groß ist der Schreibtisch?

In diesem Projekt nutzen wir **TailwindCSS** — das ist wie IKEA-Möbel:
Du nimmst fertige Klassen und kombinierst sie, statt alles selbst zu bauen.

```html
<!-- Normales CSS vs. Tailwind -->
<!-- Tailwind: direkt im HTML, schnell, kein extra File -->
<button class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Patient aufnehmen
</button>
```

**Was du lernen musst:**
- [ ] `flex`, `grid` — Anordnung von Elementen
- [ ] `text-`, `bg-`, `p-`, `m-` — Farben, Abstände
- [ ] `hover:`, `md:`, `lg:` — Interaktion & Responsive Design

**Ressource:** [Tailwind Playground](https://play.tailwindcss.com)

---

### 1.3 JavaScript — Die Logik

> **Eselbrücke:** JavaScript ist wie der Arzt selbst.
> HTML = Befundbogen (Struktur), CSS = saubere Schrift (Aussehen),
> JavaScript = Du als Arzt, der entscheidet was als nächstes passiert.

```javascript
// Wenn Patient auf Button klickt → Aktion
const button = document.querySelector('button');
button.addEventListener('click', function() {
  alert('Termin gebucht!');
});
```

**Was du lernen musst:**
- [ ] Variablen: `const`, `let`
- [ ] Funktionen: `function name() {}` oder `() => {}`
- [ ] Arrays & Objekte: `[1,2,3]`, `{ name: "Mahmoud" }`
- [ ] `if/else`, `for`-Schleifen

**Ressource:** [JavaScript30 (kostenlos)](https://javascript30.com)

---

## 📚 Phase 2: React (Woche 3–4)

> **Eselbrücke:** React ist wie modulare Endoskopie-Sets.
> Du baust einmal ein wiederverwendbares "Instrument" (Komponente)
> und benutzt es überall — egal ob für Patient A, B oder C.

### 2.1 Komponenten

```jsx
// Eine Komponente = Ein wiederverwendbares UI-Stück
// Wie ein Standard-Befundbogen — einmal erstellt, immer benutzt
function PatientCard({ name, diagnose }) {
  return (
    <div className="border rounded p-4">
      <h2>{name}</h2>
      <p>{diagnose}</p>f
    </div>
  );
}

// Nutzung:
<PatientCard name="Hans Müller" diagnose="Gastritis" />
<PatientCard name="Anna Schmidt" diagnose="H. pylori" />
```

### 2.2 State (Zustand)

> **Eselbrücke:** State ist wie der aktuelle Befundbogen auf deinem Schreibtisch.
> Er ändert sich während der Untersuchung — React aktualisiert die Anzeige automatisch.

```jsx
import { useState } from 'react';

function Aufnahme() {
  const [patient, setPatient] = useState(''); // aktueller Zustand

  return (
    <input
      value={patient}
      onChange={(e) => setPatient(e.target.value)} // Zustand ändern
      placeholder="Patientenname..."
    />
  );
}
```

**Was du lernen musst:**
- [ ] `useState` — lokaler Zustand
- [ ] `useEffect` — Aktionen beim Laden (wie Anamnese beim Erstkontakt)
- [ ] Props — Daten zwischen Komponenten weitergeben
- [ ] Listenrendering: `array.map()`

**Ressource:** [React Offizielle Docs](https://react.dev/learn)

---

## 📚 Phase 3: TypeScript (Woche 5)

> **Eselbrücke:** TypeScript ist wie ein strukturierter ICD-10-Code.
> Ohne TypeScript: "Diagnose: irgendwas". Mit TypeScript: "K29.0 — Akute hämorrhagische Gastritis".
> Du MUSST den Typ angeben → keine falschen Daten möglich.

```typescript
// Ohne TypeScript (gefährlich)
let befund = "Gastritis"; 
befund = 42; // Fehler! Aber kein Warnhinweis

// Mit TypeScript (sicher)
let befund: string = "Gastritis";
befund = 42; // ❌ TypeScript-Fehler → du wirst sofort gewarnt

// Objekt-Typen (wie ein Patientenstammdaten-Schema)
interface Patient {
  id: number;
  name: string;
  diagnose: string;
  geburtsdatum: Date;
}
```

---

## 📚 Phase 4: Backend & Datenbank (Woche 6–7)

### 4.1 Supabase (dein Backend in diesem Projekt)

> **Eselbrücke:** Supabase ist wie das KIS (Krankenhausinformationssystem).
> Du fragst: "Gib mir alle Patienten mit H. pylori" → Supabase gibt die Liste zurück.
> Du schreibst: "Neuer Patient aufgenommen" → Supabase speichert es.

```typescript
// Daten lesen (SELECT in SQL)
const { data: patienten } = await supabase
  .from('patients')
  .select('*')
  .eq('diagnose', 'H. pylori');

// Daten schreiben (INSERT)
await supabase.from('patients').insert({
  name: 'Hans Müller',
  diagnose: 'Gastritis',
});
```

### 4.2 SQL-Grundlagen

> **Eselbrücke:** SQL ist wie eine Datenbankabfrage im KIS.
> `SELECT` = Suchen | `INSERT` = Aufnehmen | `UPDATE` = Befund aktualisieren | `DELETE` = Entlassen

```sql
-- Alle Patienten mit Gastritis
SELECT name, geburtsdatum FROM patients WHERE diagnose = 'Gastritis';

-- Neuen Patienten aufnehmen
INSERT INTO patients (name, diagnose) VALUES ('Anna Schmidt', 'Colitis');
```

---

## 📚 Phase 5: KI-Integration (Woche 8)

> **Eselbrücke:** Die Gemini API ist wie ein KI-gestützter Radiologe.
> Du schickst ein Bild/Text → bekommst eine strukturierte Analyse zurück.

```typescript
// In diesem Projekt: apps/api/src mit @jobetes/ai-gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const result = await model.generateContent(
  'Patient hat Oberbauchschmerzen seit 3 Tagen. Mögliche Differentialdiagnosen?'
);
console.log(result.response.text());
```

---

## 📚 Phase 6: Deployment (Woche 9)

> **Eselbrücke:** Deployment ist wie die Eröffnung deiner Praxis.
> Code schreiben = Praxis einrichten. Deployment = Schild aufhängen, Türen öffnen.

### Dieses Projekt läuft auf:
| Dienst | Was | Eselbrücke |
|--------|-----|------------|
| **GitHub Pages** | Frontend (Web-App) | Praxis-Schaufenster |
| **Fly.io** | Backend (API) | Praxis-Backoffice |
| **Supabase** | Datenbank | Patientenakte |
| **jobetes.diggai.de** | Domain | Praxis-Adresse |

### Deployment-Ablauf:
```
Du schreibst Code
      ↓
git add . && git commit -m "Feature: ..." && git push
      ↓
GitHub Actions läuft automatisch (wie ein Reinigungsdienst)
      ↓
App ist 5 Minuten später live auf jobetes.diggai.de
```

---

## 🗺️ Lernpfad Überblick

```
Woche 1-2:  HTML + CSS (Tailwind) ────────── Struktur & Design
Woche 3-4:  JavaScript + React ───────────── Logik & Komponenten
Woche 5:    TypeScript ────────────────────── Typsicherheit
Woche 6-7:  Supabase + SQL ────────────────── Datenbank
Woche 8:    Gemini API (KI) ───────────────── KI-Integration
Woche 9:    Deployment + Git ──────────────── Live schalten
```

---

## 🔑 Die 10 wichtigsten Begriffe (Spickzettel)

| Begriff | Eselbrücke Gastro | Was es bedeutet |
|---------|-------------------|-----------------|
| `Component` | Endoskop-Set (wiederverwendbar) | Wiederverwendbares UI-Stück |
| `State` | Aktueller Befundbogen | Sich ändernde Daten in der App |
| `Props` | Patientenakte übergeben | Daten von Eltern- an Kind-Komponente |
| `API` | KIS-Schnittstelle | Kommunikation zwischen Frontend & Backend |
| `Git commit` | Befund unterschreiben & speichern | Code-Änderung sichern |
| `npm/pnpm` | Medikamentenlieferant | Pakete/Bibliotheken installieren |
| `TypeScript` | ICD-10 Kodierung | Typsichere Programmierung |
| `SQL` | KIS-Datenbankabfrage | Datenbank-Sprache |
| `HTTPS` | OP-Hygiene | Verschlüsselte Verbindung |
| `Deploy` | Praxiseröffnung | App live schalten |

---

## 📖 Empfohlene Lernressourcen (alle kostenlos)

1. **[The Odin Project](https://www.theodinproject.com)** — Kompletter Lernpfad HTML→React
2. **[JavaScript30](https://javascript30.com)** — 30 Projekte in 30 Tagen
3. **[React Docs](https://react.dev/learn)** — Offizielle React-Dokumentation
4. **[Supabase Docs](https://supabase.com/docs)** — Datenbank-Dokumentation
5. **[Tailwind Playground](https://play.tailwindcss.com)** — CSS live ausprobieren
6. **[GitHub Skills](https://skills.github.com)** — Git lernen interaktiv

---

*Zuletzt aktualisiert: Mai 2026 | Für: Dr. Mahmoud Alshdaifat*
