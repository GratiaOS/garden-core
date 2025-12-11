import {
  useIdentityInstrument,
  useIdentityInstrumentOptions,
  type IdentityInstrumentState,
} from '../identity/useIdentityInstrument';
import type { InstrumentId } from '../identity/identityInstruments';

type Props = {
  state?: IdentityInstrumentState;
};

export function PresenceInstrumentSelector({ state }: Props) {
  const fallbackState = useIdentityInstrument();
  const { instrumentId, instrument, setInstrumentId } = state ?? fallbackState;
  const options = useIdentityInstrumentOptions();

  const selectId = 'presence-instrument-select';

  return (
    <div className="presence-instrument">
      <label className="presence-instrument__label" htmlFor={selectId}>
        Instrument
      </label>
      <div className="presence-instrument__controls">
        <select
          id={selectId}
          value={instrumentId}
          onChange={(event) => setInstrumentId(event.target.value as InstrumentId)}
        >
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
