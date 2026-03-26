import { useEffect, useState, useCallback } from 'react'
import { getProducts, createProduct, deleteProduct } from './api'
import FilterBar from './components/FilterBar'
import ProductForm from './components/ProductForm'
import ProductList from './components/ProductList'

export default function App() {
  const [status, setStatus] = useState('idle')
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ page: 1, limit: 10 })
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)

  const loadProducts = useCallback(async (nextFilters = filters) => {
    setStatus('loading')
    setError('')
    try {
      const data = await getProducts(nextFilters)
      setProducts(data.products || [])
      setFilters(nextFilters)
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products')
      setStatus('error')
    } finally {
      setStatus('success')
    }
  }, [filters])

  useEffect(() => {
    loadProducts()
  }, [])

  const handleCreate = async (product) => {
    await createProduct(product)
    loadProducts() // Refresh from your backend
  }

  const handleDelete = async (id) => {
    await deleteProduct(id)
    loadProducts()
  }

  const handleFilterChange = (nextFilters) => {
    loadProducts(nextFilters)
  }

  return (
    <div className="app">
      <h1>Phia Product Catalog</h1>

      <FilterBar filters={filters} onChange={handleFilterChange} />

      <ProductForm onCreate={handleCreate} />

      {status === 'loading' && <div className="loading">Loading products...</div>}
      {status === 'error' && <div className="error">{error}</div>}

      <ProductList products={products} onDelete={handleDelete} />

      {total > 0 && (
        <div className="pagination">
          Page {filters.page} of {Math.ceil(total / filters.limit)}
        </div>
      )}
    </div>
  )
}
