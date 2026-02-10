'use client';

export type ProjectCategory =
  | 'plomberie'
  | 'electricite'
  | 'peinture'
  | 'carrelage'
  | 'menuiserie'
  | 'maconnerie'
  | 'autre';

export type ProjectStatus = 'open' | 'assigned' | 'closed';

export type Offer = {
  id: string;
  projectId: string;
  proUserId: string;
  proEmail?: string;
  priceEur: number;
  durationDays: number;
  message: string;
  createdAt: string;
};

export type Project = {
  id: string;
  ownerUserId: string;
  ownerEmail?: string;

  title: string;
  category: ProjectCategory;
  city?: string; // optionnel V1
  description: string;

  // champs “IA”
  scope?: string[];
  constraints?: string[];
  questions?: string[];
  suggestedMaterials?: string[];

  // statut / assignation
  status: ProjectStatus;
  assignedProUserId?: string;

  createdAt: string;
  updatedAt: string;
};

const LS_KEY = 'allservices_projects_v1';
const LS_OFFERS_KEY = 'allservices_offers_v1';

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function listProjects(): Project[] {
  return load<Project[]>(LS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getProject(id: string): Project | null {
  return listProjects().find((p) => p.id === id) ?? null;
}

export function upsertProject(p: Project): Project {
  const all = load<Project[]>(LS_KEY, []);
  const i = all.findIndex((x) => x.id === p.id);
  const next = { ...p, updatedAt: new Date().toISOString() };
  if (i >= 0) all[i] = next;
  else all.push(next);
  save(LS_KEY, all);
  return next;
}

export function createProject(input: Omit<Project, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Project {
  const now = new Date().toISOString();
  const p: Project = {
    ...input,
    id: uid('proj'),
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  return upsertProject(p);
}

export function myProjects(ownerUserId: string): Project[] {
  return listProjects().filter((p) => p.ownerUserId === ownerUserId);
}

export function openProjects(): Project[] {
  return listProjects().filter((p) => p.status === 'open');
}

export function listOffers(projectId?: string): Offer[] {
  const all = load<Offer[]>(LS_OFFERS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return projectId ? all.filter((o) => o.projectId === projectId) : all;
}

export function createOffer(input: Omit<Offer, 'id' | 'createdAt'>): Offer {
  const o: Offer = { ...input, id: uid('offer'), createdAt: new Date().toISOString() };
  const all = load<Offer[]>(LS_OFFERS_KEY, []);
  all.push(o);
  save(LS_OFFERS_KEY, all);
  return o;
}

export function acceptOffer(projectId: string, offerId: string): { project: Project; offer: Offer } {
  const p = getProject(projectId);
  if (!p) throw new Error('Project not found');
  const o = listOffers(projectId).find((x) => x.id === offerId);
  if (!o) throw new Error('Offer not found');

  const next = upsertProject({
    ...p,
    status: 'assigned',
    assignedProUserId: o.proUserId,
  });

  return { project: next, offer: o };
}

export function canChat(project: Project, userId: string): boolean {
  if (!project) return false;
  if (project.ownerUserId === userId) return project.status === 'assigned' && !!project.assignedProUserId;
  if (project.assignedProUserId === userId) return project.status === 'assigned';
  return false;
}
