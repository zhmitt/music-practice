# ToneTrainer — Product Specification v0.1

> **"Practice Companion, not Teacher Replacement."**

---

## 1. Problem Statement

### Das Problem

Ein Kind (oder Erwachsener) kommt vom Musikunterricht nach Hause. Der Lehrer hat gesagt: "Üb die Tonleiter in F-Dur, achte auf die Intonation, und spiel das Stück auf Seite 12." Dann passiert:

- Das Kind spielt das Stück 2x durch, klingt schlecht, kein Feedback
- Tonleiter wird schnell runtergespielt, keine Kontrolle ob die Töne stimmen
- Nach 15 Minuten: "Ich hab geübt!" — aber nichts verbessert sich
- Nächste Woche beim Lehrer: gleiche Fehler

**Der Kern**: Zwischen zwei Unterrichtsstunden gibt es kein Feedback. Niemand hört zu. Niemand sagt "dein F5 ist zu hoch" oder "dein Rhythmus eilt." Der Schüler übt blind.

### Warum bestehende Apps nicht reichen

| App | Was sie ist | Was fehlt |
|-----|-------------|-----------|
| Stimmgerät (z.B. Tonal Energy) | Zeigt Tonhöhe | Keine Session-Struktur, kein Tracking, kein Kontext |
| Metronom-Apps | Tick-tick-tick | Kein Feedback ob der Schüler im Takt ist |
| Yousician / Simply Piano | Gamifiziertes Lernen | Nur Gitarre/Klavier, spielerisch, kein ernstes Üben |
| SmartMusic | Sheet Music + Feedback | Teuer, komplex, US-fokussiert, nicht für Anfänger |

**Lücke**: Es gibt keine App, die als intelligenter Übungsbegleiter für Bläser (und später Streicher) fungiert — mit Echtzeit-Feedback, strukturierten Sessions und langfristigem Tracking.

---

## 2. Personas

### Persona 1: Leo (10 Jahre) — "Der Schüler"

- Spielt seit 1,5 Jahren Waldhorn (Bb-Horn)
- Übt 3-5x pro Woche, 15-25 Minuten
- Motivation schwankt — braucht sichtbaren Fortschritt
- Weiß nicht genau WIE man effektiv übt
- Mag Technologie, will keine "Baby-App"
- Sein Lehrer gibt Hausaufgaben, aber zu Hause ist er allein

**Kernbedürfnis**: "Sag mir, ob ich das richtig mache."
**Frustration**: "Ich übe, aber es wird nicht besser."

### Persona 2: Thomas (42 Jahre) — "Der Wiedereinsteiger"

- Hat als Jugendlicher Horn gespielt, fängt nach 20 Jahren wieder an
- Übt abends 20-30 Minuten
- Analytisch, will Daten sehen (Cent-Abweichung, Trends)
- Kein Lehrer, lernt selbstständig
- Will wissen, wo er steht und was er verbessern muss

**Kernbedürfnis**: "Zeig mir meine Schwächen systematisch."
**Frustration**: "Ich höre, dass es nicht stimmt, aber ich weiß nicht was genau."

### Persona 3: Frau Meier (55 Jahre) — "Die Lehrerin" (Phase 2+)

- Unterrichtet 15 Schüler, Horn und Trompete
- Will wissen, ob und wie ihre Schüler üben
- Möchte gezielte Übungen aufgeben können
- Braucht keine weitere komplizierte Software

**Kernbedürfnis**: "Was hat Leo diese Woche geübt, und wo steht er?"
**Frustration**: "Ich sehe meine Schüler 1x pro Woche und habe keinen Einblick in den Rest."

---

## 3. Core Concept

### Was ToneTrainer IST

Ein **Übungsbegleiter**, der:
1. **Zuhört** — Echtzeit-Analyse von Tonhöhe, Stabilität, Rhythmus
2. **Führt** — Strukturierte Übungssessions mit klarem Ablauf
3. **Spiegelt** — Zeigt objektiv, was passiert (kein "richtig/falsch")
4. **Erinnert** — Langfristige Trends und Schwachstellen aufdecken

### Was ToneTrainer NICHT ist

- Kein Spiel / kein Gamification mit Highscores
- Kein Ersatz für den Lehrer
- Kein YouTube / kein Video-Tutorial
- Kein Noteneditor
- Kein Social Network

### Design-Philosophie

**"Strava for Music Practice"**

So wie Strava Läufern zeigt, wie schnell sie gelaufen sind, ohne zu werten — zeigt ToneTrainer Musikern, wie genau sie gespielt haben. Die Daten motivieren, nicht Gamification.

- Jede Session wird getrackt, aber nicht bewertet
- Fortschritt ist sichtbar über Wochen/Monate
- Die App ist das Werkzeug, der Schüler trifft die Entscheidungen
- Clean, ruhig, fokussiert — wie ein guter Übungsraum

---

