# Progress Tracker

Folder location is authoritative. This table must be updated in the same change as
a work-item move.

## Summary

- Todo: 7
- In progress: 0
- Done: 24
- Blocked: 0

## Work items

| ID | Type | Priority | Status | Depends on | Title |
|---|---|---:|---|---|---|
| TECH-01 | technical | must | done | — | Repository bootstrap |
| TECH-02 | technical | must | done | TECH-01 | Configuration registries and schemas |
| TECH-03 | technical | must | done | TECH-01, TECH-02 | Shared renderer proof |
| TECH-04 | technical | must | done | TECH-03 | Production render pipeline proof |
| US-01 | story | must | done | TECH-02 | Anwendungsfall auswählen |
| US-02 | story | must | done | TECH-02, US-01 | Produkt auswählen |
| US-03 | story | must | done | TECH-02, US-01, US-02 | Templates anzeigen |
| US-04 | story | must | done | US-03 | Template auswählen |
| US-05 | story | should | done | US-04 | Layoutvariante auswählen |
| US-06 | story | must | done | US-04 | Template-Felder anzeigen |
| US-07 | story | must | done | US-06 | Text eingeben |
| US-08 | story | must | done | US-06 | URL eingeben |
| US-09 | story | must | done | TECH-01, US-06 | Logo hochladen |
| US-10 | story | must | done | TECH-01, US-06 | Bild hochladen |
| US-11 | story | should | done | US-10 | Bild automatisch optimieren |
| US-12 | story | must | done | US-10, US-16 | Bild verschieben |
| US-13 | story | must | todo | US-10, US-16, US-20 | Bild zoomen |
| US-14 | story | must | done | US-09, US-16 | Logo anpassen |
| US-15 | story | should | todo | US-12, US-13, US-14 | Design zurücksetzen |
| US-16 | story | must | done | TECH-03, US-04 | Live-Vorschau anzeigen |
| US-17 | story | should | done | US-16, TECH-04 | Produkt-Mockup anzeigen |
| US-18 | story | must | done | US-06 | Pflichtfelder prüfen |
| US-19 | story | must | done | US-07, US-16 | Textüberlauf prüfen |
| US-20 | story | must | done | US-10, US-16 | Bildqualität prüfen |
| US-21 | story | must | done | US-08, US-16 | QR-Mindestgröße prüfen |
| US-22 | story | must | done | US-18, US-19, US-20, US-21 | Design freigeben |
| US-23 | story | must | todo | TECH-01, US-22 | Auftrag erstellen |
| US-24 | story | must | todo | TECH-04, US-23 | Produktions-PDF erzeugen |
| US-25 | story | should | todo | US-24 | Rendering wiederholen |
| US-26 | story | must | todo | US-23 | Aufträge anzeigen |
| US-27 | story | must | todo | US-23, US-24 | Auftrag öffnen |
| US-28 | story | should | todo | US-06 | Entwurf automatisch speichern |

## Update rules

- Start: move file to `in-progress/`, update frontmatter and this table.
- Complete: check all acceptance criteria, fill Result, move to `done/`, update table.
- Blocked: keep it in `in-progress/` and record the blocker in Result.
- Keep at most one item in progress unless the user explicitly approves parallel work.
