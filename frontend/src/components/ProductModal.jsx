import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatCurrency, getCategoryName, getProductImage } from '../utils/helpers';
import { CloseIcon } from './Icons';

export default function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const maxStock = product.stock || 0;
  const imageUrl = getProductImage(product);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, qty);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-product-details" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>

        <div className="product-modal-grid">
          <div className="product-modal-image-box">
            <img src={imageUrl} alt={product.name} className="product-modal-img" />
          </div>

          <div className="product-modal-info">
            <div className="product-modal-badge-row">
              <span className="badge badge-category">{getCategoryName(product.category)}</span>
              <span
                className={`badge ${
                  isOutOfStock
                    ? 'badge-danger'
                    : maxStock < 10
                    ? 'badge-warning'
                    : 'badge-success'
                }`}
              >
                {isOutOfStock
                  ? 'Out of Stock'
                  : maxStock < 10
                  ? `Only ${maxStock} left`
                  : `${maxStock} In Stock`}
              </span>
            </div>

            <h2 className="product-modal-title">{product.name}</h2>
            <div className="product-modal-price">{formatCurrency(product.price)}</div>

            <p className="product-modal-desc">
              {product.description ||
                'High-performance quality product with rigorous craftsmanship. Verified authentic and eligible for quick shipping.'}
            </p>

            <div className="product-modal-actions">
              <div className="quantity-selector">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  disabled={qty <= 1 || isOutOfStock}
                >
                  −
                </button>
                <span className="qty-value">{qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((prev) => (maxStock > 0 ? Math.min(maxStock, prev + 1) : prev + 1))}
                  disabled={qty >= maxStock || isOutOfStock}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-add-modal"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
