import * as React from 'react';
import {
  useIdentityInstrument,
  useIdentityInstrumentOptions,
  type IdentityInstrumentState,
} from '../identity/useIdentityInstrument';

type Props = {
  state?: IdentityInstrumentState;
};

export function PresenceInstrumentSelector({ state }: Props) {
  const fallbackState = useIdentityInstrument();
  const { instrumentId, instrument, setInstrumentId } = state ?? fallbackState;
  const options = useIdentityInstrumentOptions();

  return (
    <div className="presence-instrument">
      <label className="presence-instrument__label">Instrument</label>
      <div className="presence-instrument__controls">
        <select value={instrumentId} onChange={(event) => setInstrumentId(event.target.value as any)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="presence-instrument__hint">{instrument.description}</p>
      </div>
    </div>
  );
}
