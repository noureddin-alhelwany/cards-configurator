# Implementation Order

## Milestone 0 — Technical proof

1. TECH-01 Repository bootstrap
2. TECH-02 Configuration registries and schema validation
3. TECH-03 Shared renderer proof
4. TECH-04 PDF rendering and box validation

Exit: one hard-coded fixture renders consistently in browser and PDF.

## Milestone 1 — First vertical product slice

Recommended sequence:

1. US-01 category
2. US-02 product
3. US-03 template list
4. US-04 template selection
5. US-06 controlled text zones
6. US-07 text
7. US-08 URL/QR
8. US-09 logo upload
9. US-16 live preview
10. US-18 required validation
11. US-19 text fit validation
12. US-21 QR size
13. US-22 approval
14. US-23 order creation
15. US-24 production PDF
16. US-27 reopen order

Exit: one product/template can be configured, approved, saved, rendered and
reopened.

## Milestone 2 — Image workflow

1. US-10 image upload
2. US-11 image preparation
3. US-20 image quality
4. US-12 image movement
5. US-13 image zoom

## Milestone 3 — Controlled editor completion

1. US-14 logo adjustment
2. US-15 reset
3. US-05 layout variants

## Milestone 4 — Operations and polish

1. US-26 order list
2. US-28 autosave
3. US-25 rendering retry
4. US-17 mockup
5. expand to three to six templates

## Selection rule

Prefer the first unblocked item in this order. Do not parallelize by default.
Parallel work is justified only when branches are independent and integration
cost remains low.
