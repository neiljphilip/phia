import { useEffect, useState, useCallback, useRef } from 'react'
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
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef(null)

  const loadProducts = useCallback(async (nextFilters, append = false) => {
    setStatus('loading')
    setError('')
    try {
      const data = await getProducts(nextFilters)
      const newProducts = data.products || []
      setProducts(prev => append ? [...prev, ...newProducts] : newProducts)
      setFilters(nextFilters)
      setTotal(data.total || 0)
      setHasMore(nextFilters.page < Math.ceil((data.total || 0) / nextFilters.limit))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products')
      setStatus('error')
    } finally {
      setStatus('success')
    }
  }, [])

  useEffect(() => {
    loadProducts({ page: 1, limit: 10 })
  }, [])

  // Infinite scroll via IntersectionObserver
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const hasMoreRef = useRef(hasMore)
  hasMoreRef.current = hasMore
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreRef.current && statusRef.current !== 'loading') {
        const nextPage = filtersRef.current.page + 1
        loadProducts({ ...filtersRef.current, page: nextPage }, true)
      }
    }, { threshold: 0.1 })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadProducts])

  const handleCreate = async (product) => {
    await createProduct(product)
    // Reset to page 1 and reload
    setProducts([])
    loadProducts({ ...filters, page: 1 })
  }

  const handleDelete = async (id) => {
    await deleteProduct(id)
    // Reset to page 1 and reload
    setProducts([])
    loadProducts({ ...filters, page: 1 })
  }

  const handleFilterChange = (nextFilters) => {
    setProducts([])
    setHasMore(true)
    loadProducts(nextFilters)
  }

  return (
    <div className="app">
      <h1>Phia Product Catalog</h1>

      <div className="app-layout">
        <aside className="sidebar">
          <FilterBar filters={filters} onChange={handleFilterChange} />
          <ProductForm onCreate={handleCreate} />
        </aside>

        <main className="main-content">
          {status === 'error' && <div className="error">{error}</div>}

          <ProductList products={products} onDelete={handleDelete} />

          {status === 'loading' && <div className="loading">Loading products...</div>}

          <div ref={sentinelRef} className="scroll-sentinel" />

          {!hasMore && products.length > 0 && (
            <div className="end-of-list">All {total} products loaded</div>
          )}
        </main>
      </div>
    </div>
  )
}