## 4. Informationsarchitektur

### Primäre Navigation

```
┌──────────────────────────────────────────────────────┐
│                    ToneTrainer                        │
├──────────┬──────────┬──────────┬─────────────────────┤
│  Üben    │ Tone Lab │ Rhythmus │     Fortschritt     │
│  (Home)  │          │          │                     │
└──────────┴──────────┴──────────┴─────────────────────┘
```

### Screen Inventory

#### A. Üben (Home) — "Was mache ich heute?"

Der Einstiegspunkt. Nicht eine Toolbox, sondern ein Coach.

```
┌────────────────────────────────────────────────┐
│  Hallo Leo                          Do, 28.03  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  HEUTIGE SESSION              15 min     │  │
│  │                                          │  │
│  │  1. Einblasen      Long Tones    3 min   │  │
│  │  2. Tonleiter      F-Dur         4 min   │  │
│  │  3. Intonation     Drone-Übung   4 min   │  │
│  │  4. Rhythmus       Pattern #3    4 min   │  │
│  │                                          │  │
│  │  [ ▶  Session starten ]                  │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────┐  ┌───────────────────────┐  │
│  │  🔥 5 Tage   │  │  Diese Woche          │  │
│  │  in Folge    │  │  ████████░░  68%      │  │
│  │  Mo Di Mi Do │  │  1h 42m / 2h 30m     │  │
│  └──────────────┘  └───────────────────────┘  │
│                                                │
│  Letzte Session                                │
│  ┌──────────────────────────────────────────┐  │
│  │  Gestern, 18:30    22 min    87% Pitch   │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Schwachstellen                                │
│  ┌──────────────────────────────────────────┐  │
│  │  F5  +15ct (seit 2 Wochen)              │  │
│  │  Eb4 -12ct (besser als letzte Woche)    │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

**Zentrale Idee**: Die App schlägt eine Session vor — basierend auf:
- Was der Schüler kürzlich geübt hat
- Wo Schwachstellen liegen
- Wie viel Zeit verfügbar ist (einstellbar)
- (Später: Was der Lehrer aufgegeben hat)

#### B. Practice Session (Fullscreen) — "Geführtes Üben"

Die Kern-Erfahrung. Der User ist IN einer Übung.

```
┌────────────────────────────────────────────────────────────┐
│  Einblasen: Long Tones                    Schritt 1 / 4   │
│  ─────────────────────────────────────── ●─────────────    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │                      Bb                              │  │
│  │                   466.16 Hz                          │  │
│  │                                                      │  │
│  │    ◄━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━►            │  │
│  │    -50            +8ct              +50              │  │
│  │                                                      │  │
│  │    ┌────────────────────────────────────────┐        │  │
│  │    │  Stabilität über Zeit (Live-Graph)     │        │  │
│  │    │  ~~~─────────~~───────────────         │        │  │
│  │    └────────────────────────────────────────┘        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Aufgabe: Halte Bb4 so stabil wie möglich, 8 Sekunden.    │
│  Atme, dann nächster Ton.                                  │
│                                                            │
│  Töne in dieser Übung:  Bb4 ✓  F4 ✓  C4 ●  G3  Eb3      │
│                                                            │
│  [ Pause ]                               [ Überspringen ] │
└────────────────────────────────────────────────────────────┘
```

*Hinweis: ASCII-Art zeigt horizontales Layout. Implementierung nutzt vertikalen Pitch-Meter (s. Abschnitt 4b).*

**Schlüssel-Elemente**:
- Klare Aufgabe (was soll der Schüler tun?)
- Echtzeit-Feedback (Pitch, Stabilität)
- Fortschritt innerhalb der Übung (Töne-Reihe)
- Fortschritt innerhalb der Session (Schritt 1/4)
- Minimale UI — Fokus auf die Aufgabe

#### C. Tone Lab — "Freies Pitch-Training"

Für freies Üben ohne Session-Struktur. Der "Tuner+" Modus.

```
┌─────────────────────────────────────────────────────────────┐
│  Tone Lab                                                    │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │                     │  │  MODUS                       │  │
│  │        Bb           │  │                              │  │
│  │     466.16 Hz       │  │  ● Freies Spielen           │  │
│  │                     │  │  ○ Drone-Übung              │  │
│  │   ◄━━━━━●━━━━━━━►  │  │  ○ Zielton-Training         │  │
│  │       +8ct          │  │  ○ Intervall-Check          │  │
│  │                     │  │                              │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Verlauf (letzte 60 Sekunden)                         │  │
│  │                                                       │  │
│  │  +50 ┤                                                │  │
│  │      │     ╭─╮                                        │  │
│  │    0 ┤─────╯ ╰──────────────────────────              │  │
│  │      │                                                │  │
│  │  -50 ┤                                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │ Session      │ │ Genauigkeit  │ │ Stabilität       │    │
│  │ 47 Töne      │ │ 92%          │ │ ±4ct Avg         │    │
│  │ 12:30 min    │ │ (38 Treffer) │ │ (gut)            │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                              │
│  Tendenz (diese Session)                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  F5   ●━━━━━━━━━━━━|━━━●  +15ct  ⚠ konsistent hoch  │  │
│  │  Bb4  ●━━━━━━━━━━━━|●     +2ct   ✓                   │  │
│  │  Eb4  ●━━━━━━━●━━━━|      -12ct  ⚠ besser als Mo     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

