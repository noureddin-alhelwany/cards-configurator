# Technical Decision – Template Definition Tool

## Ziel

Das Tool ist kein Design-Editor. Es definiert dynamische und drucktechnische Zonen auf einem bereits fertigen Design.

## MVP-Scope

- eine Seite
- bestehendes Produktformat
- Referenzbild
- Produktionshintergrund
- dynamicText
- fixedText
- qr
- Schnittkante, Beschnitt und Safe Area
- Typografie und Farben
- Testwerte
- Live-Preview
- Produktionspreview
- Speichern, Laden und Veröffentlichen

## Nicht im MVP

- Freihandzeichnen
- Formenbibliothek
- Masken oder Filter
- Rich Text
- Gruppen
- Mehrseitigkeit
- Endkundenzugriff
- AI im Editor
- beliebige Fonts
- beliebige QR-Stile
- allgemeiner Canva-ähnlicher Editor

## Bevorzugter Stack

```text
React
TypeScript
SVG als Arbeitsfläche
react-moveable für Selektion, Drag und Resize
Zustand für lokalen Editorzustand
React Hook Form für das Eigenschaftenpanel
Zod für Schema- und Payload-Validierung
TanStack Query für Serverzustände
bestehender Backendrenderer für Produktionspreview und PDF
```

Abweichungen müssen vor Implementierung begründet werden.

## Source of Truth

Das neutrale Template-Schema ist die einzige fachliche Source of Truth.

Persistiert werden:

- Produkt-ID
- Dokumentmaße in Millimetern
- Referenz- und Hintergrundassets
- Zonen
- Feldbindungen
- Textregeln
- QR-Regeln
- Safe Areas
- Schema- und Templateversion
- Veröffentlichungsstatus

Nicht persistiert werden:

- Zoom
- Pan
- aktive Auswahl
- Hover
- offene Panels
- Browserpixel
- SVG- oder react-moveable-interner State

## Koordinaten

```text
Dokumentwerte: Millimeter
Darstellung: Pixel
Zoom: reine UI-Eigenschaft
```

Es gibt genau eine zentrale Umrechnung zwischen Dokument- und Bildschirmkoordinaten.

## Referenz und Hintergrund

Die Referenz enthält Beispielinhalte und dient nur als Overlay.

Der Produktionshintergrund enthält keine variablen Inhalte und wird für Preview und Produktion verwendet.

Beide Dateien müssen identische Abmessungen, Seitenverhältnisse und Ausrichtungen besitzen. Die Referenz darf niemals in den Produktionsrender gelangen.

## Live-Preview und Produktionspreview

### Live-Preview

- sofort im Browser
- für Positionierung und Testwerte
- nicht verbindlich

### Produktionspreview

- über den bestehenden Backendrenderer
- echte Fonts
- echte Textmessung
- echte QR-Erzeugung
- echte Überlaufregeln
- Voraussetzung für Veröffentlichung

## State-Verantwortung

### Zustand

- aktives Template
- ausgewählte Zone
- Zoom
- Referenzdeckkraft
- lokaler Draft
- Undo/Redo
- Dirty State

### React Hook Form

- Eigenschaften der ausgewählten Zone

### TanStack Query

- Laden
- Speichern
- Asset-Upload
- Produktionspreview
- Veröffentlichen

### Zod

- Template-Schema
- API-Payloads
- Property-Formulare

## Undo/Redo

- History basiert auf Änderungen des neutralen Schemas.
- Drag und Resize erzeugen erst am Ende einen History-Eintrag.
- Große Assets werden nicht in jedem Snapshot dupliziert.

## Fonts

- nur Fonts aus der bestehenden Font-Registry
- keine Systemfonts
- keine beliebigen Uploads
- identische Fontdateien in Editor und Renderer
- Browsermessung bleibt nur eine Annäherung

## QR

Erlaubte Presets im MVP:

- standard
- rounded-safe

Veröffentlichung wird blockiert bei zu kleiner Zone, schlechtem Kontrast, fehlender Ruhezone oder fehlgeschlagenem Test.

## Non-negotiable Decisions

- Do not store SVG state as the template schema.
- Do not store react-moveable state as the template schema.
- Do not store screen pixels as document coordinates.
- Do not introduce a second production renderer in the browser.
- Do not make the reference asset part of production rendering.
- Do not add free drawing or general design-editor features.
- Do not add new zone types without an approved work item.
- Do not bypass the existing product registry or renderer.
- Do not make browser preview authoritative for publishing.

## Technischer Spike

1. A6-Produkt laden
2. beide Bilder laden
3. Referenzoverlay
4. eine Textzone
5. eine QR-Zone
6. Drag und Resize
7. Millimeterwerte speichern
8. Testwerte live anzeigen
9. Backendpreview erzeugen
10. Ergebnisse vergleichen

Der Spike ist erfolgreich, wenn Position, Größe, Textumbruch und QR-Größe ausreichend übereinstimmen.
