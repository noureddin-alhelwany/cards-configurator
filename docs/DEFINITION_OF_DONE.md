# Definition of Done

A work item is done only when:

- all acceptance criteria are checked
- implementation matches current architecture decisions
- relevant automated tests exist and pass
- migrations are included when persistence changes
- generated API types are refreshed when the OpenAPI contract changes
- errors are visible and actionable
- no unrelated scope was added
- documentation is updated only where behavior or decisions changed
- verification commands and result are recorded in the work item
- no secrets, databases, uploads or generated production files are committed
- the work-item file and progress tracker show the same final status

Rendering work additionally requires:

- deterministic fixture coverage
- font readiness
- physical page-size assertion
- TrimBox/BleedBox assertion where applicable
- confirmation that browser and production use the same `DesignRenderer`

A manually deferred acceptance criterion means the item is not done; create a
smaller follow-up item only if the original scope is deliberately redefined.
