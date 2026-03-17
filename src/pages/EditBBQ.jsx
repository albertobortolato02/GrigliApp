import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import FoodSelector from '../components/FoodSelector'

export default function EditBBQ() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [allFoods, setAllFoods] = useState([])
  const [selectedFoodIds, setSelectedFoodIds] = useState([])
  const [form, setForm] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setInitLoading(true)
    
    // Load Grigliata
    const { data: grig, error: gErr } = await supabase
      .from('grigliate')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Security check
      .single()
      
    if (gErr || !grig) {
      setError('Grigliata non trovata o non hai i permessi.')
      setInitLoading(false)
      return
    }
    setForm(grig)

    // Load available foods
    const { data: foods } = await supabase.from('cibi_bevande').select('*').order('categoria').order('nome')
    if (foods) setAllFoods(foods)

    // Load selected foods
    const { data: selFoods } = await supabase
      .from('grigliate_cibi')
      .select('cibo_id')
      .eq('grigliata_id', id)
      
    if (selFoods) {
      setSelectedFoodIds(selFoods.map(sf => sf.cibo_id))
    }
    
    setInitLoading(false)
  }

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const toggleFood = (id) => {
    setSelectedFoodIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    if (selectedFoodIds.length === 0) {
      setError('Seleziona almeno un cibo o bevanda!')
      setLoading(false)
      return
    }

    // Update grigliata info
    const { error: updErr } = await supabase
      .from('grigliate')
      .update({
        nome: form.nome,
        creatore_nome: form.creatore_nome,
        data: form.data,
        ora: form.ora,
        luogo: form.luogo,
        latitudine: form.latitudine,
        longitudine: form.longitudine,
        note: form.note
      })
      .eq('id', id)

    if (updErr) {
      setError(updErr.message)
      setLoading(false)
      return
    }

    // Sync foods mapping (delete all current, then insert new)
    await supabase.from('grigliate_cibi').delete().eq('grigliata_id', id)
    
    const foodRows = selectedFoodIds.map(cibo_id => ({ grigliata_id: id, cibo_id }))
    const { error: fErr } = await supabase.from('grigliate_cibi').insert(foodRows)
    
    if (fErr) {
      setError("Errore durante l'aggiornamento dei cibi: " + fErr.message)
      setLoading(false)
      return
    }

    alert('Grigliata aggiornata con successo! ✅')
    navigate('/dashboard')
  }

  if (initLoading) return <div className="spinner" style={{ marginTop: '20vh' }}></div>
  
  if (!form) return (
    <main className="page fade-in">
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Torna alla dashboard</button>
    </main>
  )

  return (
    <main className="page page-wide fade-in">
      <h1 className="page-title">✏️ Modifica Grigliata</h1>
      
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nome della grigliata</label>
          <input type="text" className="form-input" value={form.nome} onChange={update('nome')} required />
        </div>

        <div className="form-group">
          <label className="form-label">Il tuo nome</label>
          <input type="text" className="form-input" value={form.creatore_nome} onChange={update('creatore_nome')} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data</label>
            <input type="date" className="form-input" value={form.data} onChange={update('data')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Ora</label>
            <input type="time" className="form-input" value={form.ora} onChange={update('ora')} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Luogo</label>
          <input type="text" className="form-input" value={form.luogo} onChange={update('luogo')} required />
          {form.latitudine && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
              📍 Coordinate lette: {form.latitudine.toFixed(4)}, {form.longitudine.toFixed(4)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Note</label>
          <textarea className="form-textarea" value={form.note || ''} onChange={update('note')} />
        </div>

        <div className="form-group">
          <label className="form-label">Cibi e bevande disponibili ({selectedFoodIds.length} selezionati)</label>
          <FoodSelector items={allFoods} selectedIds={selectedFoodIds} onToggle={toggleFood} />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
          <button type="button" className="btn btn-secondary btn-full" onClick={() => navigate('/dashboard')}>
            Annulla
          </button>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </form>
    </main>
  )
}
