# MVP – Intelligent Print & Design Configurator

## 1. Ziel des MVP

Der MVP ist eine interne Anwendung für ein Print-Studio.

Mit der Anwendung soll ein einzelner interner Nutzer aus vorbereiteten Produkten und Templates schnell einen druckfertigen Auftrag erstellen können.

Der Ablauf lautet:

```text
Anwendungsfall auswählen
→ Produkt auswählen
→ Template auswählen
→ Inhalte eingeben
→ Bilder und Logo hochladen
→ automatische Platzierung
→ Design anpassen
→ Vorschau prüfen
→ Auftrag erstellen
→ Produktionsdatei erzeugen
```

Der MVP ist kein Onlineshop und kein allgemeiner Designeditor.

---

# 2. MVP-Abgrenzung

## Bestandteil des MVP

* interne Einzelnutzer-Anwendung
* keine Anmeldung erforderlich
* eine kleine QR-Aufsteller-Produktfamilie
* mehrere QR-Anwendungsfälle
* drei bis sechs vorbereitete Templates
* mehrere vordefinierte Layoutvarianten
* dynamische Eingabeformulare
* Textlimits je Feld
* Upload von Bildern und Logos
* automatische Bildplatzierung
* begrenzte manuelle Bild- und Logoanpassung
* QR-Code-Erzeugung aus einer URL
* 2D-Designvorschau
* einfaches Produkt-Mockup
* Bildqualitätsprüfung
* Freigabeprüfung
* interne Auftragserstellung
* Auftragsübersicht
* Produktions-PDF
* lokale Speicherung

## Nicht Bestandteil des MVP

* Login und Benutzerverwaltung
* Kundenkonten
* Rollen und Berechtigungen
* Zahlung
* Warenkorb
* Versand
* Rechnungen
* Rabatte
* E-Mail-Versand
* Online-Checkout
* visueller Template-Builder
* freier Canva-artiger Editor
* KI-generierte Designs
* generative Bildbearbeitung
* automatische Hintergrundentfernung
* komplexer Produktionsworkflow
* mehrere Print-Anbieter
* vollständige CMYK-Automatisierung
* mehrsprachige Benutzeroberfläche

---

# 3. Zielprodukt des MVP

## Produktfamilie

Der MVP startet mit einer Produktfamilie:

> QR-Aufsteller für lokale Unternehmen

## Anwendungsfälle

* Google-Bewertung öffnen
* Terminbuchung öffnen
* Instagram-Profil öffnen
* Website öffnen
* digitale Speisekarte oder Preisliste öffnen

Technisch erzeugen alle Anwendungsfälle einen QR-Code aus einer URL.

Die Unterschiede bestehen aus:

* Überschrift
* Begleittext
* Design
* Vorlage
* Produkt-Mockup

---

# 4. Nutzerfluss

## Schritt 1 – Anwendungsfall auswählen

Der interne Nutzer wählt aus, welchem Zweck das Produkt dienen soll.

Beispiele:

* Mehr Google-Bewertungen
* Termine direkt buchen
* Instagram öffnen
* Website besuchen

## Schritt 2 – Produkt auswählen

Im MVP gibt es nur wenige definierte Produkte oder Produktvarianten.

Beispiel:

* QR-Aufsteller A6
* QR-Karte A6 ohne Ständer
* QR-Aufsteller quadratisch

Für den ersten Release kann auch nur eine Produktvariante umgesetzt werden.

## Schritt 3 – Template auswählen

Der Nutzer sieht drei bis sechs vorbereitete Designs.

Jedes Template zeigt:

* Vorschaubild
* Template-Name
* unterstützten Anwendungsfall
* verfügbare Layoutvarianten

## Schritt 4 – Inhalte eingeben

Das Formular wird anhand des ausgewählten Templates erzeugt.

Mögliche Felder:

* Firmenname
* Überschrift
* Beschreibung
* QR-Ziel
* Logo
* Hintergrundbild
* Kontaktinformation

## Schritt 5 – Layoutvariante auswählen

Der Nutzer erhält vordefinierte Varianten.

Beispiele:

* Logo im Vordergrund
* Text im Vordergrund
* Bild im Vordergrund

## Schritt 6 – Design anpassen

Der Nutzer darf nur kontrollierte Änderungen vornehmen.

