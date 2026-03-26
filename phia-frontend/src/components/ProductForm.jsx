import { useState } from 'react'

export default function ProductForm({ onCreate }) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    price: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await onCreate({
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: parseFloat(form.price)
      })
      // Reset form
      setForm({ name: '', brand: '', category: '', price: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h3>Add Product</h3>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        placeholder="Brand"
        value={form.brand}
        onChange={(e) => setForm({ ...form, brand: e.target.value })}
        required
      />
      <input
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <input
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        step="0.01"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={saving}>
        {saving ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  )
}
