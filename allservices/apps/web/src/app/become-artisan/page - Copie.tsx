import Link from 'next/link';

export default function Page() {
  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      <h1>Devenir artisan</h1>
      <p>Crée ton profil, ajoute tes services et reçois des réservations en Île-de-France.</p>
      <ol>
        <li>Créer un compte Artisan</li>
        <li>Configurer zone + services</li>
        <li>Apparaître dans la recherche</li>
      </ol>
      <p>
        <Link href="/signup">Créer un compte artisan</Link>
      </p>
    </div>
  );
}
