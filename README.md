# Intelligent Print & Design Configurator

Dieses Repository enthält die Produkt-, MVP- und Architekturgrundlage für die
Implementierung mit Codex.

## Start

1. `START_HERE.md` lesen.
2. `TECH-01` im Status `in-progress` halten, bis der Bootstrap abgeschlossen ist.
3. Immer nur ein Work Item gleichzeitig in `backlog/in-progress/` halten.

## Lokale Startbefehle

- Backend entwickeln: `make backend-dev`
- Frontend entwickeln: `make frontend-dev`
- Frontend bauen: `make build`
- Vollständige Prüfungen: `make lint`, `make typecheck`, `make test`

## Laufzeitlayout

- Persistente lokale Daten liegen in `.data/` bzw. im Compose-Volume
  `cards-configurator-data`.
- Generierte Artefakte, Build-Ausgaben und lokale Caches sind in `.gitignore`
  erfasst.


## Bootstrap-Install

- Python-Abhängigkeiten installieren: `make backend-install`
- Node-Abhängigkeiten installieren: `make frontend-install`
- Lokale Datenbank liegt standardmäßig unter `data/` oder im Compose-Volume.
