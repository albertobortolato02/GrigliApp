import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import FoodSelector from '../components/FoodSelector'

export default function JoinBBQ() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [grigliata, setGrigliata] = useState(null)
  const [availableFoods, setAvailableFoods] = useState([])
  const [selectedFoodIds, setSelectedFoodIds] = useState([])
  const [foodQuantities, setFoodQuantities] = useState({})
  const [form, setForm] = useState({ nome: '' })
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('code')) {
      searchGrigliata(searchParams.get('code'))
    }
  }, [])

  const searchGrigliata = async (searchCode) => {
    // Generate lower case search code since DB md5 hash is lowercase
    const c = (searchCode || code).toLowerCase().trim()
    if (!c) return
    setSearching(true); setError('')

    const { data, error: err } = await supabase
      .from('grigliate')
      .select('*')
      .eq('codice', c)
      .single()

    if (err || !data) {
      setError('Grigliata non trovata. Controlla il codice!')
      setSearching(false)
      return
    }

    setGrigliata(data)

    // Load available foods for this grigliata
    const { data: foodLinks } = await supabase
      .from('grigliate_cibi')
      .select('cibo_id, cibi_bevande(*)')
      .eq('grigliata_id', data.id)

    if (foodLinks) {
      setAvailableFoods(foodLinks.map(fl => fl.cibi_bevande))
    }
    setSearching(false)
  }

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    // Create participant
    const { data: partecipante, error: pErr } = await supabase
      .from('partecipanti')
      .insert({
        grigliata_id: grigliata.id,
        nome: form.nome
      })
      .select()
      .single()

    if (pErr) {
      setError(pErr.message)
      setLoading(false)
      return
    }

    // Insert food choices
    if (selectedFoodIds.length > 0) {
      const scelte = selectedFoodIds.map(cibo_id => ({
        partecipante_id: partecipante.id,
        cibo_id,
        quantita: foodQuantities[cibo_id] || 1
      }))
      const { error: sErr } = await supabase.from('partecipanti_scelte').insert(scelte)
      if (sErr) {
        setError(sErr.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const addToCalendar = () => {
    const startDate = new Date(`${grigliata.data}T${grigliata.ora}`)
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000) // +4 hours

    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GrigliApp//IT',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(startDate)}`,
      `DTEND:${fmt(endDate)}`,
      `SUMMARY:🔥 ${grigliata.nome}`,
      `DESCRIPTION:Grigliata organizzata da ${grigliata.creatore_nome}${grigliata.note ? '\\n' + grigliata.note : ''}`,
      `LOCATION:${grigliata.luogo}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${grigliata.nome.replace(/\s+/g, '_')}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  const openMaps = () => {
    let url
    if (grigliata.latitudine && grigliata.longitudine) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${grigliata.latitudine},${grigliata.longitudine}`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(grigliata.luogo)}`
    }
    window.open(url, '_blank')
  }

  if (success) {
    return (
      <main className="page fade-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>✅</div>
        <h1 className="page-title">Iscrizione Completata!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Sei iscritto a <strong>{grigliata.nome}</strong>!
        </p>

        <div className="card" style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
          <p><strong>📅</strong> {formatDate(grigliata.data)} alle {grigliata.ora}</p>
          <p><strong>📍</strong> {grigliata.luogo}</p>
          <p><strong>👨‍🍳</strong> Organizzata da {grigliata.creatore_nome}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <button className="btn btn-primary btn-full" onClick={addToCalendar}>
            📅 Aggiungi al Calendario
          </button>
          <button className="btn btn-accent btn-full" onClick={openMaps}>
            🗺️ Portami lì
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page page-wide fade-in">
      <h1 className="page-title">🍖 Partecipa alla Grigliata</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {!grigliata ? (
        <div>
          <div className="form-group">
            <label className="form-label">Inserisci il codice della grigliata</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                type="text"
                className="form-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Es: A3F2K9"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 'var(--font-size-2xl)', letterSpacing: '0.2em', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>
          </div>
          <button
            className="btn btn-primary btn-full"
            onClick={() => searchGrigliata()}
            disabled={searching || code.length < 1}
          >
            {searching ? 'Ricerca...' : '🔍 Cerca Grigliata'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Grigliata Info */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
              🔥 {grigliata.nome}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
              <span><strong>📅</strong> {formatDate(grigliata.data)} alle {grigliata.ora}</span>
              <span><strong>📍</strong> {grigliata.luogo}</span>
              <span><strong>👨‍🍳</strong> Organizzata da {grigliata.creatore_nome}</span>
              {grigliata.note && <span><strong>📝</strong> {grigliata.note}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tuo Nome</label>
              <input type="text" className="form-input" value={form.nome} onChange={update('nome')} required placeholder="Pino" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cosa vuoi mangiare e bere? ({selectedFoodIds.length} selezionati)</label>
            <FoodSelector 
              items={availableFoods} 
              selectedIds={selectedFoodIds} 
              onToggle={toggleFood} 
              quantities={foodQuantities}
              onQuantityChange={changeQuantity}
            />
          </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: '1rem', fontSize: 'var(--font-size-lg)' }}>
              {loading ? 'Iscrizione...' : '🍖 Mi iscrivo!'}
            </button>
        </form>
      )}
    </main>
  )
}
