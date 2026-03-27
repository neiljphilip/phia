export default function ProductList({ products, onDelete }) {
  if (!products?.length) {
    return <div className="empty">No products match your filters</div>
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product._id} className="product-card">
          <h4>{product.name}</h4>
          <div className="product-meta">
            <div>Brand: {product.brand}</div>
            {product.category && <div>Category: {product.category}</div>}
            <div>Price: ${product.price}</div>
            {product.image && <img src={product.image} alt={product.name} />}
          </div>
          <button
            onClick={() => onDelete(product._id)}
            className="delete-btn"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