Erlaubt:

* Bild verschieben
* Bild zoomen
* Bildausschnitt anpassen
* Logo verschieben
* Logo vergrößern oder verkleinern

Nicht erlaubt:

* Text frei verschieben
* QR-Code frei verschieben
* Schriftart ändern
* beliebige Elemente hinzufügen
* Ebenen verwalten
* Seitengröße ändern

## Schritt 7 – Vorschau prüfen

Der Nutzer sieht:

* genaue 2D-Vorschau
* optional ein einfaches Produkt-Mockup
* Warnungen bei Bildqualität
* fehlende Pflichtfelder
* Textüberlauf

## Schritt 8 – Auftrag erstellen

Der Nutzer bestätigt:

* Texte geprüft
* QR-Ziel geprüft
* Bildausschnitt geprüft
* Design freigegeben

Anschließend wird der Auftrag gespeichert und die Produktionsdatei erzeugt.

---

# 5. Epics und User Stories

# Epic 1 – Produkt und Anwendungsfall

## US-01 – Anwendungsfall auswählen

> Als interner Nutzer möchte ich den Einsatzzweck auswählen, damit mir passende Produkte und Designs angezeigt werden.

### Akzeptanzkriterien

* Es werden definierte Anwendungsfälle angezeigt.
* Jeder Anwendungsfall besitzt Name, Beschreibung und Vorschaubild.
* Nach der Auswahl werden nur passende Produkte und Templates angezeigt.
* Die Auswahl kann vor der Finalisierung geändert werden.

### Technische Tasks

* Datenmodell `UseCase` erstellen
* Anwendungsfälle als strukturierte Konfiguration anlegen
* Auswahlseite implementieren
* Auswahl im Konfigurationsstatus speichern

---

## US-02 – Produkt auswählen

> Als interner Nutzer möchte ich ein Produkt auswählen, damit Format und Druckregeln festgelegt werden.

### Akzeptanzkriterien

* Produktname, Format und Vorschau werden angezeigt.
* Nur aktive Produkte werden angeboten.
* Das Produkt definiert Größe, Beschnitt und Auflösungsgrenzen.
* Ein Produkt kann mehreren Anwendungsfällen zugeordnet werden.

### Technische Tasks

* Datenmodell `Product` erstellen
* Produktkonfiguration definieren
* Produktübersicht implementieren
* Produktregeln in Layout-State übernehmen

---

# Epic 2 – Template-System

## US-03 – Templates anzeigen

> Als interner Nutzer möchte ich passende Templates sehen, damit ich schnell ein vorbereitetes Design auswählen kann.

### Akzeptanzkriterien

* Templates werden nach Produkt und Anwendungsfall gefiltert.
* Jedes Template zeigt Name und Vorschaubild.
* Inaktive Templates werden nicht angezeigt.
* Es werden zunächst drei bis sechs Templates unterstützt.

### Technische Tasks

* Template-Verzeichnisstruktur definieren
* Template-Konfigurationsschema erstellen
* Template-Loader implementieren
* Template-Übersicht entwickeln
* Template-Vorschauen laden

---

## US-04 – Template auswählen

> Als interner Nutzer möchte ich ein Template auswählen, damit dessen Felder und Layoutregeln geladen werden.

### Akzeptanzkriterien

* Das Template wird im aktuellen Entwurf gespeichert.
* Die zugehörigen Eingabefelder werden geladen.
* Layoutvarianten werden angezeigt.
* Template-ID und Version werden gespeichert.

### Technische Tasks

* Template-Auswahl implementieren
* Template-Versionierung vorsehen
* Layout-State initialisieren
* Template-Assets laden

---

## US-05 – Layoutvariante auswählen

> Als interner Nutzer möchte ich zwischen vorbereiteten Layoutvarianten wählen, damit ich verschiedene Gewichtungen testen kann.

### Akzeptanzkriterien

* Ein Template kann eine oder mehrere Varianten besitzen.
* Die Varianten verändern nur vordefinierte Positionen und Größen.
* Inhalte bleiben beim Variantenwechsel erhalten.
* Die Vorschau aktualisiert sich direkt.

### Technische Tasks

* Varianten im Template-Schema definieren
* Variantenumschaltung implementieren
* Layout-State beim Wechsel aktualisieren
* Vorschau neu rendern