*Hinweis: ASCII-Art zeigt horizontales Layout. Implementierung nutzt vertikalen Pitch-Meter (s. Abschnitt 4b).*

**Unterschied zu einem Stimmgerät**:
- Zeigt Tendenz über Zeit, nicht nur den aktuellen Moment
- Zeigt Stabilität (wie ruhig hält man den Ton), nicht nur Tonhöhe
- Modi für verschiedene Übungsformen (Drone, Zielton, frei)
- Session-Kontext (wie war diese Session insgesamt?)

#### D. Rhythmus-Studio — "Rhythmus üben"

```
┌─────────────────────────────────────────────────────────────┐
│  Rhythmus                                                    │
│                                                              │
│  ┌────────────────────────────┐  ┌────────────────────────┐ │
│  │        92 BPM              │  │  MODUS                 │ │
│  │    [ - ]  ━━●━━━━  [ + ]  │  │                         │ │
│  │                            │  │  ● Metronom             │ │
│  │    2/4  3/4  ●4/4  6/8    │  │  ○ Pattern nachspielen  │ │
│  │                            │  │  ○ Rhythmus-Diktat     │ │
│  │     ① ② ③ ④              │  │  ○ Subdivision         │ │
│  │                            │  │                         │ │
│  └────────────────────────────┘  └────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Pattern                                              │  │
│  │  ┌──┐┌──┐┌ ┐┌──┐┌─────┐                             │  │
│  │  │♩ ││♩ ││ ││♩ ││ ♩.  │   4/4                       │  │
│  │  └──┘└──┘└ ┘└──┘└─────┘                             │  │
│  │                                                       │  │
│  │  Dein Timing:                                         │  │
│  │  ┌──┐┌──┐   ┌──┐ ┌─────┐                            │  │
│  │  │✓ ││✓ │   │⚡││ │ ●   │  ← zu früh auf Schlag 4   │  │
│  │  └──┘└──┘   └──┘ └─────┘                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │ Timing       │ │ Letzte Runde │ │ Pattern          │    │
│  │ ±12ms Avg    │ │ 87%          │ │ #3 von 12        │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Nicht nur Metronom**:
- Pattern werden angezeigt UND der Schüler spielt sie nach
- App erkennt Toneinsätze und vergleicht mit dem Pattern
- Visuelles Feedback: "zu früh", "zu spät", "genau"
- Progressive Schwierigkeit

#### E. Fortschritt — "Wie entwickle ich mich?"

```
┌─────────────────────────────────────────────────────────────┐
│  Fortschritt                                                 │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ÜBERSICHT                     Zeitraum: 30 Tage ▾   │  │
│  │                                                       │  │
│  │  Übungszeit    Sessions    Avg Pitch    Streak        │  │
│  │  12h 30m       34          ±8ct         5 Tage        │  │
│  │  (+2h vs VM)   (+6 vs VM)  (-3ct ✓)    (Rekord: 12)  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PITCH-GENAUIGKEIT ÜBER ZEIT                          │  │
│  │  100%┤                                                │  │
│  │      │            ╭──╮    ╭───────                    │  │
│  │   80%│───╮  ╭────╯  ╰──╮╯                            │  │
│  │      │   ╰──╯           ╰                             │  │
│  │   60%┤                                                │  │
│  │      ├────┬────┬────┬────┬────┬────┬────              │  │
│  │      W1   W2   W3   W4   W5   W6   W7                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PROBLEM-TÖNE (konsistente Abweichungen)              │  │
│  │                                                       │  │
│  │  F5      ████████████████░░  +15ct  seit 3 Wochen    │  │
│  │  C5      ████████░░░░░░░░░  +8ct   besser werdend   │  │
│  │  Eb4     ██████░░░░░░░░░░░  -12ct  besser als W3    │  │
│  │  G4      ██░░░░░░░░░░░░░░░  -3ct   fast perfekt     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ÜBUNGSTAGEBUCH                                       │  │
│  │                                                       │  │
│  │  Do 28.03   22 min   Long Tones, F-Dur, Pattern #3  │  │
│  │  Mi 27.03   18 min   Drone-Übung, Rhythmus           │  │
│  │  Di 26.03   25 min   Long Tones, Bb-Dur, Intervalle │  │
│  │  Mo 25.03   15 min   Quick Session                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4b. UI-Entscheidungen

