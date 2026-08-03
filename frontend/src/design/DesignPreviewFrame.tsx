import type { CSSProperties } from 'react';
import DesignRenderer from './DesignRenderer';
import type { ProofFixture, ValidationIssue } from './types';
import './DesignPreviewFrame.css';

type PreviewOverlay = {
  src: string;
  alt: string;
  opacity: number;
  testId?: string;
};

type Props = {
  fixture: ProofFixture;
  className?: string;
  style?: CSSProperties;
  overlay?: PreviewOverlay | null;
  validationIssues?: ValidationIssue[];
  showGuides?: boolean;
};

export default function DesignPreviewFrame({ fixture, className, style, overlay, validationIssues, showGuides }: Props) {
  return (
    <div className={['design-preview-frame', className].filter(Boolean).join(' ')} style={style}>
      <DesignRenderer fixture={fixture} validationIssues={validationIssues} showGuides={showGuides} />
      {overlay ? (
        <img
          className="design-preview-frame__overlay"
          data-testid={overlay.testId}
          src={overlay.src}
          alt={overlay.alt}
          style={{ opacity: overlay.opacity }}
        />
      ) : null}
    </div>
  );
}
