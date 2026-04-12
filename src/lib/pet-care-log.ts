import fs from 'fs';
import path from 'path';

export type PetName = 'Theo' | 'Diggy';
export type CareEventType = 'feeding' | 'walk';

export interface PetCareEvent {
  id: string;
  type: CareEventType;
  pets: PetName[];
  timestamp: string;
  note?: string;
  source?: string;
}

interface PetCareLogStore {
  version: number;
  events: PetCareEvent[];
}

export interface PetDailySummary {
  date: string;
  totals: {
    feedings: number;
    walks: number;
  };
  byPet: Record<PetName, {
    feedings: number;
    walks: number;
    lastEventLabel: string | null;
  }>;
  recentEvents: Array<PetCareEvent & { label: string }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_PATH = path.join(DATA_DIR, 'pet-care-log.json');

function ensureStore(): PetCareLogStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(LOG_PATH)) {
    const initial: PetCareLogStore = { version: 1, events: [] };
    fs.writeFileSync(LOG_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) as PetCareLogStore;
    if (!Array.isArray(parsed.events)) throw new Error('Invalid pet care log store');
    return parsed;
  } catch {
    const fallback: PetCareLogStore = { version: 1, events: [] };
    fs.writeFileSync(LOG_PATH, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function saveStore(store: PetCareLogStore) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(store, null, 2));
}

export function listPetCareEvents() {
  return ensureStore().events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function addPetCareEvent(input: {
  type: CareEventType;
  pets: PetName[];
  note?: string;
  source?: string;
  timestamp?: string;
}) {
  const store = ensureStore();
  const event: PetCareEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    pets: Array.from(new Set(input.pets)).filter((pet): pet is PetName => pet === 'Theo' || pet === 'Diggy'),
    timestamp: input.timestamp || new Date().toISOString(),
    note: input.note?.trim() || undefined,
    source: input.source || 'mission-control',
  };

  store.events.unshift(event);
  saveStore(store);
  return event;
}

function eventLabel(event: PetCareEvent) {
  const petLabel = event.pets.length === 2 ? 'Theo + Diggy' : event.pets.join(', ');
  const action = event.type === 'feeding' ? 'fed' : 'walked';
  return `${petLabel} ${action}`;
}

export function getPetCareDailySummary(date = new Date()) : PetDailySummary {
  const isoDate = date.toISOString().slice(0, 10);
  const events = listPetCareEvents().filter((event) => event.timestamp.slice(0, 10) === isoDate);

  const byPet: PetDailySummary['byPet'] = {
    Theo: { feedings: 0, walks: 0, lastEventLabel: null },
    Diggy: { feedings: 0, walks: 0, lastEventLabel: null },
  };

  for (const event of events) {
    for (const pet of event.pets) {
      if (event.type === 'feeding') byPet[pet].feedings += 1;
      if (event.type === 'walk') byPet[pet].walks += 1;
      if (!byPet[pet].lastEventLabel) {
        byPet[pet].lastEventLabel = eventLabel(event);
      }
    }
  }

  return {
    date: isoDate,
    totals: {
      feedings: events.filter((event) => event.type === 'feeding').length,
      walks: events.filter((event) => event.type === 'walk').length,
    },
    byPet,
    recentEvents: events.slice(0, 8).map((event) => ({ ...event, label: eventLabel(event) })),
  };
}
