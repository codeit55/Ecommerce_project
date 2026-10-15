import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatCurrency, getCategoryName, getProductImage } from '../utils/helpers';
import ProductModal from './ProductModal';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  const imageUrl = getProductImage(product);

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;
    setIsAdding(true);
    await addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 250);
  };

  return (
    <>
      <div className="product-card" onClick={() => setIsQuickViewOpen(true)}>
        <div className="product-card-image-wrap">
          <img
            src={imageUrl}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
          />

          <div className="card-top-badges">
            <span className="badge badge-category">{getCategoryName(product.category)}</span>
            <span
              className={`badge ${
                isOutOfStock
                  ? 'badge-danger'
                  : isLowStock
                  ? 'badge-warning'
                  : 'badge-success'
              }`}
            >
              {isOutOfStock ? 'Sold Out' : isLowStock ? `${product.stock} Left` : 'In Stock'}
            </span>
          </div>

          <button
            type="button"
            className="btn-quick-view"
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickViewOpen(true);
            }}
          >
            Quick View
          </button>
        </div>

        <div className="product-card-body">
          <h3 className="product-card-title" title={product.name}>
            {product.name}
          </h3>

          <p className="product-card-desc">
            {product.description || 'Premium quality crafted with verified standards.'}
          </p>

          <div className="product-card-footer">
            <div className="product-price">{formatCurrency(product.price)}</div>

            <button
              type="button"
              className={`btn btn-primary btn-sm btn-add-cart ${isAdding ? 'loading' : ''}`}
              onClick={handleAdd}
              disabled={isOutOfStock || isAdding}
              aria-label={`Add ${product.name} to cart`}
            >
              {isOutOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {isQuickViewOpen && (
        <ProductModal product={product} onClose={() => setIsQuickViewOpen(false)} />
      )}
    </>
  );
}