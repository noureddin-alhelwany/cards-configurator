import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TemplateDefinition } from '../registries/types';
import type { ElementAdjustment } from '../design/types';
import { assetElementForField, clamp, type AssetMetadata } from './selectionHelpers';
import { fieldLabel } from './selectionRules';
import type { DraftLayoutValues } from './selectionFlow';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

type TemplateImageAdjustmentDialogProps = {
  template: TemplateDefinition;
  layoutValues: DraftLayoutValues;
  assetPreviews: Record<string, string>;
  assetDetails: Record<string, AssetMetadata>;
  expandedAssetFieldId: string | null;
  isApproved: boolean;
  onAssetAdjustmentChange: (fieldId: string, adjustment: ElementAdjustment) => Promise<void> | void;
  onAssetAdjustmentReset: (fieldId: string) => Promise<void> | void;
  onClose: () => void;
};

/**
 * Modal editor for an image element's offset and scale.
 *
 * Portalled to `document.body` on purpose: `.selection-panel` sets `backdrop-filter`,
 * which makes it a containing block for `position: fixed`, so an in-tree overlay would
 * be clipped to the panel instead of covering the viewport.
 *
 * Deliberately not a native `<dialog>` — jsdom (used by the test suite) does not
 * implement `showModal()`.
 */
export function TemplateImageAdjustmentDialog({
  template,
  layoutValues,
  assetPreviews,
  assetDetails,
  expandedAssetFieldId,
  isApproved,
  onAssetAdjustmentChange,
  onAssetAdjustmentReset,
  onClose,
}: TemplateImageAdjustmentDialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const field = expandedAssetFieldId
    ? template.fields.find((entry) => entry.id === expandedAssetFieldId) ?? null
    : null;
  const assetElement = field ? assetElementForField(template, field.id) : null;
  const isOpen = Boolean(field && assetElement);

  // Escape closes, and Tab is trapped inside the panel: `aria-modal="true"` promises
  // assistive tech that nothing outside is reachable.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Move focus into the dialog on open and hand it back to the trigger on close.
  useEffect(() => {
    if (!isOpen || !expandedAssetFieldId) {
      return;
    }
    panelRef.current?.focus();
    const triggerHost = document.getElementById(expandedAssetFieldId);
    return () => {
      triggerHost?.querySelector<HTMLElement>('button')?.focus();
    };
  }, [isOpen, expandedAssetFieldId]);

  if (!field || !assetElement) {
    return null;
  }

  const fieldIndex = template.fields.indexOf(field);
  const title = fieldLabel(field, fieldIndex);
  const assetValue = layoutValues.asset_values[field.id] ?? '';
  const assetPreview = assetPreviews[field.id] ?? (assetValue.startsWith('data:') ? assetValue : '');
  const assetDetail = assetDetails[field.id] ?? null;
  const assetAdjustment = layoutValues.element_adjustments[assetElement.id] ?? { offset_x: 0, offset_y: 0, scale: 1 };

  return createPortal(
    <div className="template-image-dialog" role="dialog" aria-modal="true" aria-labelledby="template-image-dialog__title">
      <button type="button" className="template-image-dialog__backdrop" aria-label="Dialog schließen" onClick={onClose} />
      <div className="template-image-dialog__panel" ref={panelRef} tabIndex={-1}>
        <div className="template-image-dialog__header">
          <div>
            <p className="template-image-dialog__eyebrow">Bildbearbeitung</p>
            <h3 id="template-image-dialog__title">{title}</h3>
          </div>
          <button type="button" className="template-field__reset" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className="template-image-dialog__body">
          <div className="template-image-dialog__preview">
            {assetPreview ? <img src={assetPreview} alt={`${title} Vorschau`} /> : null}
          </div>
          <div className="template-image-dialog__controls">
            <label className="template-field__control">
              <span>Verschieben X</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={assetAdjustment.offset_x}
                disabled={isApproved}
                onChange={(event) =>
                  onAssetAdjustmentChange(field.id, {
                    ...assetAdjustment,
                    offset_x: clamp(Number(event.target.value), -1, 1),
                  })
                }
              />
              <output>{assetAdjustment.offset_x.toFixed(2)}</output>
            </label>
            <label className="template-field__control">
              <span>Verschieben Y</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={assetAdjustment.offset_y}
                disabled={isApproved}
                onChange={(event) =>
                  onAssetAdjustmentChange(field.id, {
                    ...assetAdjustment,
                    offset_y: clamp(Number(event.target.value), -1, 1),
                  })
                }
              />
              <output>{assetAdjustment.offset_y.toFixed(2)}</output>
            </label>
            <label className="template-field__control">
              <span>Skalierung</span>
              <input
                type="range"
                min={assetElement.min_scale}
                max={assetElement.max_scale}
                step="0.01"
                value={assetAdjustment.scale}
                disabled={isApproved}
                onChange={(event) =>
                  onAssetAdjustmentChange(field.id, {
                    ...assetAdjustment,
                    scale: clamp(Number(event.target.value), assetElement.min_scale, assetElement.max_scale),
                  })
                }
              />
              <output>{assetAdjustment.scale.toFixed(2)}</output>
            </label>
            {assetDetail ? (
              <p className="template-image-dialog__meta">
                {assetDetail.mime_type}
                {assetDetail.width_px && assetDetail.height_px ? ` · ${assetDetail.width_px} × ${assetDetail.height_px} px` : ''}
              </p>
            ) : null}
          </div>
        </div>
        <div className="template-image-dialog__actions">
          <button type="button" className="wizard-step-nav__button" disabled={isApproved} onClick={() => onAssetAdjustmentReset(field.id)}>
            Zurücksetzen
          </button>
          <button type="button" className="wizard-step-nav__button wizard-step-nav__button--primary" onClick={onClose}>
            Übernehmen
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