---

# Epic 3 – Dynamisches Formular

## US-06 – Template-Felder anzeigen

> Als interner Nutzer möchte ich nur die Felder sehen, die für das ausgewählte Template benötigt werden.

### Akzeptanzkriterien

* Felder werden aus der Template-Konfiguration erzeugt.
* Pflichtfelder sind gekennzeichnet.
* Optionale Felder können leer bleiben.
* Unterstützt werden zunächst Text, URL, Bild und Logo.

### Technische Tasks

* dynamischen Formular-Renderer implementieren
* Feldtypen definieren
* Validierungsregeln laden
* Formulardaten im Layout-State speichern

---

## US-07 – Text eingeben

> Als interner Nutzer möchte ich Texte eingeben, damit sie automatisch im Design platziert werden.

### Akzeptanzkriterien

* Jedes Textfeld besitzt ein Zeichenlimit.
* Die verbleibende Zeichenanzahl wird angezeigt.
* Maximale Zeilenanzahl wird berücksichtigt.
* Zu lange Texte werden nicht akzeptiert oder klar markiert.
* Textänderungen aktualisieren die Vorschau.

### Technische Tasks

* Textfeld-Komponente entwickeln
* Zeichenlimit implementieren
* Zeilen- und Größenberechnung implementieren
* Text-Overflow erkennen
* Vorschau aktualisieren

---

## US-08 – URL eingeben

> Als interner Nutzer möchte ich eine URL eingeben, damit daraus ein QR-Code erzeugt wird.

### Akzeptanzkriterien

* URLs mit und ohne Protokoll werden akzeptiert.
* Fehlendes `https://` wird automatisch ergänzt.
* Ungültige Eingaben werden markiert.
* Der QR-Code aktualisiert sich nach Änderung.
* Der QR-Code wird nicht nach Plattformtyp gespeichert, sondern als URL.

### Technische Tasks

* URL-Normalisierung implementieren
* URL-Validierung implementieren
* QR-Code-Generator integrieren
* QR-Code als Render-Asset speichern

---

# Epic 4 – Uploads und Assets

## US-09 – Logo hochladen

> Als interner Nutzer möchte ich ein Logo hochladen, damit es automatisch im Logo-Bereich des Templates platziert wird.

### Akzeptanzkriterien

* PNG, JPG und SVG werden unterstützt.
* Das Seitenverhältnis bleibt erhalten.
* Das Logo wird standardmäßig vollständig sichtbar dargestellt.
* Das Logo kann innerhalb einer definierten Zone angepasst werden.
* Ungültige Dateien werden abgelehnt.

### Technische Tasks

* Upload-Endpunkt implementieren
* Dateityp und Dateigröße prüfen
* SVG-Dateien bereinigen
* Vorschaudatei erzeugen
* Asset im Entwurf speichern

---

## US-10 – Bild hochladen

> Als interner Nutzer möchte ich ein Bild hochladen, damit es automatisch in den vorgesehenen Bildbereich eingefügt wird.

### Akzeptanzkriterien

* JPG und PNG werden unterstützt.
* EXIF-Ausrichtung wird berücksichtigt.
* Das Bild wird automatisch passend zugeschnitten.
* Ein mittiger Ausschnitt ist der Fallback.
* Der Nutzer kann den Ausschnitt anschließend korrigieren.

### Technische Tasks

* Bild-Upload implementieren
* Metadaten auslesen
* EXIF-Rotation korrigieren
* Vorschau-Thumbnail erzeugen
* initialen Crop berechnen

---

## US-11 – Bild automatisch optimieren

> Als interner Nutzer möchte ich, dass Bilder technisch vorbereitet werden, damit sie zuverlässig gerendert werden können.

### Akzeptanzkriterien

* Bilder werden in ein unterstütztes internes Format umgewandelt.
* Sehr große Bilder werden für die Vorschau verkleinert.
* Originaldateien bleiben für den finalen Export verfügbar.
* Leichte Schärfung oder Kontrastkorrektur kann pro Template aktiviert werden.
* Die Bearbeitung verändert nicht dauerhaft die Originaldatei.

### Technische Tasks

* lokales Python-Bildmodul erstellen
* Preview- und Original-Asset unterscheiden
* Bildskalierung implementieren
* optionale Filter konfigurieren
* Fehlerbehandlung implementieren

