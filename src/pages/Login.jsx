import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', nome: '', cognome: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(form.email, form.password)
    if (error) setError(error.message)
    else navigate('/dashboard')
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (!form.nome || !form.cognome) {
      setError('Inserisci nome e cognome'); setLoading(false); return
    }
    const { error } = await signUp(form.email, form.password, form.nome, form.cognome)
    if (error) setError(error.message)
    else {
      setSuccess('Account creato con successo! Accesso in corso...')
      setTimeout(() => navigate('/dashboard'), 1500)
    }
    setLoading(false)
  }

  return (
    <main className="page fade-in">
      <h1 className="page-title" style={{ textAlign: 'center' }}>
        {tab === 'login' ? '👤 Accedi' : '✍️ Crea Account'}
      </h1>

      <div className="tabs">
        <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>Accedi</button>
        <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>Registrati</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {tab === 'login' && (
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={update('email')} required placeholder="la-tua@email.it" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={form.password} onChange={update('password')} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      )}

      {tab === 'register' && (
        <form onSubmit={handleRegister}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input type="text" className="form-input" value={form.nome} onChange={update('nome')} required placeholder="Mario" />
            </div>
            <div className="form-group">
              <label className="form-label">Cognome</label>
              <input type="text" className="form-input" value={form.cognome} onChange={update('cognome')} required placeholder="Rossi" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={update('email')} required placeholder="la-tua@email.it" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={form.password} onChange={update('password')} required minLength={6} placeholder="Minimo 6 caratteri" />
          </div>
          <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
            {loading ? 'Registrazione...' : 'Crea Account'}
          </button>
        </form>
      )}
    </main>
  )
}
