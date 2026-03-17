import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleAuth = async () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <img src="/logo.png" alt="GrigliApp" />
        <span>GrigliApp</span>
      </Link>
      <div className="header-actions">
        {user && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={async () => { await signOut(); navigate('/'); }}
            title="Esci"
          >
            Esci
          </button>
        )}
        <button
          className="header-login-btn"
          onClick={handleAuth}
          title={user ? 'Dashboard' : 'Login'}
        >
          {user ? '📋' : '👤'}
        </button>
      </div>
    </header>
  )
}