---

# Epic 5 – Kontrollierter Editor

## US-12 – Bild verschieben

> Als interner Nutzer möchte ich das Bild innerhalb des vorgesehenen Ausschnitts verschieben, damit das Motiv richtig positioniert ist.

### Akzeptanzkriterien

* Das Bild kann nur innerhalb seines Bildrahmens verschoben werden.
* Leere Flächen dürfen nicht sichtbar werden.
* Die Position wird relativ gespeichert.
* Die Änderung aktualisiert die Vorschau sofort.

### Technische Tasks

* Crop-Editor implementieren
* Bewegungsgrenzen berechnen
* relative Koordinaten speichern
* Layout-State aktualisieren

---

## US-13 – Bild zoomen

> Als interner Nutzer möchte ich ein Bild vergrößern oder verkleinern, damit der gewünschte Ausschnitt sichtbar ist.

### Akzeptanzkriterien

* Das Template definiert minimale und maximale Skalierung.
* Das Bild darf den Rahmen nicht unterschreiten.
* Die effektive Auflösung wird nach Skalierung neu berechnet.
* Warnungen werden direkt aktualisiert.

### Technische Tasks

* Zoom-Steuerung implementieren
* Min-/Max-Werte aus Template laden
* DPI nach Skalierung berechnen
* Vorschau aktualisieren

---

## US-14 – Logo anpassen

> Als interner Nutzer möchte ich das Logo innerhalb einer sicheren Zone verschieben und skalieren.

### Akzeptanzkriterien

* Logo bleibt proportional.
* Logo kann nicht außerhalb der erlaubten Zone bewegt werden.
* Min- und Max-Größe werden eingehalten.
* Eine Zurücksetzen-Funktion ist vorhanden.

### Technische Tasks

* Logo-Transformation implementieren
* Bewegungszone definieren
* Skalierungsgrenzen anwenden
* Reset-Funktion implementieren

---

## US-15 – Design zurücksetzen

> Als interner Nutzer möchte ich Änderungen zurücksetzen, damit ich zur empfohlenen Ausgangsposition zurückkehren kann.

### Akzeptanzkriterien

* Einzelne Bilder und Logos können zurückgesetzt werden.
* Optional kann die gesamte Seite zurückgesetzt werden.
* Texte und Uploads bleiben bei einem Layout-Reset erhalten.
* Eine vollständige Undo-Historie ist nicht erforderlich.

### Technische Tasks

* Default-Transformationswerte speichern
* Reset pro Element implementieren
* Reset für Layoutvariante implementieren

---

# Epic 6 – Vorschau

## US-16 – Live-Vorschau anzeigen

> Als interner Nutzer möchte ich Änderungen direkt sehen, damit ich das Design beurteilen kann.

### Akzeptanzkriterien

* Texte, Bilder, Logos und QR-Code werden dargestellt.
* Vorschau und Produktionsdatei verwenden dasselbe Layoutmodell.
* Die Vorschau aktualisiert sich ohne komplettes Neuladen.
* Proportionen entsprechen dem tatsächlichen Produktformat.

### Technische Tasks

* SVG- oder Canvas-Renderer implementieren
* Layout-State auf Renderer abbilden
* Asset-Positionierung implementieren
* Text-Rendering implementieren
* QR-Code integrieren

---

## US-17 – Produkt-Mockup anzeigen

> Als interner Nutzer möchte ich das Design in einem einfachen Produkt-Mockup sehen, damit ich die Wirkung besser beurteilen kann.

### Akzeptanzkriterien

* Das aktuelle Design wird in ein vorbereitetes Mockup eingesetzt.
* Das Mockup ist nicht Grundlage für die Druckproduktion.
* Eine statische perspektivische Darstellung reicht aus.
* Das Mockup aktualisiert sich nach relevanten Änderungen.

### Technische Tasks

* Mockup-Vorlage erstellen
* gerenderte Vorschau in Mockup einsetzen
* Mockup-Bild erzeugen
* Ladezustand darstellen

---

# Epic 7 – Qualitätsprüfung

## US-18 – Pflichtfelder prüfen

> Als interner Nutzer möchte ich sehen, ob alle erforderlichen Angaben vorhanden sind.

