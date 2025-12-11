export type InstrumentId =
  | 'field_listener'
  | 'explorer'
  | 'builder'
  | 'soft_human'
  | 'dj_field';

export type ToneTag = 'calm' | 'electric' | 'focused' | 'warm' | 'playful';
export type LengthTag = 'short' | 'medium' | 'long';
export type OutputLevel = 'low' | 'medium' | 'high';

export interface IdentityInstrument {
  id: InstrumentId;
  label: string;
  shortLabel?: string;
  emoji?: string;
  description: string;
  tone: ToneTag;
  typicalLength: LengthTag;
  outputLevel: OutputLevel;
  contextExamples: string[];
  beforeRitual: string;
  afterRitual: string;
  defaultPrompt?: string;
}

export const IDENTITY_INSTRUMENTS: Record<InstrumentId, IdentityInstrument> = {
  field_listener: {
    id: 'field_listener',
    label: 'Field Listener',
    shortLabel: 'Listener',
    emoji: '🫂',
    description: 'Stai cu spațiul fără să repari nimic. Ascultă în tăcere, reflectă blând.',
    tone: 'calm',
    typicalLength: 'short',
    outputLevel: 'low',
    contextExamples: ['Check-in-uri cu S/N', 'Firecircle 1:1', 'Note voice personale'],
    beforeRitual: 'Un ciclu de respirație mai lung. Notează în corp: “Nu repar, doar ascult.”',
    afterRitual: 'Rezumi într-o propoziție ce ai auzit și lași spațiu: “Sună ca și cum…”',
    defaultPrompt: 'Ce se simte chiar acum în corp?'
  },
  explorer: {
    id: 'explorer',
    label: 'Explorer Metafizic',
    shortLabel: 'Explorer',
    emoji: '🌀',
    description: 'Lucrezi cu layere, sincronicități, pattern-uri. Întrebări mari fără verdict imediat.',
    tone: 'electric',
    typicalLength: 'long',
    outputLevel: 'high',
    contextExamples: ['Layer maps', 'Numbers / clock reading', 'Visuri + memorie'],
    beforeRitual: 'Scrii un titlu mic: “Azi întreb despre…” ca să creezi container.',
    afterRitual: 'Închizi cu un takeaway la pământ: “Din tot, iau doar…”',
    defaultPrompt: 'Ce îmi arată câmpul dincolo de 3D fără să cer verdict?'
  },
  builder: {
    id: 'builder',
    label: 'Builder / Craft Mode',
    shortLabel: 'Builder',
    emoji: '🛠️',
    description: 'Scrii cod, design, docs. Tai task-uri mici și le duci până la capăt.',
    tone: 'focused',
    typicalLength: 'medium',
    outputLevel: 'high',
    contextExamples: ['Garden Stack dev', 'Shopify Presence Node', 'Docs / changelog'],
    beforeRitual: 'Întrebi: “Care este One True Next de 20–40min?” și îl notezi.',
    afterRitual: 'Închei cu un whisper / commit și iei o pauză scurtă.',
    defaultPrompt: 'Care e următorul pas mic și concret pe care îl pot termina azi?'
  },
  soft_human: {
    id: 'soft_human',
    label: 'Soft Human Raz',
    shortLabel: 'Soft',
    emoji: '🌱',
    description: 'Partener, tată, vecin. Spui adevărul blând, fără jargon, cu limite clare.',
    tone: 'warm',
    typicalLength: 'short',
    outputLevel: 'medium',
    contextExamples: ['Mesaje către V sau C', 'Talk-uri practice (bani, casă)', 'Interacțiuni în sat'],
    beforeRitual: 'Inhale–exhale scurt. Întrebi: “Ce adevăr mic pot spune simplu?”',
    afterRitual: 'Verifici în corp dacă e nevoie de softening: “E ok și dacă…”',
    defaultPrompt: 'Cum spun asta simplu, onest, fără promisiuni pe care nu le pot ține?'
  },
  dj_field: {
    id: 'dj_field',
    label: 'DJ of the Field',
    shortLabel: 'DJ Field',
    emoji: '🎚️',
    description: 'Conduci energia unui grup ca un DJ. Crești vibe-ul cu gesturi mici.',
    tone: 'playful',
    typicalLength: 'medium',
    outputLevel: 'medium',
    contextExamples: ['Fam jam', 'Firecircle calls', 'Spații unde ții vibe-ul pentru mai mulți'],
    beforeRitual: 'Intenție: “Azi cresc energia cu 2%, nu trebuie să rup tot.” Asculți camera 10 secunde.',
    afterRitual: 'Întrebi: “Care a fost momentul cel mai viu pt noi?” și lași grupul să pună markerul.',
    defaultPrompt: 'Care e următorul gest mic (melodie, pauză, întrebare) care ridică vibrația cu 2%?'
  }
};

export const IDENTITY_INSTRUMENT_LIST: IdentityInstrument[] = Object.values(IDENTITY_INSTRUMENTS);
