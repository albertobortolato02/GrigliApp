import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [grigliate, setGrigliate] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  
  // Modal states
  const [viewingStatsId, setViewingStatsId] = useState(null)
  const [statsData, setStatsData] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    loadGrigliate()
  }, [])

  const loadGrigliate = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('grigliate')
      .select('*, partecipanti(count)')
      .eq('user_id', user.id)
      .order('data', { ascending: true })
    
    if (err) setError(err.message)
    else setGrigliate(data || [])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    const { error: err } = await supabase.from('grigliate').delete().eq('id', id)
    if (err) alert('Errore eliminazione: ' + err.message)
    else setGrigliate(prev => prev.filter(g => g.id !== id))
    setDeleteId(null)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('🚨 ATTENZIONE: Sei sicuro di voler eliminare DEFINITIVAMENTE il tuo account e tutte le tue grigliate? Nessuno potrà più visualizzarle.')) return
    
    // Call the RPC we created
    const { error: err } = await supabase.rpc('delete_user')
    if (err) {
      alert('Errore durante l\'eliminazione account: ' + err.message)
    } else {
      await supabase.auth.signOut()
    }
  }

  const shareLink = (codice) => {
    const url = `${window.location.origin}/partecipa?code=${codice}`
    navigator.clipboard.writeText(url)
    alert('Link copiato negli appunti! 📋')
  }

  const loadStats = async (grigliataId) => {
    setViewingStatsId(grigliataId)
    setStatsLoading(true)
    
    // Load participants
    const { data: part } = await supabase
      .from('partecipanti')
      .select('id, nome, cognome')
      .eq('grigliata_id', grigliataId)
      
    // Load food summary
    const { data: foodQuery } = await supabase
      .rpc('get_grigliata_stats', { g_id: grigliataId }) // We don't have this RPC yet, so we'll do JS level aggregation
    
    // JS level aggregation for food stats
    const { data: scelte } = await supabase
      .from('partecipanti_scelte')
      .select('quantita, cibi_bevande(nome, categoria)')
      .in('partecipante_id', part ? part.map(p => p.id) : [])
      
    const foodCounts = {}
    if (scelte) {
       scelte.forEach(s => {
         const nome = s.cibi_bevande.nome
         foodCounts[nome] = (foodCounts[nome] || 0) + (s.quantita || 1)
       })
    }

    setStatsData({ partecipanti: part || [], foodCounts })
    setStatsLoading(false)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('it-IT')
  }

  return (
    <main className="page page-wide fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>📋 Le mie Grigliate</h1>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <Link to="/crea" className="btn btn-primary btn-sm">➕ Nuova</Link>
          <button onClick={handleDeleteAccount} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}>❌ Elimina Profilo</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner"></div>
      ) : grigliate.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍖</div>
          <div className="empty-state-text">Non hai ancora organizzato nessuna grigliata!</div>
          <Link to="/crea" className="btn btn-primary">Creane una ora</Link>
        </div>
      ) : (
        grigliate.map(g => (
          <div key={g.id} className="grigliata-card">
            <div className="grigliata-card-header">
              <div className="grigliata-card-title">{g.nome}</div>
              <div className="grigliata-card-code" title="Codice univoco di partecipazione">
                {g.codice}
              </div>
            </div>
            
            <div className="grigliata-card-info">
              <span>📅 {formatDate(g.data)} {g.ora}</span>
              <span>📍 {g.luogo}</span>
              <span>👥 {g.partecipanti[0].count} iscritti</span>
            </div>

            <div className="grigliata-card-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => shareLink(g.codice)}>📤 Condividi</button>
              <button className="btn btn-accent btn-sm" onClick={() => loadStats(g.id)}>📊 Riepilogo & Partecipanti</button>
              <Link to={`/modifica/${g.id}`} className="btn btn-secondary btn-sm">✏️ Modifica</Link>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(g.id)}>🗑️ Elimina</button>
            </div>
          </div>
        ))
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setDeleteId(null) }}>
          <div className="modal-content">
            <h2 className="modal-title">Elimina Grigliata</h2>
            <p style={{ marginBottom: 'var(--space-lg)' }}>Sei sicuro di voler eliminare questa grigliata? Questa azione non può essere annullata e cancellerà anche tutti gli iscritti.</p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary btn-full" onClick={() => setDeleteId(null)}>Annulla</button>
              <button className="btn btn-danger btn-full" onClick={() => handleDelete(deleteId)}>🗑️ Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats and Participants Modal */}
      {viewingStatsId && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setViewingStatsId(null) }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setViewingStatsId(null)}>&times;</button>
            <h2 className="modal-title">Riepilogo Grigliata</h2>
            
            {statsLoading ? (
              <div className="spinner"></div>
            ) : statsData && (
              <>
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-sm)', color: 'var(--color-secondary)' }}>
                    👥 Partecipanti ({statsData.partecipanti.length})
                  </h3>
                  {statsData.partecipanti.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>Nessun iscritto ancora.</div>
                  ) : (
                    <div className="card" style={{ padding: 0 }}>
                      {statsData.partecipanti.map(p => (
                        <div key={p.id} className="participant-item">
                          {p.nome} {p.cognome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>
                    🛒 Cibo & Bevande Richiesti
                  </h3>
                  {Object.keys(statsData.foodCounts).length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>Nessuna preferenza registrata.</div>
                  ) : (
                    <div className="card" style={{ padding: '0 var(--space-md)' }}>
                      {Object.entries(statsData.foodCounts)
                        .sort((a,b) => b[1] - a[1])
                        .map(([food, count]) => (
                        <div key={food} className="food-summary-item">
                          <span>{food}</span>
                          <span className="quantity">x{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