### Akzeptanzkriterien

* Fehlende Pflichtfelder werden markiert.
* Der Auftrag kann nicht finalisiert werden, solange Pflichtfelder fehlen.
* Die Fehlermeldung benennt das betroffene Feld.

### Technische Tasks

* zentrale Formularvalidierung implementieren
* Validierungsstatus im Layout-State speichern
* Finalisierung blockieren

---

## US-19 – Textüberlauf prüfen

> Als interner Nutzer möchte ich gewarnt werden, wenn ein Text nicht in den vorgesehenen Bereich passt.

### Akzeptanzkriterien

* Schriftgröße wird innerhalb definierter Grenzen reduziert.
* Maximale Zeilenanzahl wird berücksichtigt.
* Nicht passend darstellbarer Text wird als Fehler markiert.
* Die betroffene Textfläche wird in der Vorschau hervorgehoben.

### Technische Tasks

* Textmessung implementieren
* automatische Schriftgrößenanpassung
* Overflow-Erkennung
* Fehlermeldung anzeigen

---

## US-20 – Bildqualität prüfen

> Als interner Nutzer möchte ich die effektive Bildauflösung sehen, damit ich schlechte Druckqualität erkenne.

### Akzeptanzkriterien

* Die effektive DPI wird anhand der Druckgröße berechnet.
* Grenzwerte werden pro Produkt definiert.
* Es gibt die Stufen ausreichend, grenzwertig und ungeeignet.
* Ungeeignete Bilder blockieren die Finalisierung.
* Grenzwertige Bilder erzeugen eine Warnung.

### Technische Tasks

* DPI-Berechnung implementieren
* Produktgrenzwerte definieren
* Warnkomponente entwickeln
* Finalisierungsregeln anwenden

---

## US-21 – QR-Mindestgröße prüfen

> Als interner Nutzer möchte ich gewarnt werden, wenn der QR-Code zu klein dargestellt wird.

### Akzeptanzkriterien

* Die Mindestgröße wird im Produkt oder Template definiert.
* Zu kleine QR-Codes blockieren die Finalisierung.
* Der QR-Code kann im MVP nicht frei skaliert werden.
* Die Scanbarkeit wird zusätzlich manuell vor dem Druck geprüft.

### Technische Tasks

* QR-Größe aus Layout berechnen
* Mindestwert validieren
* Fehlermeldung anzeigen

---

# Epic 8 – Freigabe und Auftrag

## US-22 – Design freigeben

> Als interner Nutzer möchte ich das Design anhand einer kurzen Checkliste freigeben, bevor der Auftrag erstellt wird.

### Akzeptanzkriterien

Der Nutzer bestätigt:

* Texte geprüft
* URL geprüft
* Bildausschnitt geprüft
* Vorschau freigegeben

Alle Punkte müssen bestätigt werden.

### Technische Tasks

* Freigabe-Dialog entwickeln
* Checkboxen implementieren
* Freigabezeitpunkt speichern
* finalen Layout-State sperren

---

## US-23 – Auftrag erstellen

> Als interner Nutzer möchte ich aus der Konfiguration einen Auftrag erstellen.

### Akzeptanzkriterien

* Eine eindeutige Auftragsnummer wird erzeugt.
* Der finale Layout-State wird gespeichert.
* Template-ID und Template-Version werden gespeichert.
* Alle verwendeten Assets werden dem Auftrag zugeordnet.
* Ein Vorschaubild wird gespeichert.
* Der Auftrag erscheint in der Auftragsübersicht.

### Technische Tasks

* Datenmodell `Order` erstellen
* Auftragsnummer generieren
* Layout-Snapshot speichern
* Assets kopieren oder fest referenzieren
* Vorschau rendern
* Auftragsdetailseite erstellen

---

# Epic 9 – Produktionsdatei

## US-24 – Produktions-PDF erzeugen

> Als interner Nutzer möchte ich eine Produktionsdatei erzeugen, damit der Auftrag gedruckt werden kann.

### Akzeptanzkriterien

* Die Datei verwendet das definierte Produktformat.
* Beschnitt wird berücksichtigt.
* Schriften und Grafiken werden korrekt eingebettet oder in Pfade umgewandelt.
* Originalbilder werden für den Export verwendet.
* Die Datei wird dem Auftrag zugeordnet.
* Ein Renderfehler wird sichtbar angezeigt.