### Pitch-Anzeige: Vertikal (nicht horizontal)
- Tonhöhe = vertikal intuitiv (hoch oben, tief unten)
- Punkt wandert hoch/runter wie eine Wasserwaage
- Bei Tonleitern: vertikaler Indikator neben der aktiven Note auf Notenlinien

### Notenlinien: Ja, immer bei Tonleitern
- Tonleitern werden auf echten Notenlinien dargestellt
- Pitch-Indikator schwebt neben der aktiven Note
- Verbindet Notenlesen mit Intonation in einem Bild

### Rhythmus-Notation: Noten + Block-Toggle
- Default: Echte Notation (Noten auf Linien)
- Umschaltbar auf Blockdarstellung (besonders für Anfänger)
- Blöcke visualisieren Rhythmus intuitiver, Notation trainiert Noten-Lesen
- Einstellbar in Settings

### Audio-Vorgabe: Button ("Anhören")
- User drückt Button um Zielton zu hören
- Beim allerersten Mal automatisch vorspielen, danach optional
- Gibt dem Schüler Kontrolle

### Automatisch weiter
- Innerhalb Übung (nächster Ton): automatisch wenn gut erkannt + stabil
- Zwischen Übungen: User entscheidet ("Nochmal" oder "Weiter")
- Wiederholung explizit ermöglichen

### Drone Sound
- Phase 1: Synthetischer Bläserklang (Grundton + 2-3 Obertöne, warm)
  - Kein Sinuston (zu steril), keine Orgel (zu kirchlich)
  - In Rust generierbar, kein Sample nötig
- Phase 2: Echte Samples prüfen (Philharmonia Orchestra, Iowa EMS, oder selbst aufnehmen)

### Metronom-Sound: Einstellbar
- Optionen: Klick / Holzblock / Rimshot / Leise
- Verschiedene Lautsprecher klingen verschieden — User muss wählen können
- Lautstärke getrennt von Drone-Lautstärke einstellbar

### Rhythmus-Input: Horn + Klatschen
- Onset Detection funktioniert mit beidem
- User muss nicht immer Horn auspacken für Rhythmus-Übungen
- App erkennt Toneinsätze unabhängig von der Tonhöhe

### Session-Regelwerk
- Regel 1: Immer Einblasen zuerst (Long Tones, 3-5 min)
- Regel 2: Schwächen priorisieren (konsistente Problem-Töne → häufiger üben)
- Regel 3: Abwechslung/Rotation (nicht jeden Tag dasselbe, Freitag = Review)
- Regel 4: Zeitbudget einhalten (Übungen portionieren, nicht abschneiden)
- Regel 5: Progressive Schwierigkeit (Tonarten, Patterns, Tempo steigern über Wochen)
- Regel 6: Neue Elemente einstreuen (alle 1-2 Wochen neues Material)

### Tone Lab Modi
- **Freies Spielen**: Offenes Pitch-Feedback, 60s rollierender Verlauf
- **Drone-Übung**: Referenzton + Intervall spielen, Schwebungsvisualisierung
  - Drone-Grundton: vorgeschlagen basierend auf Instrument/Level, aber frei wählbar
- **Zielton-Training**: Vorgegebener Ton auf Notenlinien, Pitch-Indikator daneben
- **Intervall-Check** (Phase 2): Zwei Töne spielen, App erkennt Intervall
- Tendenz-Anzeige: Session-Tendenz UND historisch ("seit 2 Wochen F5 hoch")

### Fortschritt-View
- **Zeiträume**: 7 Tage / 4 Wochen / 6 Monate / Gesamt (gestaffelt)
- **Kalender-Heatmap**: GitHub-Style, dunkel = geübt
- **Pitch-Entwicklung**: Avg Cent-Abweichung über Wochen
- **Rhythmus-Entwicklung**: Timing-Genauigkeit über Wochen
- **Problem-Töne**: Top 3-5 mit Trend + Empfehlung
- **Übungstagebuch**: Chronologisch, klickbar für Session-Detail
- **Meilensteine**: Dezente Timeline, kein Gamification (s. Abschnitt 4c)

### Navigation
- **Desktop (> 1024px)**: Schmale Icon-Sidebar links (56px), Labels on hover
  - 4 Nav-Icons: Dashboard, Tone Lab, Rhythmus, Fortschritt
  - Mini-Stats: Streak + Avg Pitch (immer sichtbar)
  - Settings-Zahnrad unten
- **Tablet (768-1024px)**: Bottom Bar
- **Mobil (< 768px)**: Bottom Bar (Fallback)
- **Practice Session**: Fullscreen, Sidebar/Bottom Bar ausgeblendet

### Keyboard Shortcuts (Desktop)
- Space = Pause/Resume
- Pfeil rechts = Nächster Ton / Weiter
- Pfeil links = Vorheriger Ton (wenn möglich)
- Escape = Zurück zum Dashboard
- R = Übung wiederholen

