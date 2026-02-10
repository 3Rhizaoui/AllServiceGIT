'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './SearchBar.module.css';

const DEFAULT_CATEGORIES = [
  { slug: 'plomberie', name: 'Plomberie' },
  { slug: 'electricite', name: 'Électricité' },
  { slug: 'serrurerie', name: 'Serrurerie' },
  { slug: 'peinture', name: 'Peinture' },
];

export function SearchBar({ initialCategory }: { initialCategory?: string }) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory || 'plomberie');
  const [postal, setPostal] = useState('75001');

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = `/search?category=${encodeURIComponent(category)}&postal=${encodeURIComponent(postal)}&radius_km=10`;
    router.push(url);
  };

  return (
    <form className={styles.form} onSubmit={onSearch}>
      <div className={styles.row}>
        <label className={styles.label}>
          Métier
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Code postal
          <input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="75001" />
        </label>
        <button className={styles.btn} type="submit">
          Rechercher
        </button>
      </div>
      <p className={styles.hint}>Astuce: sur /search, tu peux activer la géolocalisation pour trier par distance.</p>
    </form>
  );
}
