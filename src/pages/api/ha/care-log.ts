import type { NextApiRequest, NextApiResponse } from 'next';
import { addPetCareEvent, getPetCareDailySummary, listPetCareEvents, type CareEventType, type PetName } from '../../../lib/pet-care-log';

const ALLOWED_TYPES: CareEventType[] = ['feeding', 'walk'];
const ALLOWED_PETS: PetName[] = ['Theo', 'Diggy'];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const events = listPetCareEvents();
    return res.status(200).json({
      summary: getPetCareDailySummary(),
      recentEvents: events.slice(0, 20),
    });
  }

  if (req.method === 'POST') {
    const type = req.body?.type as CareEventType | undefined;
    const pets = Array.isArray(req.body?.pets) ? req.body.pets : [];
    const note = typeof req.body?.note === 'string' ? req.body.note : undefined;
    const source = typeof req.body?.source === 'string' ? req.body.source : undefined;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use feeding or walk.' });
    }

    const normalizedPets = pets.filter((pet: unknown): pet is PetName => typeof pet === 'string' && ALLOWED_PETS.includes(pet as PetName));
    if (normalizedPets.length === 0) {
      return res.status(400).json({ error: 'At least one valid pet is required.' });
    }

    const event = addPetCareEvent({ type, pets: normalizedPets, note, source });
    return res.status(201).json({
      event,
      summary: getPetCareDailySummary(),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