### i18n
- Von Anfang an i18n-ready
- Sprachen Phase 1: Deutsch + Englisch
- Alle UI-Strings externalisiert

## 4c. Meilensteine (dezent, kein Gamification)

Meilensteine markieren echten Fortschritt — keine Sterne, keine Punkte, keine Levels.

**Pitch:**
- Erster Ton erkannt
- 10 Töne in Folge unter ±10ct
- Ein Problem-Ton erstmals unter ±5ct
- Session-Durchschnitt unter ±5ct
- Alle Töne einer Tonleiter unter ±5ct

**Stabilität:**
- Ersten Ton 8 Sekunden stabil gehalten
- Long Tone Session komplett ohne Ausreißer

**Rhythmus:**
- Erstes Pattern mit >90% Timing
- Alle 4 Runden eines Patterns über 85%
- Erstes Pattern mit Achteln gemeistert
- Erste Triolen-Übung geschafft

**Konsistenz:**
- 3 / 7 / 14 / 30 Tage in Folge geübt
- 10 / 25 / 50 Sessions

**Darstellung:**
- Erscheinen im Session Summary als eine Zeile (kein Popup)
- Im Fortschritt-View als chronologische Timeline
- Kein Trophy-Wall, keine Badge-Sammlung

## 4d. Settings

Kein eigener Nav-Punkt, erreichbar über Zahnrad im Header.

**Instrument:** Instrument (Bb-Horn, F-Horn, Doppelhorn...), Stimmung (Default 442 Hz, 430-450), Anzeige (notiert/klingend)
**Übungsziele:** Tage pro Woche, Session-Dauer (jederzeit änderbar)
**Audio:** Mikrofon-Auswahl + Test, Metronom-Sound, Drone-Sound, getrennte Lautstärkeregler
**Anzeige:** Rhythmus-Notation (Noten/Blöcke), Pitch-Toleranz (±3/±5/±10ct)
**App:** Sprache (DE/EN), Daten exportieren, Daten zurücksetzen

**Theme:** Auto (System) / Dark / Light — Toggle in Settings
- Auto = folgt OS prefers-color-scheme
- Beide Themes sind gleichwertig designt, gleiche Struktur
- Dark: tiefes Schwarz, frosted glass, ambient glow — fokussiert, abends
- Light: helles Grau/Weiß, weiche Schatten — ruhiger, kinderfreundlicher, tagsüber

**Was NICHT in Settings:** Account/Login, Push-Notifications, In-App-Purchases

## 4e. Onboarding Flow

5 Screens, beim ersten App-Start:

1. **Willkommen** — Logo + "Dein Übungsbegleiter für Blasinstrumente" + Los geht's
2. **Instrument** — Auswahl (Waldhorn Bb, Waldhorn F, Doppelhorn, Trompete, Klarinette, Flöte, Posaune, Oboe)
3. **Erfahrung** — Gerade angefangen / Anfänger / Fortgeschritten / Erfahren
4. **Übungsziel** — Tage pro Woche + Minuten pro Session
5. **Mikrofon + Erster Ton** — Berechtigung, dann "Spiel einen beliebigen Ton" → sofort Feedback → "Perfekt, alles funktioniert!" → Erste Session starten

Screen 5 ist das Schlüsselmoment: sofortiges "Aha, das funktioniert!"-Erlebnis.

## 4f. Vision: Lehrer-Plattform (kein MVP, Zukunft)

**Notiz für die Architektur, nicht für Phase 1:**
- Backend/Cloud wo die Apps der Schüler Fortschrittsdaten hinreporten
- Lehrer-Dashboard im Browser: Schülerfortschritt einsehen, Übungen zuweisen
- Aufgaben-System: Lehrer weist spezifische Übungen/Tonarten/Patterns zu
- Optional: Export als PDF-Fortschrittsbericht

**Architektonische Implikation**: Datenmodell so designen, dass es sync-fähig ist (lokale DB + optional Cloud). Aber Phase 1 ist 100% offline.

## 5. User Flows

### Flow 1: Tägliche Übung (Hauptflow, 80% der Nutzung)

```
App öffnen
    │
    ▼
Dashboard: "Heutige Session: 15 min"
    │
    ├── Session anpassen (Zeit, Übungen) ──┐
    │                                       │
    ▼                                       ▼
"Session starten"                    Angepasste Session
    │
    ▼
Übung 1: Einblasen (Long Tones)
    │   - App zeigt Zielton
    │   - User spielt, sieht Echtzeit-Feedback
    │   - Ton gehalten → nächster Ton
    │   - Übung fertig → Zusammenfassung
    ▼
Übung 2: Tonleiter
    │   - App zeigt Noten der Tonleiter
    │   - User spielt, Pitch wird getrackt
    │   - Problematische Töne markiert
    ▼
Übung 3: Drone / Intonation
    │   - App spielt Referenzton
    │   - User spielt Intervall dazu
    │   - Feedback: Cent-Abweichung, Schwebung
    ▼
Übung 4: Rhythmus
    │   - Pattern wird angezeigt
    │   - Metronom läuft
    │   - User spielt, Timing-Analyse
    ▼
Session Summary
    │   - Gesamtzeit, Genauigkeit
    │   - "Dein F5 war heute besser als gestern"
    │   - Nächste Session-Empfehlung
    ▼
Dashboard (aktualisiert)
```

