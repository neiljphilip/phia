import { useState } from 'react'

export default function FilterBar({ filters, onChange }) {
  const [rawInputs, setRawInputs] = useState({
    category: '',
    brand: '',
    min_price: '',
    max_price: ''
  })
  const [validationError, setValidationError] = useState('')

  const parsePrice = (raw) => {
    if (!raw) return undefined
    const cleaned = raw.trim().replace(/^\$/, '').replace(/,/g, '')
    const num = parseFloat(cleaned)
    if (isNaN(num) || num < 0) return null
    return Math.round(num * 100) / 100
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const brand = rawInputs.brand.trim()
    if (brand && !/^[a-zA-Z0-9\s]+$/.test(brand)) {
      setValidationError('Brand must contain only alphanumeric characters.')
      return
    }

    const minPrice = parsePrice(rawInputs.min_price)
    if (minPrice === null) {
      setValidationError('Min Price must be a valid dollar amount (e.g. 29.99, $1,200).')
      return
    }

    const maxPrice = parsePrice(rawInputs.max_price)
    if (maxPrice === null) {
      setValidationError('Max Price must be a valid dollar amount (e.g. 29.99, $1,200).')
      return
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setValidationError('Min Price cannot be greater than Max Price.')
      return
    }

    onChange({
      ...filters,
      category: rawInputs.category.trim() || undefined,
      brand: brand || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      page: 1
    })
  }

  const handleClear = () => {
    setRawInputs({ category: '', brand: '', min_price: '', max_price: '' })
    onChange({ page: 1, limit: 10 })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="filter-bar">
        <input
          placeholder="Category (e.g. dresses)"
          value={rawInputs.category}
          onChange={(e) => setRawInputs({ ...rawInputs, category: e.target.value })}
        />
        <input
          placeholder="Brand"
          value={rawInputs.brand}
          onChange={(e) => setRawInputs({ ...rawInputs, brand: e.target.value })}
        />
        <input
          type="text"
          placeholder="Min Price (e.g. $29.99)"
          value={rawInputs.min_price}
          onChange={(e) => setRawInputs({ ...rawInputs, min_price: e.target.value })}
        />
        <input
          type="text"
          placeholder="Max Price (e.g. $199.99)"
          value={rawInputs.max_price}
          onChange={(e) => setRawInputs({ ...rawInputs, max_price: e.target.value })}
        />
        <button type="submit">Filter</button>
        <button type="button" onClick={handleClear}>
          Clear
        </button>
      </form>

      {validationError && (
        <div className="modal-overlay" onClick={() => setValidationError('')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>{validationError}</p>
            <button onClick={() => setValidationError('')}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
