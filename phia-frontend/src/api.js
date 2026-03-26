import axios from 'axios'

const api = axios.create({ baseURL: '/api' }) // Proxies to :8000

export async function getProducts(filters = {}) {
  const { data } = await api.get('/products', { params: filters })
  console.log(data)
  return data // {products: [], page: 1, limit: 10, total: 50}
}

export async function createProduct(product) {
  const { data } = await api.post('/products', product)
  return data // Returns created product
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`)
  return data // "Deleted"
}
