# Start mit Codex

Das Paket enthält bereits eine kuratierte `AGENTS.md`. Der Codex-Befehl `/init`
erzeugt lediglich ein neues Scaffold für diese Datei und ist deshalb hier
**nicht erforderlich**.

## Einmalige lokale Vorbereitung

```bash
unzip cards-configurator-codex-spec.zip
cd cards-configurator-codex-spec
git init
git add .
git commit -m "docs: initialize product and engineering specification"
codex
```

## Erster Prompt in Codex

```text
Lies AGENTS.md, START_HERE.md, PROJECT_CONTEXT.md,
docs/IMPLEMENTATION_ORDER.md und backlog/todo/TECH-01-repository-bootstrap.md.

Starte ausschließlich TECH-01:
1. Prüfe zuerst den aktuellen Repository-Inhalt.
2. Verschiebe das Work Item nach backlog/in-progress/.
3. Aktualisiere backlog/PROGRESS.md.
4. Erstelle einen kurzen Plan mit maximal 8 Punkten.
5. Implementiere nur den Repository-Bootstrap.
6. Führe die für TECH-01 genannten Prüfungen aus.
7. Dokumentiere Ergebnis und offene Punkte im Work Item.
8. Verschiebe es nur bei vollständiger Erfüllung nach backlog/done/.

Lies keine weiteren User Stories, solange sie für TECH-01 nicht erforderlich sind.
```

## Danach

Für weitere Stories kann der Prompt aus `prompts/START_STORY.md` verwendet werden.
Vor einem größeren Merge oder nach Rendering-Änderungen eignet sich
`prompts/REVIEW_WORK.md`.
