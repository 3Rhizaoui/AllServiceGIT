'use client';

export type ProjectCategory =
  | 'renovation'
  | 'plomberie'
  | 'electricite'
  | 'peinture'
  | 'menuiserie'
  | 'autre';

export type ProjectStatus = 'open' | 'assigned' | 'closed';

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export type Project = {
  id: string;
  ownerEmail: string;
  title: string;
  description: string;
  category: ProjectCategory;
  createdAt: string;
  status: ProjectStatus;
  assignedOfferId?: string;
};

export type Offer = {
  id: string;
  projectId: string;
  proEmail: string;
  price: number;
  durationDays: number;
  message?: string;
  createdAt: string;
  status: OfferStatus;
};

export type ChatMessage = {
  id: string;
  projectId: string;
  fromEmail: string;
  text: string;
  createdAt: string;
};

const KEY = 'allservices_projects_v1';
const OFFER_KEY = 'allservices_offers_v1';
const CHAT_KEY = 'allservices_chat_v1';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// -------- Projects --------
export function listProjects(): Project[] {
  return readJSON<Project[]>(KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listProjectsByOwner(ownerEmail: string): Project[] {
  return listProjects().filter((p) => p.ownerEmail === ownerEmail);
}

export function listOpenProjects(category?: ProjectCategory): Project[] {
  return listProjects().filter((p) => p.status === 'open' && (!category || p.category === category));
}

export function getProject(id: string): Project | null {
  return listProjects().find((p) => p.id === id) ?? null;
}

export function createProject(input: Omit<Project, 'id' | 'createdAt' | 'status'>): Project {
  const all = listProjects();
  const p: Project = {
    id: uid('prj'),
    createdAt: new Date().toISOString(),
    status: 'open',
    ...input,
  };
  all.push(p);
  writeJSON(KEY, all);
  return p;
}

export function setProjectStatus(id: string, patch: Partial<Project>) {
  const all = listProjects();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch };
  writeJSON(KEY, all);
}

// -------- Offers --------
export function listOffers(): Offer[] {
  return readJSON<Offer[]>(OFFER_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listOffersByProject(projectId: string): Offer[] {
  return listOffers().filter((o) => o.projectId === projectId);
}

export function createOffer(input: Omit<Offer, 'id' | 'createdAt' | 'status'>): Offer {
  const all = listOffers();
  const o: Offer = {
    id: uid('off'),
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...input,
  };
  all.push(o);
  writeJSON(OFFER_KEY, all);
  return o;
}

export function acceptOffer(projectId: string, offerId: string) {
  // set accepted offer + reject others
  const offers = listOffers();
  const nextOffers = offers.map((o) => {
    if (o.projectId !== projectId) return o;
    if (o.id === offerId) return { ...o, status: 'accepted' as const };
    return { ...o, status: 'rejected' as const };
  });
  writeJSON(OFFER_KEY, nextOffers);

  // mark project assigned
  setProjectStatus(projectId, { status: 'assigned', assignedOfferId: offerId });
}

// -------- Chat --------
export function listChat(projectId: string): ChatMessage[] {
  const all = readJSON<ChatMessage[]>(CHAT_KEY, []);
  return all.filter((m) => m.projectId === projectId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function sendChat(projectId: string, fromEmail: string, text: string): ChatMessage {
  const all = readJSON<ChatMessage[]>(CHAT_KEY, []);
  const msg: ChatMessage = {
    id: uid('msg'),
    projectId,
    fromEmail,
    text,
    createdAt: new Date().toISOString(),
  };
  all.push(msg);
  writeJSON(CHAT_KEY, all);
  return msg;
}
