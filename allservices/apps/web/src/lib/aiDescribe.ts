'use client';

import type { ProjectCategory } from './mockProjects';

export type AiSuggestion = {
  title: string;
  category: ProjectCategory;
  description: string;
  scope: string[];
  constraints: string[];
  questions: string[];
  suggestedMaterials: string[];
};

function pickCategory(text: string): ProjectCategory {
  const t = text.toLowerCase();
  if (/(fuite|robinet|wc|toilet|chauffe|ballon|canalisation|evier|douche|baignoire)/.test(t)) return 'plomberie';
  if (/(prise|tableau|disjonct|cable|lumi|spot|interrup|electric)/.test(t)) return 'electricite';
  if (/(peinture|mur|plafond|enduit|ponc|couleur)/.test(t)) return 'peinture';
  if (/(carrel|faience|joint|sol|plinthe)/.test(t)) return 'carrelage';
  if (/(porte|fenetre|parquet|meuble|placard|bois|menuiser)/.test(t)) return 'menuiserie';
  if (/(mur|beton|dalle|cloison|parpaing|macon|ouverture)/.test(t)) return 'maconnerie';
  return 'autre';
}

function titleFrom(text: string, cat: ProjectCategory): string {
  const base = text.trim().split('\n')[0]?.slice(0, 60) || '';
  if (base.length >= 10) return base;
  const map: Record<ProjectCategory, string> = {
    plomberie: 'Travaux de plomberie',
    electricite: 'Travaux d’électricité',
    peinture: 'Travaux de peinture',
    carrelage: 'Pose / réparation carrelage',
    menuiserie: 'Travaux de menuiserie',
    maconnerie: 'Travaux de maçonnerie',
    autre: 'Travaux / projet',
  };
  return map[cat];
}

export function aiDescribe(raw: string): AiSuggestion {
  const text = raw.trim();
  const category = pickCategory(text);

  const scope: string[] = [];
  const constraints: string[] = [];
  const questions: string[] = [];
  const suggestedMaterials: string[] = [];

  // scope (simples règles)
  if (category === 'peinture') {
    scope.push('Préparation des surfaces (rebouchage, ponçage)');
    scope.push('Protection sols / meubles');
    scope.push('Application sous-couche + 2 couches');
    questions.push('Surface approximative (m²) ? murs / plafonds ?');
    questions.push('Etat des murs : fissures, humidité, ancien papier peint ?');
    suggestedMaterials.push('Bâches + ruban de masquage');
    suggestedMaterials.push('Enduit de rebouchage + abrasifs');
    suggestedMaterials.push('Sous-couche + peinture (quantité selon m²)');
  }

  if (category === 'plomberie') {
    scope.push('Diagnostic fuite / remplacement pièces');
    scope.push('Tests d’étanchéité');
    questions.push('Où est la fuite ? (WC/évier/douche/ballon) et depuis quand ?');
    questions.push('Accès facile aux tuyaux ? photos possibles ?');
    suggestedMaterials.push('Joints / flexibles / raccords (selon diagnostic)');
  }

  if (category === 'electricite') {
    scope.push('Diagnostic + mise en sécurité');
    scope.push('Remplacement / ajout prises, luminaires ou tableau (si besoin)');
    questions.push('Norme souhaitée ? logement ancien ?');
    questions.push('Nombre de points à traiter ? (prises, spots, interrupteurs)');
    suggestedMaterials.push('Gaines / câbles / appareillages (selon besoins)');
  }

  if (/(urgent|rapid|asap|au plus vite)/i.test(text)) constraints.push('Intervention urgente');
  if (/(soir|week|week-end|samedi|dimanche)/i.test(text)) constraints.push('Disponibilités soir / week-end');
  if (/(budget|max|plafond)/i.test(text)) constraints.push('Budget à préciser / à respecter');

  if (scope.length === 0) {
    scope.push('Analyse du besoin et proposition de solution');
    scope.push('Estimation coût & durée');
    questions.push('Adresse / ville et accès (étage, ascenseur) ?');
    questions.push('Photos/vidéo du chantier possibles ?');
  }

  const description = text.length
    ? text
    : 'Décris ici ton besoin (ex: “peindre salon 25m², murs abîmés, dispo week-end”).';

  return {
    title: titleFrom(description, category),
    category,
    description,
    scope,
    constraints,
    questions,
    suggestedMaterials,
  };
}
