import { useState, useEffect } from 'react'

export default function FilterBar({ filters, onChange }) {
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleSubmit = (e) => {
    e.preventDefault()
    onChange({
      ...localFilters,
      page: 1, // Reset to page 1
      min_price: localFilters.min_price || undefined,
      max_price: localFilters.max_price || undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="filter-bar">
      <input
        placeholder="Category (e.g. dresses)"
        value={localFilters.category || ''}
        onChange={(e) => setLocalFilters({
          ...localFilters,
          category: e.target.value
        })}
      />
      <input
        placeholder="Brand"
        value={localFilters.brand || ''}
        onChange={(e) => setLocalFilters({
          ...localFilters,
          brand: e.target.value
        })}
      />
      <input
        type="number"
        placeholder="Min Price"
        value={localFilters.min_price || ''}
        onChange={(e) => setLocalFilters({
          ...localFilters,
          min_price: e.target.value
        })}
      />
      <button type="submit">Filter</button>
      <button type="button" onClick={() => onChange({ page: 1, limit: 10 })}>
        Clear
      </button>
    </form>
  )
}