### Technische Tasks

* PDF-Renderer auswählen und integrieren
* Millimeter-zu-PDF-Koordinaten umrechnen
* Beschnitt umsetzen
* Schriften einbetten
* Bildassets hochauflösend rendern
* PDF-Datei speichern

---

## US-25 – Rendering wiederholen

> Als interner Nutzer möchte ich die Produktionsdatei erneut erzeugen können, falls der erste Versuch fehlschlägt.

### Akzeptanzkriterien

* Fehlgeschlagene Renderings werden markiert.
* Ein erneuter Rendering-Versuch kann gestartet werden.
* Bestehende Layoutdaten bleiben unverändert.
* Die letzte erfolgreiche Datei bleibt erhalten.

### Technische Tasks

* Render-Job-Datenmodell erstellen
* Status `pending`, `processing`, `completed`, `failed`
* Retry-Funktion implementieren
* Fehlerprotokoll speichern

---

# Epic 10 – Auftragsverwaltung

## US-26 – Aufträge anzeigen

> Als interner Nutzer möchte ich alle erstellten Aufträge sehen, damit ich sie später öffnen kann.

### Akzeptanzkriterien

Die Übersicht zeigt:

* Auftragsnummer
* Datum
* Kunde oder Firmenname
* Produkt
* Template
* Vorschaubild

Die neuesten Aufträge stehen oben.

### Technische Tasks

* Auftragsliste implementieren
* Sortierung nach Datum
* Vorschaubilder laden
* Detailverlinkung implementieren

---

## US-27 – Auftrag öffnen

> Als interner Nutzer möchte ich einen Auftrag öffnen, damit ich dessen Inhalte und Produktionsdateien sehen kann.

### Akzeptanzkriterien

Angezeigt werden:

* alle Kundeneingaben
* verwendetes Template
* Layoutvariante
* finale Vorschau
* Produkt-Mockup
* hochgeladene Assets
* Produktions-PDF
* Freigabezeitpunkt

### Technische Tasks

* Auftragsdetailseite entwickeln
* Layout-Snapshot anzeigen
* Assets zugänglich machen
* PDF öffnen oder herunterladen

---

# Epic 11 – Speicherung und Wiederherstellung

## US-28 – Entwurf automatisch speichern

> Als interner Nutzer möchte ich, dass meine aktuelle Konfiguration automatisch gespeichert wird.

### Akzeptanzkriterien

* Formularwerte bleiben nach einem Neuladen erhalten.
* Layoutanpassungen bleiben erhalten.
* Der letzte aktive Entwurf kann wiederhergestellt werden.
* Noch nicht finalisierte Daten werden getrennt von Aufträgen gespeichert.

### Technische Tasks

* Draft-Datenmodell erstellen
* Autosave implementieren
* Browserzustand und Backendzustand synchronisieren
* Wiederherstellungsdialog entwickeln

---

# 6. Technische Architektur

## Architekturform

Der MVP wird als modularer Monolith umgesetzt.

```text
Web-Oberfläche
│
├── Konfigurator
├── Template-Auswahl
├── Editor
├── Vorschau
└── Auftragsübersicht

Python-Backend
│
├── Produkte
├── Templates
├── Entwürfe
├── Aufträge
├── Uploads
├── Bildverarbeitung
├── QR-Code-Erzeugung
└── PDF-Rendering

Speicherung
│
├── SQLite
└── lokales Dateisystem
```

## Keine Microservices

Es werden keine separaten Dienste für Bildverarbeitung, Rendering oder Aufträge benötigt.

Die Module bleiben logisch getrennt, laufen aber in einer Anwendung.

---

# 7. Empfohlener Stack

## Backend

* Python
* FastAPI
* SQLAlchemy oder SQLModel
* Alembic für Datenbankmigrationen
* Pydantic für Datenvalidierung

## Frontend

### Empfehlung für den MVP

* React
* TypeScript
* Vite
* SVG für die Designvorschau

Alternativ kann eine serverseitige Oberfläche genutzt werden. Für den kontrollierten Editor ist React jedoch langfristig angenehmer.

## Datenbank

* SQLite im MVP
* späterer Wechsel auf PostgreSQL möglich

## Bildverarbeitung

