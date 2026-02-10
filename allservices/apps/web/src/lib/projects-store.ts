'use client';

/**
 * V1 store “sans backend”
 * - Stockage localStorage
 * - Projets (appel d’offre) + offres des pros
 * - Compatible avec les pages user + pro (imports stables)
 */

export type ProjectCategory =
  | 'renovation'
  | 'plomberie'
  | 'electricite'
  | 'peinture'
  | 'menuiserie'
  | 'jardin'
  | 'autre';

export type ProjectStatus = 'open' | 'assigned' | 'closed';

export type ProjectOffer = {
  id: string;
  projectId: string;
  proEmail: string;
  priceEur: number;
  durationDays: number;
  message?: string;
  createdAt: number; // timestamp ms
};

export type Project = {
  id: string;
  ownerEmail: string;
  title: string;
  category: ProjectCategory;
  description: string;
  city?: string;
  createdAt: number; // timestamp ms
  status: ProjectStatus;

  assignedProEmail?: string;
  acceptedOfferId?: string;

  offers: ProjectOffer[];
};

const LS_KEY = 'allservices.projects.v1';

function now() {
  return Date.now();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toNumber(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOffer(o: any): ProjectOffer {
  return {
    id: String(o?.id || uid('offer')),
    projectId: String(o?.projectId || ''),
    proEmail: String(o?.proEmail || '').toLowerCase(),
    priceEur: toNumber(o?.priceEur, 0),
    durationDays: toNumber(o?.durationDays, 0),
    message: o?.message ? String(o.message) : undefined,
    createdAt: toNumber(o?.createdAt, now()),
  };
}

function normalizeProject(p: any): Project {
  return {
    id: String(p?.id || uid('proj')),
    ownerEmail: String(p?.ownerEmail || '').toLowerCase(),
    title: String(p?.title || ''),
    category: (p?.category as ProjectCategory) || 'autre',
    description: String(p?.description || ''),
    city: p?.city ? String(p.city) : undefined,
    createdAt: toNumber(p?.createdAt, now()),
    status: (p?.status as ProjectStatus) || 'open',
    assignedProEmail: p?.assignedProEmail ? String(p.assignedProEmail).toLowerCase() : undefined,
    acceptedOfferId: p?.acceptedOfferId ? String(p.acceptedOfferId) : undefined,
    offers: Array.isArray(p?.offers) ? p.offers.map(normalizeOffer) : [],
  };
}

function loadAll(): Project[] {
  if (typeof window === 'undefined') return [];
  const data = safeJsonParse<any[]>(localStorage.getItem(LS_KEY), []);
  if (!Array.isArray(data)) return [];
  return data.map(normalizeProject);
}

function saveAll(projects: Project[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

// ---------- Helpers UI ----------
export function labelCategory(cat: ProjectCategory) {
  switch (cat) {
    case 'renovation':
      return 'Rénovation';
    case 'plomberie':
      return 'Plomberie';
    case 'electricite':
      return 'Électricité';
    case 'peinture':
      return 'Peinture';
    case 'menuiserie':
      return 'Menuiserie';
    case 'jardin':
      return 'Jardin';
    default:
      return 'Autre';
  }
}

export function formatEuro(value: number) {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  } catch {
    return `${value} €`;
  }
}

/**
 * IMPORTANT (privacy) :
 * - PAS de seed automatique.
 * Si tu veux un seed pour démo, appelle cette fonction MANUELLEMENT
 * depuis une page de dev, et seulement pour l'email concerné.
 */
export function debugSeedForEmail(ownerEmailForSamples: string) {
  const email = ownerEmailForSamples.trim().toLowerCase();
  if (!email) return;

  const all = loadAll();
  const alreadyHas = all.some((p) => p.ownerEmail === email);
  if (alreadyHas) return;

  const sample: Project[] = [
    {
      id: uid('proj'),
      ownerEmail: email,
      title: 'Pose de parquet (salon 20m²)',
      category: 'renovation',
      description:
        'Je souhaite poser un parquet stratifié dans un salon. Le sol est plat. Merci de proposer un prix + durée.',
      city: 'Massy',
      createdAt: now() - 1000 * 60 * 60 * 24 * 2,
      status: 'open',
      offers: [],
    },
    {
      id: uid('proj'),
      ownerEmail: email,
      title: 'Remplacement robinet cuisine',
      category: 'plomberie',
      description: 'Robinet qui fuit. Remplacement + vérification étanchéité.',
      city: 'Paris',
      createdAt: now() - 1000 * 60 * 60 * 24,
      status: 'open',
      offers: [],
    },
  ];

  saveAll([...sample, ...all]);
}

// ---------- CRUD ----------
export function createProject(input: {
  ownerEmail: string;
  title: string;
  category: ProjectCategory;
  description: string;
  city?: string;
}): Project {
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  if (!ownerEmail) throw new Error('Owner email requis.');
  if (!input.title.trim()) throw new Error('Titre requis.');
  if (!input.description.trim()) throw new Error('Description requise.');

  const projects = loadAll();

  const p: Project = {
    id: uid('proj'),
    ownerEmail,
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    city: input.city?.trim() || undefined,
    createdAt: now(),
    status: 'open',
    offers: [],
  };

  projects.unshift(p);
  saveAll(projects);
  return p;
}

export function listMyProjects(ownerEmail: string): Project[] {
  const email = ownerEmail.trim().toLowerCase();
  const projects = loadAll();
  return projects
    .filter((p) => p.ownerEmail === email)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listOpenProjects(filter?: { category?: ProjectCategory }): Project[] {
  const projects = loadAll();
  const open = projects.filter((p) => p.status === 'open');
  const filtered = filter?.category ? open.filter((p) => p.category === filter.category) : open;
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

// Alias attendu par tes pages
export function getProject(id: string): Project | null {
  return getProjectById(id);
}
export function getProjectById(id: string): Project | null {
  const projects = loadAll();
  return projects.find((p) => p.id === id) ?? null;
}

// Alias attendu par tes pages
export function listOffers(projectId: string): ProjectOffer[] {
  const p = getProjectById(projectId);
  return p?.offers ?? [];
}

// Alias attendu par tes pages (createOffer)
export function createOffer(input: {
  projectId: string;
  proEmail: string;
  priceEur: number;
  durationDays: number;
  message?: string;
}): ProjectOffer {
  return addOffer(input);
}

export function addOffer(input: {
  projectId: string;
  proEmail: string;
  priceEur: number;
  durationDays: number;
  message?: string;
}): ProjectOffer {
  const projects = loadAll();
  const p = projects.find((x) => x.id === input.projectId);
  if (!p) throw new Error('Projet introuvable.');
  if (p.status !== 'open') throw new Error("Ce projet n'accepte plus d'offres.");

  const proEmail = input.proEmail.trim().toLowerCase();
  if (!proEmail) throw new Error('Email pro requis.');

  const offer: ProjectOffer = {
    id: uid('offer'),
    projectId: input.projectId,
    proEmail,
    priceEur: toNumber(input.priceEur, 0),
    durationDays: toNumber(input.durationDays, 0),
    message: input.message?.trim() || undefined,
    createdAt: now(),
  };

  p.offers.unshift(offer);
  saveAll(projects);
  return offer;
}

// Deux signatures supportées (pour éviter tes régressions)
export function acceptOffer(projectId: string, offerId: string): void;
export function acceptOffer(input: { projectId: string; offerId: string; ownerEmail: string }): void;
export function acceptOffer(a: any, b?: any) {
  if (typeof a === 'string') {
    // acceptOffer(projectId, offerId)
    const projectId = a;
    const offerId = String(b || '');
    return acceptOfferInternal({ projectId, offerId });
  }
  // acceptOffer({ projectId, offerId, ownerEmail })
  return acceptOfferInternal(a);
}

function acceptOfferInternal(input: { projectId: string; offerId: string; ownerEmail?: string }) {
  const projects = loadAll();
  const p = projects.find((x) => x.id === input.projectId);
  if (!p) throw new Error('Projet introuvable.');
  if (p.status !== 'open') throw new Error('Projet déjà traité.');

  if (input.ownerEmail) {
    const owner = input.ownerEmail.trim().toLowerCase();
    if (p.ownerEmail !== owner) throw new Error('Accès refusé.');
  }

  const offer = p.offers.find((o) => o.id === input.offerId);
  if (!offer) throw new Error('Offre introuvable.');

  p.status = 'assigned';
  p.assignedProEmail = offer.proEmail;
  p.acceptedOfferId = offer.id;

  saveAll(projects);
}

export function canChat(project: Project, userEmail: string) {
  const e = userEmail.trim().toLowerCase();
  const owner = project.ownerEmail === e;
  const pro = project.assignedProEmail?.toLowerCase() === e;
  return project.status === 'assigned' && (owner || pro);
}
