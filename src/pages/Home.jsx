import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="page fade-in" style={{ textAlign: 'center' }}>
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <img
          src="/logo.png"
          alt="GrigliApp — Maiale che beve birra davanti alla griglia"
          style={{
            width: '180px',
            height: '180px',
            margin: '0 auto',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(232, 99, 43, 0.3)',
            objectFit: 'cover'
          }}
        />
      </div>

      <h1 style={{
        fontSize: 'var(--font-size-4xl)',
        fontWeight: 800,
        marginBottom: 'var(--space-sm)',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        GrigliApp
      </h1>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-lg)',
        marginBottom: 'var(--space-2xl)',
        maxWidth: '320px',
        margin: '0 auto var(--space-2xl)'
      }}>
        Organizza e partecipa alle grigliate in modo semplice e veloce! 🔥
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: '320px', margin: '0 auto' }}>
        <Link to="/crea" className="btn btn-primary btn-full" style={{ padding: '1rem', fontSize: 'var(--font-size-lg)' }}>
          🔥 Crea la tua Grigliata
        </Link>

        <Link to="/partecipa" className="btn btn-secondary btn-full" style={{ padding: '1rem', fontSize: 'var(--font-size-lg)' }}>
          🍖 Partecipa
        </Link>
      </div>

      <div style={{
        marginTop: 'var(--space-2xl)',
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-xl)',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-sm)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>📍</div>
          Geolocalizzato
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>📅</div>
          Al calendario
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>📤</div>
          Condividi
        </div>
      </div>
    </main>
  )
}