* Pillow
* optional OpenCV für einfache Motiverkennung
* CairoSVG oder vergleichbare Bibliothek für SVG-Verarbeitung

## QR-Code

* Segno oder `qrcode`

## PDF-Erzeugung

Mögliche Optionen:

### A – ReportLab

Gut kontrollierbar, stabil und direkt in Python.

### B – SVG zu PDF über CairoSVG

Sinnvoll, wenn Templates und Vorschau vollständig SVG-basiert sind.

### Empfehlung

SVG als gemeinsames Layoutformat und anschließend Export über CairoSVG oder eine ähnliche Engine.

Vor der finalen Entscheidung muss ein technischer Proof of Concept mit:

* Schriftarten
* Bildern
* Beschnitt
* Transparenz
* SVG-Logos
* QR-Code

erstellt werden.

---

# 8. Zentrale Datenmodelle

## Product

```text
id
name
width_mm
height_mm
bleed_mm
recommended_dpi
warning_dpi
minimum_dpi
qr_minimum_size_mm
active
```

## UseCase

```text
id
name
description
preview
active
```

## Template

```text
id
version
name
product_id
use_case_ids
preview
configuration
active
```

## Draft

```text
id
product_id
use_case_id
template_id
template_version
layout_state
created_at
updated_at
```

## Asset

```text
id
type
original_filename
original_path
preview_path
mime_type
width_px
height_px
created_at
```

## Order

```text
id
order_number
customer_name
product_id
template_id
template_version
layout_snapshot
preview_path
mockup_path
production_pdf_path
approved_at
created_at
```

## RenderJob

```text
id
order_id
status
attempts
error_message
created_at
finished_at
```

---

# 9. Template-Definition

Beispiel:

```json
{
  "id": "qr-modern-01",
  "version": 1,
  "name": "Modern Minimal",
  "product": "qr-stand-a6",
  "useCases": [
    "google-review",
    "booking",
    "instagram",
    "website"
  ],
  "canvas": {
    "widthMm": 105,
    "heightMm": 148,
    "bleedMm": 3
  },
  "fields": [
    {
      "id": "businessName",
      "type": "text",
      "required": true,
      "maxLength": 40,
      "maxLines": 2
    },
    {
      "id": "headline",
      "type": "text",
      "required": true,
      "maxLength": 60,
      "maxLines": 3
    },
    {
      "id": "logo",
      "type": "logo",
      "required": false
    },
    {
      "id": "qrTarget",
      "type": "url",
      "required": true
    }
  ],
  "variants": [
    {
      "id": "logo-focused",
      "name": "Logo im Fokus"
    },
    {
      "id": "text-focused",
      "name": "Text im Fokus"
    }
  ]
}
```

---

# 10. Umsetzungsphasen

## Phase 1 – Technischer Proof of Concept

Ziel: Nachweisen, dass eine Template-Definition zuverlässig als Vorschau und PDF gerendert werden kann.

### Tasks

* ein Produkt definieren
* ein Template als SVG erstellen
* JSON-Konfiguration laden
* Texte einsetzen
* Logo einsetzen
* QR-Code einsetzen
* Vorschau erzeugen
* PDF erzeugen
* Beschnitt prüfen
* Schriftarten prüfen

### Ergebnis

Ein festes Template kann mit Testdaten als Vorschau und Produktions-PDF erzeugt werden.

---

## Phase 2 – Template- und Produktbasis

### Tasks

* Produktmodell
* Anwendungsfallmodell
* Template-Loader
* Template-Versionierung
* Template-Übersicht
* Variantenlogik

### Ergebnis

Produkte und Templates können vollständig aus strukturierten Dateien geladen werden.

---

## Phase 3 – Formulare und Uploads

### Tasks

* dynamische Formulare
* Textlimits
* URL-Normalisierung
* Logo-Upload
* Bild-Upload
* Asset-Speicherung
* Bildvorschauen

### Ergebnis

Alle benötigten Kundendaten können eingegeben und gespeichert werden.

---

## Phase 4 – Editor und Live-Vorschau

### Tasks

* SVG-Vorschau
* Bild-Crop
* Bild-Zoom
* Logo-Position
* Logo-Skalierung
* Variantenwechsel
* Reset-Funktion

### Ergebnis

