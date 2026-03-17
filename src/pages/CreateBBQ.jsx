import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import FoodSelector from '../components/FoodSelector'

export default function CreateBBQ() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [allFoods, setAllFoods] = useState([])
  const [selectedFoodIds, setSelectedFoodIds] = useState([])
  const [form, setForm] = useState({
    nome: '',
    creatore_nome: user?.user_metadata?.nome || user?.email?.split('@')[0] || '',
    data: '',
    ora: '',
    luogo: '',
    latitudine: null,
    longitudine: null,
    note: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)

  useEffect(() => {
    loadFoods()
  }, [])

  const loadFoods = async () => {
    const { data } = await supabase.from('cibi_bevande').select('*').order('categoria').order('nome')
    if (data) setAllFoods(data)
  }

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const toggleFood = (id) => {
    setSelectedFoodIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAllInCategory = (categoria) => {
    const categoryIds = allFoods.filter(f => f.categoria === categoria).map(f => f.id)
    const allSelected = categoryIds.every(id => selectedFoodIds.includes(id))
    if (allSelected) {
      setSelectedFoodIds(prev => prev.filter(id => !categoryIds.includes(id)))
    } else {
      setSelectedFoodIds(prev => [...new Set([...prev, ...categoryIds])])
    }
  }

  const geolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata dal browser')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setForm(f => ({ ...f, latitudine: lat, longitudine: lng }))
        // Reverse geocoding
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          if (data.display_name) {
            setForm(f => ({ ...f, luogo: f.luogo || data.display_name }))
          }
        } catch { /* ignore */ }
        setGeoLoading(false)
      },
      (err) => {
        setError('Impossibile ottenere la posizione: ' + err.message)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true }
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

    // Create grigliata
    const { data: grigliata, error: gErr } = await supabase
      .from('grigliate')
      .insert({
        ...form,
        user_id: user.id
      })
      .select()
      .single()

    if (gErr) {
      setError(gErr.message)
      setLoading(false)
      return
    }

    // Insert food associations
    const foodRows = selectedFoodIds.map(cibo_id => ({
      grigliata_id: grigliata.id,
      cibo_id
    }))
    const { error: fErr } = await supabase.from('grigliate_cibi').insert(foodRows)
    if (fErr) {
      setError(fErr.message)
      setLoading(false)
      return
    }

    setCreatedCode(grigliata.codice)
    setLoading(false)
  }

  const shareLink = async () => {
    const url = `${window.location.origin}/partecipa?code=${createdCode}`

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

  if (createdCode) {
    return (
      <main className="page fade-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎉</div>
        <h1 className="page-title">Grigliata Creata!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Condividi questo codice con i tuoi amici
        </p>
        <div className="code-display">
          <span className="code-display-text">{createdCode}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
          <button className="btn btn-primary btn-full" onClick={shareLink}>
            📤 Copia link di partecipazione
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => navigate('/dashboard')}>
            📋 Vai alla Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page page-wide fade-in">
      <h1 className="page-title">🔥 Crea la tua Grigliata</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nome della grigliata</label>
          <input type="text" className="form-input" value={form.nome} onChange={update('nome')} required placeholder="Es: Grigliata di Ferragosto" />
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
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input type="text" className="form-input" value={form.luogo} onChange={update('luogo')} required placeholder="Es: Parco delle Grazie, Padova" style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary" onClick={geolocate} disabled={geoLoading} title="Usa la mia posizione">
              {geoLoading ? '⏳' : '📍'}
            </button>
          </div>
          {form.latitudine && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
              📍 Coordinate: {form.latitudine.toFixed(4)}, {form.longitudine.toFixed(4)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Note (cose da comprare, da fare...)</label>
          <textarea className="form-textarea" value={form.note} onChange={update('note')} placeholder="Es: Portare carbonella, comprare ghiaccio..." />
        </div>

        <div className="form-group">
          <label className="form-label">Cibi e bevande disponibili ({selectedFoodIds.length} selezionati)</label>
          <FoodSelector
            items={allFoods}
            selectedIds={selectedFoodIds}
            onToggle={toggleFood}
            onSelectAll={selectAllInCategory}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: '1rem', fontSize: 'var(--font-size-lg)' }}>
          {loading ? 'Creazione in corso...' : '🔥 Crea Grigliata'}
        </button>
      </form>
    </main>
  )
}
