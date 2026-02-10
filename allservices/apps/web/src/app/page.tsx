"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SERVICES = [
  "Plomberie",
  "Electricite",
  "Menage",
  "Jardinage",
  "Demenagement",
  "Livraison",
  "Peinture",
  "Carrelage",
  "Informatique",
  "Traiteur",
];

export default function HomePage() {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [service, setService] = useState("");

  function onSearch() {
    const params = new URLSearchParams();
    if (address.trim()) params.set("address", address.trim());
    if (date) params.set("date", date);
    if (service) params.set("service", service);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <main className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <div
        style={{
          position: "relative",
          borderRadius: 24,
          minHeight: 520,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%)',
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Right visual block (no public/ image needed) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1.9fr",
            background: 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%)',
          }}
        >
          <div />
          <div
            style={{
              margin: 18,
              borderRadius: 22,
              background:
                "radial-gradient(1000px 600px at 20% 10%, rgba(0,82,204,0.25), transparent 55%), radial-gradient(900px 520px at 85% 35%, rgba(101,84,192,0.22), transparent 55%), linear-gradient(135deg, rgba(9,30,66,0.06), rgba(9,30,66,0.02))",
            }}
          />
        </div>

        {/* Popup card */}
        <section
          className="card"
          style={{
            position: "relative",
            width: "min(420px, calc(100% - 28px))",
            margin: "72px 0 0 56px",
          }}
        >
          <div className="cardPad">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 999,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                fontSize: 12,
                color: "var(--muted)",
                fontWeight: 700,
              }}
            >
              AllServices
            </div>

            <h1 className="h1">Trouvez votre service sur AllServices</h1>
            <p className="pMuted">
              Des professionnels a votre disposition pour satisfaire vos besoins.
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label>Adresse</label>
                <input
                  type="text"
                  placeholder="Ville, code postal, a proximite..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label>Date prevue</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div>
                <label>Service cherche</label>
                <select value={service} onChange={(e) => setService(e.target.value)}>
                  <option value="">Choisir un service...</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btnPrimary" onClick={onSearch}>
                Rechercher
              </button>
            </div>
          </div>
        </section>

        <style jsx>{`
          @media (max-width: 900px) {
            div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }
            section[style*="margin: 72px 0 0 56px"] {
              margin: 18px !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
}