### Flow 2: Freies Üben

```
App öffnen
    │
    ▼
Dashboard
    │
    ├──► Tone Lab ──► Modus wählen ──► Üben (open-ended) ──► Stop
    │
    ├──► Rhythmus ──► Modus wählen ──► Üben (open-ended) ──► Stop
    │
    └──► (Später: Noten / Sight Reading)
```

### Flow 3: Erste Nutzung (Onboarding)

```
App zum ersten Mal öffnen
    │
    ▼
"Welches Instrument spielst du?"
    │   [ Waldhorn ]  [ Trompete ]  [ Klarinette ]  ...
    ▼
"Wie lange spielst du schon?"
    │   [ Gerade angefangen (< 6 Monate) ]
    │   [ Anfänger (6 Monate – 2 Jahre) ]
    │   [ Fortgeschritten (2 – 5 Jahre) ]
    │   [ Erfahren (5+ Jahre) ]
    ▼
"Wie oft möchtest du üben?"
    │   [ 3x / Woche ]  [ 5x ]  [ Täglich ]
    ▼
"Wie lang soll eine Session sein?"
    │   [ 10 min ]  [ 15 min ]  [ 20 min ]  [ 30 min ]
    ▼
Mikrofon-Berechtigung
    │
    ▼
Erster Ton: "Spiel einen beliebigen Ton"
    │   → Kalibrierung / zeigt sofort Feedback
    │   → "Wow, das funktioniert!"
    ▼
Dashboard mit erster empfohlener Session
```

### Flow 4: Fortschritt ansehen

```
Dashboard
    │
    ▼
"Fortschritt" Tab
    │
    ├── Zeitraum wählen (Woche / Monat / Gesamt)
    ├── Pitch-Trends ansehen
    ├── Problem-Töne analysieren
    ├── Übungstagebuch durchsehen
    └── (Später: mit Lehrer teilen)
```

---

## 6. Feature Matrix

### Phase 1 — MVP ("Foundation")

| Feature | Prio | Beschreibung |
|---------|------|-------------|
| **Pitch Detection Engine** | P0 | Echtzeit, < 50ms Latenz, ±1 Cent Genauigkeit |
| **Dashboard mit Session-Vorschlag** | P0 | Tägliche Session basierend auf Profil |
| **Geführte Session** | P0 | Schritt-für-Schritt Übungsablauf |
| **Long Tone Übung** | P0 | Ton halten, Stabilität visualisieren |
| **Tone Lab (freies Pitch)** | P0 | Wie Tuner, aber mit Verlauf + Tendenz |
| **Basis-Metronom** | P1 | BPM, Taktart, visueller Beat |
| **Session-History** | P1 | Was wurde wann geübt? |
| **Streak-Tracking** | P1 | Tage in Folge |
| **Onboarding** | P1 | Instrument, Level, Ziele |
| **Instrument-Profil: Horn in Bb** | P0 | Frequenzbereich, Transposition, Partiale (Hauptuser!) |
| **Instrument-Profil: Horn in F** | P0 | Frequenzbereich, Transposition, Partiale |
| **Onset Detection (Basis)** | P1 | Toneinsatz erkennen für Note-Segmentierung (vorgezogen aus Phase 2) |
| **Drone-Übung (in Session)** | P1 | Referenzton + Intervall spielen, eingebettet in Practice Session |

### Phase 2 — Rhythm & Ear

| Feature | Prio | Beschreibung |
|---------|------|-------------|
| **Drone-Übungen** | P0 | Referenzton + Intervall spielen |
| **Rhythm Pattern Training** | P0 | Patterns anzeigen, nachspielen, bewerten |
| **Onset Detection (erweitert)** | P0 | Rhythmus-Bewertung mit Timing-Analyse (Basis in Phase 1) |
| **Subdivision Trainer** | P1 | Achtel, Triolen, Sechzehntel |
| **Tonleiter-Übungen** | P1 | Geführte Tonleitern mit Pitch-Tracking |
| **Fortschritt-Dashboard** | P0 | Langzeit-Trends, Problem-Töne, Graphen |
| **Weitere Instrument-Profile** | P1 | Trompete, Klarinette, Flöte, Posaune |

### Phase 3 — Sheet Music & Smart

