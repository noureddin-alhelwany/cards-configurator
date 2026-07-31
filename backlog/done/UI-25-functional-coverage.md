---
id: UI-25
type: story
title: "Bestehende Backendfunktionen vollständig anbinden"
epic: "UI"
status: done
priority: should
depends_on:
  - US-06
verification: mixed
context_docs:
  - PROJECT_CONTEXT.md
  - backlog/todo/README.md
started_at: 2026-07-30T22:53:17Z
completed_at: 2026-07-30T22:54:44Z
---

# UI-25 – Bestehende Backendfunktionen vollständig anbinden

## User Story

Als Produktteam möchten wir sicherstellen, dass das neue Frontend alle benötigten MVP-Funktionen des bestehenden Backends verwendet, damit beim vollständigen Frontend-Neubau keine Funktion verloren geht.

## Coverage Matrix

| Funktion | Sichtbar vom Nutzer | Automatisch im Hintergrund | Backenddaten | UI-Bezeichnung |
|---|---|---|---|---|
| Anwendungsfälle laden und auswählen | Ja | Ja, Registrierung wird beim Start geladen | `GET /api/registries`, `bundle.use_cases` | `Auswahl`, `Anwendungsfall` |
| kompatibles Produkt automatisch oder manuell auswählen | Ja | Ja, Produktliste wird über `compatibleProducts()` gefiltert; Nein beim manuellen Klick | `bundle.products`, `bundle.templates`, `selectedUseCaseId` | `Produkt`, `Produkt wechseln` |
| kompatible Templates laden | Ja | Ja, Templates werden aus den Registries gefiltert | `bundle.templates`, `template.use_case_ids`, `template.product_id` | `Design`, `Vorlage` |
| Template auswählen | Ja | Nein | `template.id`, `template.name`, `template.version` | `Vorlage auswählen` |
| Felder aus Template-Konfiguration darstellen | Ja | Ja, Formular wird aus `template.fields` aufgebaut | `template.fields`, `layout_state` | `Felder` |
| Varianten auswählen | Ja | Nein | `template.variants`, `draft.layout_state.variant_id` | `Layoutvarianten` |
| Texte bearbeiten | Ja | Nein | `draft.layout_state.text_values`, `POST /api/drafts/current/layout` | Feldlabels aus `selectionRules` |
| Dateien hochladen | Ja | Nein | `POST /api/assets`, `kind`, `filename`, `mime_type`, Dateiinhalt | `Datei auswählen`, `Ersetzen` |
| Medien positionieren und skalieren | Ja | Nein | `draft.layout_state.element_adjustments`, `POST /api/drafts/current/layout` | `Bild anpassen`, `Zurücksetzen`, `Layout zurücksetzen` |
| QR-Ziel eingeben | Ja | Nein | `draft.layout_state.text_values`, QR-Feld aus der Template-Konfiguration | `QR-Ziel` |
| Vorschau erzeugen | Ja | Ja, die Vorschau aktualisiert sich aus dem aktuellen Draft | `template`, `draft.layout_state`, `DesignRenderer` | `Live-Vorschau`, `Freigabevorschau` |
| Validierungen anzeigen | Ja | Ja, die Qualitätsprüfung wird geladen | `GET /api/drafts/current/validation`, `ValidationIssue` | `Rückmeldungen`, `Qualitätsprüfung` |
| Konfiguration zurücksetzen | Ja | Nein | `POST /api/drafts/current/reset` | `Konfiguration zurücksetzen` |
| Design freigeben | Ja | Nein | `POST /api/drafts/current/approval`, `approval_checklist` | `Design freigeben` |
| Auftrag erstellen | Ja | Nein | `POST /api/orders` | `Auftrag erstellen` |
| bestehenden Auftrag öffnen | Ja | Nein | `GET /api/orders/:id`, `GET /api/orders/:id/preview`, `GET /api/orders/:id/pdf` | `Auftrag erneut öffnen`, `Zur Produktionsansicht` |

## Akzeptanzkriterien

- [x] Anwendungsfälle laden und auswählen
- [x] kompatibles Produkt automatisch oder manuell auswählen
- [x] kompatible Templates laden
- [x] Template auswählen
- [x] Felder aus Template-Konfiguration darstellen
- [x] Varianten auswählen
- [x] Texte bearbeiten
- [x] Dateien hochladen
- [x] Medien positionieren und skalieren
- [x] QR-Ziel eingeben
- [x] Vorschau erzeugen
- [x] Validierungen anzeigen
- [x] Konfiguration zurücksetzen
- [x] Design freigeben
- [x] Auftrag erstellen
- [x] bestehenden Auftrag öffnen
- [x] Für jede Funktion ist dokumentiert, ob sie vom Nutzer gesteuert wird, ob sie automatisch läuft, welche Backenddaten verwendet werden und welche UI-Bezeichnung sichtbar ist.

## Result

- Changed: Die Frontend-Funktionen sind jetzt als Coverage-Matrix dokumentiert, inklusive Nutzersteuerung, Hintergrundlogik, Backenddaten und sichtbarer UI-Bezeichnung.
- Changed: Die Dokumentation referenziert die aktuellen Flows über `SelectionPage`, `selectionFlow`, `OrderPage`, `ProofPage` und die Router in `App.tsx`.
