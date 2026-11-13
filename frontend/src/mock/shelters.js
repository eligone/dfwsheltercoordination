// Mock data only, with no backend. Numbers are made up.
// Fields follow FR-33 (dogs housed, available kennels, total capacity) and FR-35 (contact, last update).

export const shelters = [
  { id: 'rich', name: 'Richardson Animal Shelter', city: 'Richardson', distanceMi: 0, dogsHoused: 58, totalCapacity: 60, address: '1330 Columbia Dr, Richardson, TX', phone: '(972) 555-0101', email: 'staff@richardson.example', lastUpdated: '2026-11-04 08:15', sizes: ['small', 'medium', 'large'] },
  { id: 'dal', name: 'Dallas Animal Services', city: 'Dallas', distanceMi: 14.2, dogsHoused: 310, totalCapacity: 320, address: '1818 N Westmoreland Rd, Dallas, TX', phone: '(214) 555-0102', email: 'staff@dallas.example', lastUpdated: '2026-11-04 07:40', sizes: ['small', 'medium', 'large'] },
  { id: 'collin', name: 'Collin County Animal Services', city: 'McKinney', distanceMi: 19.5, dogsHoused: 70, totalCapacity: 110, address: '4750 Community Ave, McKinney, TX', phone: '(972) 555-0103', email: 'staff@collin.example', lastUpdated: '2026-11-03 17:05', sizes: ['small', 'medium', 'large'] },
  { id: 'plano', name: 'Plano Animal Services', city: 'Plano', distanceMi: 6.1, dogsHoused: 84, totalCapacity: 100, address: '4028 W Plano Pkwy, Plano, TX', phone: '(972) 555-0104', email: 'staff@plano.example', lastUpdated: '2026-11-04 09:30', sizes: ['small', 'medium'] },
  { id: 'irving', name: 'Irving Animal Care Campus', city: 'Irving', distanceMi: 17.8, dogsHoused: 41, totalCapacity: 90, address: '4140 Valley View Ln, Irving, TX', phone: '(972) 555-0105', email: 'staff@irving.example', lastUpdated: '2026-11-02 10:00', sizes: ['small', 'medium', 'large'] },
  { id: 'carr', name: 'Carrollton Animal Services & Adoption Center', city: 'Carrollton', distanceMi: 11.3, dogsHoused: 55, totalCapacity: 75, address: '1225 Kirby Rd, Carrollton, TX', phone: '(972) 555-0106', email: 'staff@carrollton.example', lastUpdated: '2026-11-04 06:50', sizes: ['small', 'medium', 'large'] },
];

/** 'open' | 'near' | 'full' from occupancy (near = 85%+). */
export function capacityStatus(dogsHoused, totalCapacity) {
  const pct = dogsHoused / totalCapacity;
  if (pct >= 1) return 'full';
  if (pct >= 0.85) return 'near';
  return 'open';
}

export const statusLabel = { open: 'Open', near: 'Near Full', full: 'Full', outdated: 'Outdated' };

export const availableKennels = (s) => s.totalCapacity - s.dogsHoused;

// The shelter the signed-in user works at.
export const myShelterId = 'rich';
