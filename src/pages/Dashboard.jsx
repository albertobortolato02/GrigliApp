import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import FoodSelector from '../components/FoodSelector'

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

  // Participant edit states
  const [editingParticipant, setEditingParticipant] = useState(null)
  const [selectedFoodIds, setSelectedFoodIds] = useState([])
  const [foodQuantities, setFoodQuantities] = useState({})
  const [savingParticipant, setSavingParticipant] = useState(false)

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

  const handleDeleteParticipant = async (participantId) => {
    if (!window.confirm('Sei sicuro di voler rimuovere questo partecipante dalla grigliata?')) return

    setStatsLoading(true)

    // Per sicurezza, cancelliamo esplicitamente prima le scelte alimentari 
    // nel caso non ci sia ON DELETE CASCADE nel database.
    await supabase.from('partecipanti_scelte').delete().eq('partecipante_id', participantId)
    
    // Cancelliamo il partecipante
    const { error: errPart } = await supabase.from('partecipanti').delete().eq('id', participantId)

    if (errPart) {
      alert('Errore durante la rimozione: ' + errPart.message)
      setStatsLoading(false)
      return
    }

    // Ricarichiamo le statistiche e la lista per aggiornare tutte le quantità totali
    if (viewingStatsId) {
      await loadStats(viewingStatsId)
    }
    await loadGrigliate()
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

  const shareLink = async (codice) => {
    const url = `${window.location.origin}/partecipa?code=${codice}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Partecipa alla mia grigliata! 🔥',
          text: 'Clicca il link per iscriverti alla grigliata e scegliere cosa mangiare:',
          url: url
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Errore condivisione:', err)
        }
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copiato negli appunti! 📋')
    }
  }

  const loadStats = async (grigliataId) => {
    setViewingStatsId(grigliataId)
    setStatsLoading(true)

    // Load participants
    const { data: part } = await supabase
      .from('partecipanti')
      .select('id, nome')
      .eq('grigliata_id', grigliataId)

    // Load food summary
    const { data: foodQuery } = await supabase
      .rpc('get_grigliata_stats', { g_id: grigliataId }) // We don't have this RPC yet, so we'll do JS level aggregation

    // JS level aggregation for food stats
    const { data: scelte } = await supabase
      .from('partecipanti_scelte')
      .select('id, partecipante_id, quantita, cibo_id, cibi_bevande(id, nome, categoria)')
      .in('partecipante_id', part && part.length > 0 ? part.map(p => p.id) : [0])

    const groupedStats = {}
    const scelteByParticipant = {}

    if (scelte) {
      scelte.forEach(s => {
        const cat = s.cibi_bevande.categoria || 'Varie'
        const nome = s.cibi_bevande.nome
        if (!groupedStats[cat]) groupedStats[cat] = {}
        groupedStats[cat][nome] = (groupedStats[cat][nome] || 0) + (s.quantita || 1)

        if (!scelteByParticipant[s.partecipante_id]) {
          scelteByParticipant[s.partecipante_id] = []
        }
        scelteByParticipant[s.partecipante_id].push(s)
      })
    }

    // Load available foods for this grigliata to allow editing
    const { data: foodLinks } = await supabase
      .from('grigliate_cibi')
      .select('cibo_id, cibi_bevande(*)')
      .eq('grigliata_id', grigliataId)
    const availableFoods = foodLinks ? foodLinks.map(fl => fl.cibi_bevande) : []

    setStatsData({ partecipanti: part || [], groupedStats, scelteByParticipant, availableFoods })
    setStatsLoading(false)
  }

  const openParticipantStats = (participant) => {
    setEditingParticipant(participant)
    const pScelte = statsData.scelteByParticipant[participant.id] || []
    setSelectedFoodIds(pScelte.map(s => s.cibo_id))
    
    const qty = {}
    pScelte.forEach(s => {
      qty[s.cibo_id] = s.quantita || 1
    })
    setFoodQuantities(qty)
  }

  const handleSaveParticipant = async () => {
    setSavingParticipant(true)

    // Delete existing choices
    await supabase.from('partecipanti_scelte').delete().eq('partecipante_id', editingParticipant.id)

    // Insert new choices
    if (selectedFoodIds.length > 0) {
      const scelteToInsert = selectedFoodIds.map(cibo_id => ({
        partecipante_id: editingParticipant.id,
        cibo_id,
        quantita: foodQuantities[cibo_id] || 1
      }))
      const { error } = await supabase.from('partecipanti_scelte').insert(scelteToInsert)
      if (error) alert('Errore salvataggio: ' + error.message)
    }

    setSavingParticipant(false)
    setEditingParticipant(null)
    
    await loadStats(viewingStatsId)
  }

  const toggleFood = (id) => {
    setSelectedFoodIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const changeQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setSelectedFoodIds(prev => prev.filter(x => x !== id))
      setFoodQuantities(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } else {
      setFoodQuantities(prev => ({ ...prev, [id]: newQty }))
    }
  }

  const shareStatsAsText = () => {
    if (!statsData || !viewingStatsId) return
    const grill = grigliate.find(g => g.id === viewingStatsId)
    let text = `🔥 *Riepilogo Grigliata: ${grill?.nome}* 🔥\n\n`
    text += `👥 Partecipanti: ${statsData.partecipanti.length}\n\n`
    text += `🛒 *LISTA DELLA SPESA:*\n`

    Object.entries(statsData.groupedStats).forEach(([cat, items]) => {
      text += `\n[ ${cat.toUpperCase()} ]\n`
      Object.entries(items).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
        text += `- ${name}: x${count}\n`
      })
    })

    text += `\nGenerato con GrigliApp 🍖`

    if (navigator.share) {
      navigator.share({
        title: `Riepilogo ${grill?.nome}`,
        text: text
      }).catch(() => {
        navigator.clipboard.writeText(text)
        alert('Riepilogo copiato negli appunti! 📋')
      })
    } else {
      navigator.clipboard.writeText(text)
      alert('Riepilogo copiato negli appunti! 📋')
    }
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

      <div style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <button
          onClick={handleDeleteAccount}
          className="btn btn-outline btn-sm"
          style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)', opacity: 0.7 }}
        >
          ❌ Elimina Profilo & Account
        </button>
      </div>

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
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') { setViewingStatsId(null); setEditingParticipant(null); } }}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setViewingStatsId(null); setEditingParticipant(null); }}>&times;</button>
            
            {editingParticipant ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingParticipant(null)}>← Indietro</button>
                  <h2 className="modal-title" style={{ margin: '0 0 0 var(--space-md)', fontSize: 'var(--font-size-lg)' }}>
                    Scelte di {editingParticipant.nome}
                  </h2>
                </div>

                <div className="form-group" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                  <FoodSelector 
                    items={statsData.availableFoods} 
                    selectedIds={selectedFoodIds} 
                    onToggle={toggleFood} 
                    quantities={foodQuantities}
                    onQuantityChange={changeQuantity}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                  <button className="btn btn-primary btn-full" disabled={savingParticipant} onClick={handleSaveParticipant}>
                    {savingParticipant ? 'Salvataggio...' : '💾 Salva Modifiche'}
                  </button>
                </div>
              </>
            ) : (
              <>
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
                        <div key={p.id} className="participant-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => openParticipantStats(p)}>
                          <span>{p.nome}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteParticipant(p.id) }} 
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--color-danger)', border: 'none', boxShadow: 'none' }}
                            title="Rimuovi partecipante"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', margin: 0 }}>
                      🛒 Cibo & Bevande Richiesti
                    </h3>
                    {Object.keys(statsData.groupedStats).length > 0 && (
                      <button className="btn btn-secondary btn-sm" onClick={shareStatsAsText}>📤 Condividi Lista</button>
                    )}
                  </div>

                  {Object.keys(statsData.groupedStats).length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>Nessuna preferenza registrata.</div>
                  ) : (
                    Object.entries(statsData.groupedStats).map(([cat, foods]) => (
                      <div key={cat} style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 'var(--space-xs)', borderBottom: '1px solid var(--border-color)' }}>
                          {cat}
                        </div>
                        <div className="card" style={{ padding: '0 var(--space-md)' }}>
                          {Object.entries(foods)
                            .sort((a, b) => b[1] - a[1])
                            .map(([food, count]) => (
                              <div key={food} className="food-summary-item">
                                <span>{food}</span>
                                <span className="quantity">x{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
