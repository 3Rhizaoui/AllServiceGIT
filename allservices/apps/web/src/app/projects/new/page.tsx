'use client';

import { aiDescribe } from '@/lib/aiDescribe';
import { createProject, type ProjectCategory } from '@/lib/projects-store';
import { useSession } from '@/lib/useSession';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const CATS: { value: ProjectCategory; label: string }[] = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'maconnerie', label: 'Maçonnerie' },
  { value: 'autre', label: 'Autre' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { token, user, loading } = useSession();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('autre');
  const [description, setDescription] = useState('');

  const [scope, setScope] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);

  const [info, setInfo] = useState<string | null>(null);

  const canUse = useMemo(() => !!token && !!user, [token, user]);

  if (!loading && !canUse) {
    // on ne touche pas /account => on redirige simplement
    router.replace('/account');
    return null;
  }

  function applyAi() {
    const s = aiDescribe(description || title);
    setTitle((v) => (v.trim() ? v : s.title));
    setCategory(s.category);
    setDescription(s.description);
    setScope(s.scope);
    setConstraints(s.constraints);
    setQuestions(s.questions);
    setMaterials(s.suggestedMaterials);
    setInfo('Suggestions IA appliquées (V1).');
  }

  function submit() {
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      setInfo('Titre et description requis.');
      return;
    }
    const p = createProject({
      ownerUserId: user.id,
      ownerEmail: user.email,
      title: title.trim(),
      category,
      description: description.trim(),
      scope,
      constraints,
      questions,
      suggestedMaterials: materials,
      city: '',
    });
    router.push(`/projects/${p.id}`);
  }

  const styles = {
    page: { padding: 24, background: '#f8fafc', minHeight: '100vh' },
    card: { maxWidth: 960, margin: '0 auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18 },
    h1: { fontSize: 22, fontWeight: 900, margin: '0 0 12px' },
    label: { fontWeight: 800, fontSize: 13, color: '#334155' },
    input: { width: '100%', padding: 14, borderRadius: 12, border: '1px solid #e5e7eb', marginTop: 8, fontSize: 14, outline: 'none' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btnBlue: { padding: '12px 14px', borderRadius: 12, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontWeight: 900, cursor: 'pointer' as const },
    btnGhost: { padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 900, cursor: 'pointer' as const },
    info: { marginTop: 12, padding: 10, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f8fafc' },
    chips: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 8 },
    chip: { padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 999, background: '#fff', fontWeight: 800, fontSize: 12, color: '#0b1f3a' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.h1}>Créer un projet</div>

        {info ? <div style={styles.info}><b>Info :</b> {info}</div> : null}

        <div style={{ marginTop: 12 }}>
          <div style={styles.label}>Titre</div>
          <input value={title} onChange={(e) => setTitle(e.currentTarget.value)} style={styles.input} placeholder="ex: Rénover salle de bain" />
        </div>

        <div style={{ marginTop: 12, ...styles.row }}>
          <div>
            <div style={styles.label}>Catégorie</div>
            <select value={category} onChange={(e) => setCategory(e.currentTarget.value as any)} style={{ ...styles.input, background: '#fff' }}>
              {CATS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={styles.label}>Ville (optionnel V1)</div>
            <input disabled value="" style={{ ...styles.input, background: '#f8fafc' }} placeholder="à venir" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={styles.label}>Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            style={{ ...styles.input, minHeight: 130, resize: 'vertical' }}
            placeholder="Décris ton besoin..."
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={applyAi} style={styles.btnGhost}>Aide IA (V1)</button>
            <button type="button" onClick={submit} style={styles.btnBlue}>Publier l’appel d’offre</button>
          </div>
        </div>

        {(scope.length || constraints.length || questions.length || materials.length) ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Suggestions IA</div>

            {scope.length ? (
              <>
                <div style={styles.label}>Périmètre</div>
                <div style={styles.chips}>{scope.map((x, i) => <span key={i} style={styles.chip}>{x}</span>)}</div>
              </>
            ) : null}

            {constraints.length ? (
              <>
                <div style={{ ...styles.label, marginTop: 12 }}>Contraintes</div>
                <div style={styles.chips}>{constraints.map((x, i) => <span key={i} style={styles.chip}>{x}</span>)}</div>
              </>
            ) : null}

            {questions.length ? (
              <>
                <div style={{ ...styles.label, marginTop: 12 }}>Questions à poser</div>
                <div style={styles.chips}>{questions.map((x, i) => <span key={i} style={styles.chip}>{x}</span>)}</div>
              </>
            ) : null}

            {materials.length ? (
              <>
                <div style={{ ...styles.label, marginTop: 12 }}>Matériaux suggérés</div>
                <div style={styles.chips}>{materials.map((x, i) => <span key={i} style={styles.chip}>{x}</span>)}</div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
