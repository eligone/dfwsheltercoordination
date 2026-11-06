// Shared helpers for Anais's wireframes (UC-5, UC-6, UC-7). Not a wireframe itself.
import { shelters, myShelterId, availableKennels, capacityStatus } from '../../mock/shelters';
import { dogs } from '../../mock/dogs';

// "Now" for every frame, so the Outdated status (no update in 24h) is stable.
const NOW = new Date('2026-11-04T10:00:00');
const isOutdated = (s) => NOW - new Date(s.lastUpdated.replace(' ', 'T')) > 24 * 60 * 60 * 1000;

export const shelterStatus = (s) => (isOutdated(s) ? 'outdated' : capacityStatus(s.dogsHoused, s.totalCapacity));

// The dog being matched in every frame: large, high-risk, no transfer yet.
export const matchDog = dogs.find((d) => d.id === 'D-1051');

// UC-6: other shelters that take the dog's size and have an open kennel, nearest first.
export function findMatches(dog, maxMiles) {
  return shelters
    .filter((s) => s.id !== myShelterId && s.sizes.includes(dog.size) && availableKennels(s) > 0 && s.distanceMi <= maxMiles)
    .sort((a, b) => a.distanceMi - b.distanceMi);
}
