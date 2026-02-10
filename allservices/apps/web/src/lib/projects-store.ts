'use client';

/**
 * V1 store “sans backend”
 * - Stockage localStorage
 * - Projets (appel d’offre) + offres
 * - Données privées côté utilisateur via ownerEmail
 *
 * IMPORTANT:
 * - NE SEED PAS automatiquement (sinon un nouvel utilisateur voit déjà des projets)
 * - Le listing pro voit tous les projets open (logique appel d’offre)
 */

export type ProjectCategory =
  | 'plomberie'
  | 'electricite'
  | 'peinture'
  | 'carrelage'
  | 'menuiserie'
  | 'maconnerie'
  | 'climatisation'
  | 'renovation'
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
  createdAt: number;
};

export type Project = {
  id: string;
  ownerEmail: string;
  title: string;
  category: ProjectCategory;
  description: string;
  city?: string;
  createdAt: number;
  status: ProjectStatus;

  // si assigné
  assignedProEmail?: string;
  acceptedOfferId?: string;

  // IA V1 (front only)
  scope?: string[];
  questions?: string[];
  suggestedMaterials?: string[];

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

function loadAll(): Project[] {
  if (typeof window === 'undefined') return [];
  const data = safeJsonParse<Project[]>(localStorage.getItem(LS_KEY), []);
  return Array.isArray(data) ? data : [];
}

function saveAll(projects: Project[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

// ---------- Helpers UI ----------
export function labelCategory(cat: ProjectCategory) {
  switch (cat) {
    case 'plomberie':
      return 'Plomberie';
    case 'electricite':
      return 'Électricité';
    case 'peinture':
      return 'Peinture';
    case 'carrelage':
      return 'Carrelage';
    case 'menuiserie':
      return 'Menuiserie';
    case 'maconnerie':
      return 'Maçonnerie';
    case 'climatisation':
      return 'Climatisation';
    case 'renovation':
      return 'Rénovation';
    case 'jardin':
      return 'Jardin';
    case 'autre':
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

// ---------- Seed (OPTIONNEL) ----------
/**
 * ⚠️ N’est plus appelée automatiquement.
 * Garde-la seulement pour du dev si tu veux.
 */
export function seedProjectsIfEmpty(_ownerEmailForSamples = 'testuser@gmail.com') {
  // volontairement vide : pas de seed automatique
  return;
}

// ---------- CRUD ----------
export function createProject(input: {
  ownerEmail: string;
  title: string;
  category: ProjectCategory;
  description: string;
  city?: string;
  scope?: string[];
  questions?: string[];
  suggestedMaterials?: string[];
}): Project {
  const projects = loadAll();
  const p: Project = {
    id: uid('proj'),
    ownerEmail: (input.ownerEmail || '').trim().toLowerCase(),
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    city: input.city?.trim() || undefined,
    createdAt: now(),
    status: 'open',
    offers: [],
    scope: input.scope,
    questions: input.questions,
    suggestedMaterials: input.suggestedMaterials,
  };
  projects.unshift(p);
  saveAll(projects);
  return p;
}

export function listMyProjects(ownerEmail: string): Project[] {
  const e = (ownerEmail || '').trim().toLowerCase();
  const projects = loadAll();
  return projects
    .filter((p) => (p.ownerEmail || '').toLowerCase() === e)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listOpenProjects(filter?: { category?: ProjectCategory }): Project[] {
  const projects = loadAll();
  const open = projects.filter((p) => p.status === 'open');
  const out = filter?.category ? open.filter((p) => p.category === filter.category) : open;
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Pro: projets assignés au professionnel (après acceptation par le client).
 * Permet au pro de retrouver l'appel d'offre accepté et d'accéder au chat.
 */
export function listAssignedProjectsForPro(proEmail: string): Project[] {
  const clean = (proEmail || '').trim().toLowerCase();
  if (!clean) return [];
  const projects = loadAll();
  return projects
    .filter((p) => p.status === 'assigned' && (p.assignedProEmail || '').toLowerCase() === clean)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getProjectById(id: string): Project | null {
  const projects = loadAll();
  return projects.find((p) => p.id === id) ?? null;
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

  const offer: ProjectOffer = {
    id: uid('offer'),
    projectId: input.projectId,
    proEmail: (input.proEmail || '').trim().toLowerCase(),
    priceEur: Number(input.priceEur),
    durationDays: Number(input.durationDays),
    message: input.message?.trim() || undefined,
    createdAt: now(),
  };

  p.offers.unshift(offer);
  saveAll(projects);
  return offer;
}

export function acceptOffer(input: { projectId: string; offerId: string; ownerEmail: string }) {
  const projects = loadAll();
  const p = projects.find((x) => x.id === input.projectId);
  if (!p) throw new Error('Projet introuvable.');

  const owner = (p.ownerEmail || '').toLowerCase();
  const caller = (input.ownerEmail || '').toLowerCase();
  if (owner !== caller) throw new Error('Accès refusé.');
  if (p.status !== 'open') throw new Error('Projet déjà traité.');

  const offer = p.offers.find((o) => o.id === input.offerId);
  if (!offer) throw new Error('Offre introuvable.');

  p.status = 'assigned';
  p.assignedProEmail = offer.proEmail;
  p.acceptedOfferId = offer.id;

  saveAll(projects);
}

export function canChat(project: Project, userEmail: string) {
  const e = (userEmail || '').toLowerCase();
  const owner = (project.ownerEmail || '').toLowerCase() === e;
  const pro = (project.assignedProEmail || '').toLowerCase() === e;
  return project.status === 'assigned' && (owner || pro);
}

// ---------------------------------------------------------------------------
// Compat exports (certaines pages anciennes importaient ces noms)
// ---------------------------------------------------------------------------

export const getProject = getProjectById;

export function listOffers(projectId: string): ProjectOffer[] {
  return getProjectById(projectId)?.offers ?? [];
}

export function createOffer(input: {
  projectId: string;
  proUserId?: string; // ignoré en V1
  proEmail: string;
  priceEur: number;
  durationDays: number;
  message?: string;
}) {
  return addOffer({
    projectId: input.projectId,
    proEmail: input.proEmail,
    priceEur: input.priceEur,
    durationDays: input.durationDays,
    message: input.message,
  });
}

export function acceptOfferById(projectId: string, offerId: string, ownerEmail: string) {
  return acceptOffer({ projectId, offerId, ownerEmail });
}