| Feature | Prio | Beschreibung |
|---------|------|-------------|
| **MusicXML Import** | P0 | Noten laden und anzeigen |
| **Notenrendering** | P0 | Notendarstellung im Browser |
| **Play-Along mit Bewertung** | P0 | Mitspielen, Echtzeit-Vergleich |
| **Smart Session-Vorschläge** | P1 | KI-basiert: Schwächen gezielt üben |
| **Interval Training** | P1 | Intervalle hören und erkennen |
| **Streicher-Profile** | P2 | Geige, Cello (+ Vibrato-Analyse) |

### Phase 4 — Community & Teaching

| Feature | Prio | Beschreibung |
|---------|------|-------------|
| **Lehrer-Dashboard** | P1 | Schülerfortschritt einsehen |
| **Aufgaben-System** | P1 | Lehrer weist Übungen zu |
| **Export / Sharing** | P2 | Fortschrittsbericht als PDF |
| **Übungs-Bibliothek** | P2 | Community-erstellte Übungen |

---

## 7. Desktop/Tablet Layout Konzept

### Warum Desktop-First?

- Horn-Spieler stehen/sitzen beim Üben, Laptop/iPad auf dem Notenständer oder Tisch
- Großer Screen = mehr Daten gleichzeitig sichtbar
- Echtzeit-Graphen brauchen Platz
- Kein Handy in der Hand beim Spielen!

### Layout-Prinzip: Zwei-Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  ToneTrainer          Horn in F           ⚙                     │
├──────────────────┬───────────────────────────────────────────────┤
│                  │                                               │
│   NAVIGATION     │              HAUPTBEREICH                    │
│                  │                                               │
│   ┌──────────┐   │   Hier passiert die Übung.                  │
│   │ ▶ Üben   │   │   Großer, fokussierter Bereich.             │
│   │   Tone   │   │                                               │
│   │   Lab    │   │   In Session: Echtzeit-Feedback              │
│   │  Rhythm  │   │   Im Dashboard: Session-Karten               │
│   │  Fortschr│   │   Im Tone Lab: Pitch-Display + Graph         │
│   └──────────┘   │                                               │
│                  │                                               │
│   Quick Stats    │                                               │
│   ┌──────────┐   │                                               │
│   │ 5-Tage   │   │                                               │
│   │ Streak   │   │                                               │
│   │ 92% Avg  │   │                                               │
│   └──────────┘   │                                               │
│                  │                                               │
├──────────────────┴───────────────────────────────────────────────┤
│                        (kein Bottom-Nav)                         │
└──────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Layout | Nutzung |
|-----------|--------|---------|
| **> 1024px** | Sidebar + Hauptbereich | Desktop, großes Tablet landscape |
| **768-1024px** | Sidebar collapsed + Hauptbereich | Tablet portrait |
| **< 768px** | Bottom-Nav + Single Column | Handy (Fallback) |

### Session-View (Desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│  Long Tones — Einblasen                   Schritt 1/4    15:00  │
│  ━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
├──────────────────────────────────────────┬───────────────────────┤
│                                          │                       │
│              Bb                          │  AUFGABE              │
│           466.16 Hz                      │  Halte Bb4 stabil,   │
│                                          │  8 Sekunden.          │
│     ◄━━━━━━━━━●━━━━━━━━━━━━━►           │                       │
│             +8ct                         │  Töne:                │
│                                          │  Bb4 ✓                │
│  ┌──────────────────────────────────┐    │  F4  ✓                │
│  │ Stabilität (Live)               │    │  C4  ●  ← aktuell    │
│  │ ~~─────────────~~────────       │    │  G3                   │
│  │                                  │    │  Eb3                  │
│  └──────────────────────────────────┘    │                       │
│                                          │  ┌─────────────────┐ │
│  ┌────────┐ ┌────────┐ ┌────────┐       │  │  92%            │ │
│  │ 47     │ │ 92%    │ │ ±4ct   │       │  │  Genauigkeit    │ │
│  │ Töne   │ │ Treffer│ │ Avg    │       │  │  diese Übung    │ │
│  └────────┘ └────────┘ └────────┘       │  └─────────────────┘ │
│                                          │                       │
│  [ Pause ]              [ Weiter ▶ ]    │                       │
├──────────────────────────────────────────┴───────────────────────┤
```

*Hinweis: ASCII-Art zeigt horizontales Layout. Implementierung nutzt vertikalen Pitch-Meter (s. Abschnitt 4b).*

---

## 8. Datenmodell (High-Level)

### Was die App speichert

```
User
  ├── instrument: "horn_f"
  ├── level: "beginner"
  ├── practice_goal: { days_per_week: 5, minutes_per_session: 15 }
  ├── tuning_reference: 442  (Hz, einstellbar)
  │
  ├── Sessions[]
  │     ├── date, duration
  │     ├── exercises[]
  │     │     ├── type: "long_tone" | "scale" | "drone" | "rhythm"
  │     │     ├── notes_played[]
  │     │     │     ├── pitch (Hz)
  │     │     │     ├── target_note
  │     │     │     ├── cent_deviation
  │     │     │     ├── duration
  │     │     │     └── stability (std deviation über Dauer)
  │     │     └── rhythm_events[]  (für Rhythmus-Übungen)
  │     │           ├── expected_time
  │     │           ├── actual_time
  │     │           └── deviation_ms
  │     └── summary: { accuracy, avg_deviation, problem_notes }
  │
  ├── Tendencies (aggregiert)
  │     └── note → { avg_deviation, trend, sample_count }
  │
  └── Streak
        ├── current: 5
        ├── best: 12
        └── history[]
