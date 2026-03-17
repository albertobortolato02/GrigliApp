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

export default function FoodSelector({ items, selectedIds, onToggle, readOnly = false, quantities = {}, onQuantityChange = null, onSelectAll = null }) {
  // Group items by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catItems = items.filter(i => i.categoria === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="food-selector">
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
                      onToggle(item.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && !readOnly && onToggle(item.id)}
                >
                  <div className="food-chip-name">{item.nome}</div>
                  {showQty && (
                    <div className="food-chip-qty" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => onQuantityChange(item.id, Math.max(0, (quantities[item.id] || 1) - 1))}>-</button>
                      <span>{quantities[item.id] || 1}</span>
                      <button type="button" onClick={() => onQuantityChange(item.id, (quantities[item.id] || 1) + 1)}>+</button>
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
