'use client';

export type ProTrade =
  | 'plomberie'
  | 'electricite'
  | 'renovation'
  | 'peinture'
  | 'menuiserie'
  | 'jardin'
  | 'autre';

export type ProProfile = {
  id: string;
  name: string;
  email: string;
  trade: ProTrade;
  city: string;
  sector: string; // ex: "Île-de-France"
  available: boolean;
  rating: number; // 0..5
  jobsDone: number;
};

const SAMPLE_PROS: ProProfile[] = [
  { id: 'pro_1', name: 'Plombier Express', email: 'pro.plombier@demo.com', trade: 'plomberie', city: 'Paris', sector: 'Île-de-France', available: true, rating: 4.6, jobsDone: 128 },
  { id: 'pro_2', name: 'Elec Pro', email: 'pro.elec@demo.com', trade: 'electricite', city: 'Massy', sector: 'Île-de-France', available: false, rating: 4.3, jobsDone: 74 },
  { id: 'pro_3', name: 'Rénovation & Co', email: 'pro.reno@demo.com', trade: 'renovation', city: 'Versailles', sector: 'Île-de-France', available: true, rating: 4.8, jobsDone: 210 },
  { id: 'pro_4', name: 'Peinture Top', email: 'pro.peinture@demo.com', trade: 'peinture', city: 'Créteil', sector: 'Île-de-France', available: true, rating: 4.1, jobsDone: 52 },
];

export function listPros(filter?: { trade?: ProTrade; city?: string; availableOnly?: boolean; q?: string }) {
  const q = (filter?.q || '').trim().toLowerCase();
  const city = (filter?.city || '').trim().toLowerCase();

  return SAMPLE_PROS.filter((p) => {
    if (filter?.trade && p.trade !== filter.trade) return false;
    if (filter?.availableOnly && !p.available) return false;
    if (city && p.city.toLowerCase() !== city) return false;
    if (q) {
      const hay = `${p.name} ${p.email} ${p.trade} ${p.city} ${p.sector}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function labelTrade(t: ProTrade) {
  switch (t) {
    case 'plomberie': return 'Plomberie';
    case 'electricite': return 'Électricité';
    case 'renovation': return 'Rénovation';
    case 'peinture': return 'Peinture';
    case 'menuiserie': return 'Menuiserie';
    case 'jardin': return 'Jardin';
    default: return 'Autre';
  }
}
