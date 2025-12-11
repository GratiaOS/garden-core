import * as React from 'react';
import {
  IDENTITY_INSTRUMENTS,
  IDENTITY_INSTRUMENT_LIST,
  type IdentityInstrument,
  type InstrumentId,
} from './identityInstruments';

export interface IdentityInstrumentState {
  instrumentId: InstrumentId;
  instrument: IdentityInstrument;
  setInstrumentId: (id: InstrumentId) => void;
}

const DEFAULT_INSTRUMENT: InstrumentId = 'field_listener';

export function useIdentityInstrument(initial: InstrumentId = DEFAULT_INSTRUMENT): IdentityInstrumentState {
  const [instrumentId, setInstrumentId] = React.useState<InstrumentId>(initial);
  const instrument = IDENTITY_INSTRUMENTS[instrumentId];

  return { instrumentId, instrument, setInstrumentId };
}

export function useIdentityInstrumentOptions() {
  return IDENTITY_INSTRUMENT_LIST.map((instrument) => ({
    id: instrument.id,
    label: `${instrument.emoji ?? ''} ${instrument.label}`.trim(),
    tone: instrument.tone,
  }));
}
