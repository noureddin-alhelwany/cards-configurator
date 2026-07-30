import type { ReactNode } from 'react';
import './StateMessage.css';

export type StateMessageTone = 'loading' | 'empty' | 'error';

type StateMessageProps = {
  tone: StateMessageTone;
  kicker: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function StateMessage({ tone, kicker, title, description, action }: StateMessageProps) {
  return (
    <section className={`state-message state-message--${tone}`} aria-live={tone === 'loading' ? 'polite' : undefined}>
      <p className="state-message__kicker">{kicker}</p>
      <h1 className="state-message__title">{title}</h1>
      {description ? <p className="state-message__description">{description}</p> : null}
      {action ? <div className="state-message__action">{action}</div> : null}
    </section>
  );
}