Das Design kann kontrolliert angepasst werden.

---

## Phase 5 – Qualitätsprüfung

### Tasks

* Pflichtfeldprüfung
* Textüberlauf
* DPI-Berechnung
* QR-Mindestgröße
* Warnungsanzeige
* Blockierung bei kritischen Fehlern

### Ergebnis

Offensichtlich ungeeignete Designs können nicht finalisiert werden.

---

## Phase 6 – Auftrag und PDF

### Tasks

* Freigabe-Checkliste
* Auftragserstellung
* Layout-Snapshot
* Auftragsnummer
* Vorschaubild
* PDF-Rendering
* Renderfehler und Retry

### Ergebnis

Ein freigegebener Auftrag besitzt eine reproduzierbare Produktionsdatei.

---

## Phase 7 – Auftragsübersicht

### Tasks

* Auftragsliste
* Auftragsdetails
* Vorschaubild
* Asset-Ansicht
* PDF-Zugriff

### Ergebnis

Erstellte Aufträge können jederzeit geöffnet und produziert werden.

---

# 11. Priorisierung

## Must-have

* Produkt auswählen
* Template auswählen
* dynamische Felder
* Text eingeben
* URL eingeben
* QR-Code erzeugen
* Logo hochladen
* Bild hochladen
* automatische Platzierung
* Bildausschnitt anpassen
* Vorschau
* Pflichtfeldprüfung
* Textüberlaufprüfung
* DPI-Prüfung
* Freigabe
* Auftrag speichern
* Produktions-PDF
* Auftrag öffnen

## Should-have

* mehrere Layoutvarianten
* Produkt-Mockup
* automatische Bildoptimierung
* Autosave
* Rendering-Retry
* SVG-Logo-Unterstützung

## Could-have

* einfache Motiverkennung
* mehrere Produktvarianten
* weitere QR-Anwendungsfälle
* Aufträge duplizieren
* Template-Vorschau mit Beispieldaten
* manuelle PDF-Neuerzeugung

## Nicht im MVP

* Kundenlogin
* Zahlung
* Versand
* Warenkorb
* öffentlicher Kundenzugang
* KI-Designgenerierung
* visueller Template-Editor
* komplexer Admin-Bereich

---

# 12. Definition of Done für den MVP

Der MVP gilt als fertig, wenn folgender Ablauf vollständig funktioniert:

1. Der interne Nutzer öffnet die Anwendung.
2. Er wählt einen Anwendungsfall.
3. Er wählt das QR-Produkt.
4. Er wählt eines von mindestens drei Templates.
5. Er trägt Firmenname, Text und URL ein.
6. Er lädt ein Logo oder Bild hoch.
7. Die Inhalte werden automatisch platziert.
8. Er passt Bildausschnitt oder Logo an.
9. Das System prüft Pflichtfelder, Text und Bildauflösung.
10. Er bestätigt die Freigabe.
11. Ein Auftrag wird erstellt.
12. Ein Vorschaubild wird gespeichert.
13. Eine Produktions-PDF wird erzeugt.
14. Der Auftrag kann später wieder geöffnet werden.
15. Vorschau und Produktionsdatei stimmen inhaltlich und geometrisch überein.

---

# 13. Empfohlener erster Entwicklungs-Sprint

## Sprint-Ziel

Ein vollständiger vertikaler Durchstich mit einem Produkt und einem Template.

## Sprint-Backlog

1. FastAPI-Projekt einrichten
2. React-/TypeScript-Frontend einrichten
3. SQLite und Migrationen einrichten
4. ein QR-Produkt als JSON anlegen
5. ein SVG-Template erstellen
6. Template-Konfiguration laden
7. Textfelder dynamisch anzeigen
8. URL normalisieren
9. QR-Code erzeugen
10. Logo als PNG hochladen
11. SVG-Vorschau rendern
12. einfachen Auftrag speichern
13. PDF aus demselben Layout-State erzeugen
14. gespeicherten Auftrag wieder öffnen

## Sprint-Ergebnis

Nach dem ersten Sprint kann ein einfaches QR-Aufsteller-Design mit Firmenname, Text, Logo und URL erzeugt, gespeichert und als PDF exportiert werden.

Das ist der technische Kern, auf dem alle weiteren MVP-Funktionen aufgebaut werden.
