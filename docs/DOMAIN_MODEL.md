# Domain and Persistence Model

## File-backed registries

### Category

- id
- name
- description
- preview asset
- active

### Product

- id
- name
- trim width/height in mm
- bleed in mm
- recommended, warning and minimum DPI
- QR minimum dimensions/module rule
- preview asset
- active

### Template

- schema version
- id and immutable version
- product id
- supported category ids
- fields
- elements
- controlled text and QR zones
- zone-level font references only
- variants
- fonts and static assets
- active

These are validated configuration files, not SQL tables.

## Persisted entities

### Draft

- integer id
- category, product, template and template version
- selected variant
- layout state JSON
- created/updated timestamps

### Asset

- UUID and kind
- original filename and detected MIME type
- SHA-256
- original, preview and render paths
- pixel dimensions
- color mode/profile metadata
- created timestamp

Original files are immutable.

### Order

- UUID and human-readable order number
- optional customer/company display name
- category/product/template identifiers
- product snapshot
- template snapshot
- layout snapshot
- validation snapshot
- preview/mockup/PDF paths
- render-engine version
- approval and creation timestamps

### OrderAsset

- order id
- asset id
- semantic role

### RenderJob

- UUID and order id
- kind
- pending/processing/completed/failed status
- attempts
- stable error code and detailed message
- output path
- timestamps

## Snapshot rule

Finalized orders never resolve their production content from today's live
template files. They use their stored snapshots and referenced immutable assets.

## SQLite baseline

- foreign keys enabled
- WAL journal mode
- normal synchronous mode
- finite busy timeout
- short transactions
- database and asset storage backed up together
