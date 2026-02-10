"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "./HeroDiscover.module.css";

type ServiceCategory =
  | "plomberie"
  | "electricite"
  | "peinture"
  | "traiteur"
  | "livraison"
  | "menage"
  | "coiffure"
  | "autre";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  plomberie: "Plomberie",
  electricite: "Électricité",
  peinture: "Peinture",
  traiteur: "Traiteur",
  livraison: "Livraison",
  menage: "Ménage",
  coiffure: "Coiffure",
  autre: "Autre",
};

export default function HeroDiscover() {
  const router = useRouter();

  const [category, setCategory] = useState<ServiceCategory>("plomberie");
  const [location, setLocation] = useState<string>("Paris");
  const [date, setDate] = useState<string>("");

  const disabled = useMemo(() => location.trim().length < 2, [location]);

  function onSearch() {
    const params = new URLSearchParams();
    params.set("category", category);
    params.set("location", location.trim());
    if (date) params.set("date", date);

    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        <Image
          src="/hero-artisans-du-monde.png"
          alt="Artisans du Monde"
          fill
          priority
          className={styles.bgImg}
        />
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <div className={styles.badge}>Artisans du Monde</div>

        <h1 className={styles.title}>
          Trouvez un service près de chez vous.
          <span className={styles.titleAccent}> Rapidement.</span>
        </h1>

        <p className={styles.subtitle}>
          Catégorie • Localisation • Date — une expérience simple, comme une réservation.
        </p>

        <div className={styles.searchCard} role="search" aria-label="Recherche de service">
          <div className={styles.pill}>
            <div className={styles.field}>
              <label className={styles.label}>Catégorie</label>
              <select
                className={styles.input}
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              >
                {Object.keys(CATEGORY_LABELS).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABELS[k as ServiceCategory]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.divider} />

            <div className={styles.field}>
              <label className={styles.label}>Localisation</label>
              <input
                className={styles.input}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Paris, 75011, Boulogne…"
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.field}>
              <label className={styles.label}>Date</label>
              <input
                className={styles.input}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button
              className={styles.cta}
              onClick={onSearch}
              disabled={disabled}
              title={disabled ? "Saisis une localisation" : "Rechercher"}
            >
              Rechercher
            </button>
          </div>

          <div className={styles.hints}>
            <span>Exemples :</span>
            <button className={styles.hint} onClick={() => (setCategory("plomberie"), setLocation("Paris"))}>
              Plombier à Paris
            </button>
            <button className={styles.hint} onClick={() => (setCategory("traiteur"), setLocation("Saint-Denis"))}>
              Traiteur à Saint-Denis
            </button>
            <button className={styles.hint} onClick={() => (setCategory("livraison"), setLocation("Nanterre"))}>
              Livraison à Nanterre
            </button>
          </div>
        </div>

        <div className={styles.valueProps}>
          <div className={styles.value}>
            <div className={styles.valueTitle}>Réservation simple</div>
            <div className={styles.valueText}>Choisis un service, une zone, une date.</div>
          </div>
          <div className={styles.value}>
            <div className={styles.valueTitle}>Artisans visibles</div>
            <div className={styles.valueText}>Avis, prix, distance, disponibilité.</div>
          </div>
          <div className={styles.value}>
            <div className={styles.valueTitle}>Paiement sécurisé</div>
            <div className={styles.valueText}>Comme un “checkout”, version service.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
