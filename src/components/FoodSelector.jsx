import { useState, useCallback } from 'react'

const CATEGORY_ICONS = {
  'Carne': '🥩',
  'Bevande': '🥤',
  'Alcolici': '🍺',
  'Contorni': '🥗',
  'Formaggi': '🧀',
  'Salse': '🫙',
  'Dolci': '🍰'
}

const CATEGORY_ORDER = ['Carne', 'Bevande', 'Alcolici', 'Contorni', 'Formaggi', 'Salse', 'Dolci']

// Fun messages per category/action
const FUN_MESSAGES = {
  Alcolici: [
    { text: 'Vacci piano!', emoji: '😅' },
    { text: 'Ubriaco già prima di arrivare!', emoji: '🤪' },
    { text: 'Occorre qualcuno che ti riporti a casa?', emoji: '🚗' },
    { text: 'Fate subito guidare quest\'uomo!', emoji: '🚨' },
    { text: 'La tua fegato ha mandato una lettera di protesta', emoji: '📩' },
    { text: 'Ma sicuro sicuro?', emoji: '🤔' },
    { text: 'Il suocero tifa contro di te stasera...', emoji: '😬' },
    { text: 'Cheers! 🍻', emoji: '🥂' },
  ],
  CarneAlta: [
    { text: 'Lasciane un po\' anche a noi!', emoji: '😭' },
    { text: 'Facciamo una griglia solo per te!', emoji: '🔥' },
    { text: 'Questa è roba da carnivori seriali!', emoji: '🦁' },
    { text: 'Il manzo ti manda i ringraziamenti...', emoji: '🐄' },
    { text: 'Stai ordinando per un esercito!', emoji: '⚔️' },
    { text: 'Avviso al grigliatore: portare rinforzi!', emoji: '📢' },
    { text: 'Chi ti ferma più?!', emoji: '💪' },
  ],
  Dolci: [
    { text: 'Dopo tanta carne, una dolce ricompensa!', emoji: '😋' },
    { text: 'Già pensi al dessert, ottimo!', emoji: '🎉' },
  ],
  Formaggi: [
    { text: 'Buon gusto, l\'hai preso dal produttore!', emoji: '🧀' },
    { text: 'Cacio e pepe nella prossima vita?', emoji: '😇' },
  ],
  Contorni: [
    { text: 'Bravo, mangia anche le verdure!', emoji: '🥦' },
    { text: 'Così la mamma è contenta!', emoji: '💚' },
  ],
}

let toastIdCounter = 0

function getRandomMessage(categoryKey) {
  const pool = FUN_MESSAGES[categoryKey]
  if (!pool) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function FoodSelector({ items, selectedIds, onToggle, readOnly = false, quantities = {}, onQuantityChange = null, onSelectAll = null }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg) => {
    if (!msg) return
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, ...msg }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const handleToggle = (itemId, category) => {
    const wasSelected = selectedIds.includes(itemId)
    onToggle(itemId)
    // Only show message when selecting (not deselecting)
    if (!wasSelected) {
      // Alcolici: always. Carne: 40% chance. Others: 40% chance.
      const chance = category === 'Alcolici' ? 1 : category === 'Carne' ? 0.40 : 0.40
      if (Math.random() < chance) {
        const msg = getRandomMessage(category)
        if (msg) showToast(msg)
      }
    }
  }

  const handleQuantityChange = (itemId, newQty, category) => {
    onQuantityChange(itemId, newQty)
    // For Carne: always show when hitting qty 4, then every 2 increments above
    if (category === 'Carne' && newQty >= 4 && (newQty === 4 || newQty % 2 === 0)) {
      const msg = getRandomMessage('CarneAlta')
      if (msg) showToast(msg)
    }
  }

  // Group items by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catItems = items.filter(i => i.categoria === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="food-selector" style={{ position: 'relative' }}>

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: 'var(--bg-card, #1e1e2e)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              maxWidth: '240px',
              animation: 'toastIn 0.3s ease',
              fontSize: '0.85rem',
              color: 'var(--text-primary, #fff)',
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{toast.emoji}</span>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(30px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} className="category-section">
          <div className="category-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="category-icon">{CATEGORY_ICONS[category]}</span>
              {category}
            </div>
            {onSelectAll && !readOnly && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onSelectAll(category)}
                style={{ fontSize: 'var(--font-size-xs)', padding: '4px 8px' }}
              >
                {catItems.every(i => selectedIds.includes(i.id)) ? '⨯ Deseleziona' : '✓ Seleziona Tutto'}
              </button>
            )}
          </div>
          <div className="food-grid">
            {catItems.map(item => {
              const isSelected = selectedIds.includes(item.id)
              const showQty = isSelected && category === 'Carne' && onQuantityChange && !readOnly
              return (
                <div
                  key={item.id}
                  className={`food-chip ${isSelected ? 'selected' : ''} ${showQty ? 'has-qty' : ''}`}
                  onClick={(e) => {
                    if (!readOnly && e.target.tagName !== 'BUTTON') {
                      handleToggle(item.id, category)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && !readOnly && handleToggle(item.id, category)}
                >
                  <div className="food-chip-name">{item.nome}</div>
                  {showQty && (
                    <div className="food-chip-qty" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => handleQuantityChange(item.id, Math.max(0, (quantities[item.id] || 1) - 1), category)}>-</button>
                      <span>{quantities[item.id] || 1}</span>
                      <button type="button" onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1, category)}>+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