```

### Wo gespeichert?

- **Phase 1**: Lokal (SQLite via Tauri)
- **Phase 2+**: Optional Cloud-Sync für Lehrer-Features
- **Privatsphäre**: Alle Daten gehören dem User, kein Tracking, kein Account nötig für Phase 1

---

## 9. Technische Architektur (Übersicht)

```
┌────────────────────────────────────────────────┐
│                   Frontend                      │
│              (HTML/CSS/JS oder Svelte)          │
│                                                 │
│   Dashboard │ Session │ Tone Lab │ Progress     │
└──────────────────┬─────────────────────────────┘
                   │  Tauri IPC
┌──────────────────┴─────────────────────────────┐
│                   Rust Backend                  │
│                                                 │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│   │ Audio    │  │ Pitch    │  │ Rhythm     │  │
│   │ Capture  │  │ Detect   │  │ Analysis   │  │
│   │ (CPAL)   │  │ (YIN)    │  │ (Onset)    │  │
│   └──────────┘  └──────────┘  └────────────┘  │
│                                                 │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│   │ Session  │  │ Progress │  │ Instrument │  │
│   │ Manager  │  │ Tracker  │  │ Profiles   │  │
│   └──────────┘  └──────────┘  └────────────┘  │
│                                                 │
│   ┌──────────────────────────────────────────┐ │
│   │          SQLite (Local Storage)          │ │
│   └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Warum Rust für Audio?

- **Latenz**: Pitch Detection muss in < 20ms reagieren
- **Stabilität**: Audio-Callbacks dürfen nicht stocken
- **Genauigkeit**: YIN-Algorithmus braucht Performance für Echtzeit
- **Cross-Platform**: CPAL (Cross-Platform Audio Library) läuft auf allen Targets

---

## 10. Entschiedene Fragen

| Frage | Entscheidung |
|-------|-------------|
| **Frontend Framework** | Svelte (SvelteKit) — minimal runtime, direkte DOM-Updates, perfekt für Echtzeit-Audio-UI |
| **Stimmung** | Einstellbar, Default 442 Hz |
| **Transposition** | Default notiert (transponiert), Toggle für klingend in Settings |
| **MusicXML** | Phase 3, nicht MVP |
| **Monetarisierung** | Open Source — "die Welt verbessern" |
| **Pitch-Anzeige** | Vertikal (nicht horizontal) |
| **Notenlinien** | Ja, bei Tonleitern und Zielton-Training |
| **Rhythmus-Notation** | Default Noten, umschaltbar auf Blöcke |
| **Audio-Vorgabe** | Button ("Anhören"), optional |
| **Automatisch weiter** | Ton→Ton: automatisch. Übung→Übung: User entscheidet |
| **Drone-Sound** | Synth. Bläserklang Phase 1, echte Samples Phase 2 |
| **Metronom-Sound** | Einstellbar (Klick/Holzblock/Rimshot/Leise) |
| **Rhythmus-Input** | Horn + Klatschen (beides über Onset Detection) |
| **Fortschritt-Zeiträume** | 7 Tage / 4 Wochen / 6 Monate / Gesamt |
| **Meilensteine** | Ja, dezent als Timeline, kein Gamification |
| **Navigation** | Desktop: schmale Icon-Sidebar. Tablet/Mobil: Bottom Bar |
| **i18n** | Von Anfang an, Deutsch + Englisch |
| **Keyboard Shortcuts** | Space, Pfeile, Escape, R |
| **Lehrer-Plattform** | Vision notiert, kein MVP |

## 11. Offene Fragen

1. **Notenrendering-Bibliothek**: Für Notenlinien brauchen wir eine Library. VexFlow? abc.js? Oder eigenes minimales SVG-Rendering? (Entscheidung bei Implementation)

2. **Pitch Detection Algorithmus**: YIN vs. pYIN vs. CREPE (ML-basiert)? YIN ist bewährt und in Rust implementierbar, CREPE wäre genauer aber braucht ML-Runtime. (Entscheidung bei Implementation)

3. **Lizenz**: MIT? GPL? Apache 2.0? (Entscheidung vor erstem Release)

---

*Erstellt: 2026-03-28*
*Letzte Aktualisierung: 2026-03-28*
*Status: v0.2 — View-by-View besprochen und dokumentiert*
