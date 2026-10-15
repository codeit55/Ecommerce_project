import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productsApi } from '../api/api';
import { SearchIcon, TruckIcon, ShieldCheckIcon, RefreshIcon, ArrowRightIcon } from '../components/Icons';

const CATEGORIES = [
  { id: '', name: 'All Categories' },
  { id: '1', name: 'Electronics' },
  { id: '2', name: 'Fashion' },
  { id: '3', name: 'Home & Kitchen' },
  { id: '4', name: 'Audio & Wearables' },
  { id: '5', name: 'Books & Stationery' },
];

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest Arrivals' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || '-created_at';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local filter states
  const [searchInput, setSearchInput] = useState(searchParam);
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await productsApi.getProducts({
        search: searchParam,
        category: categoryParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
        ordering: sortParam,
      });

      const list = Array.isArray(data) ? data : data?.results || data?.value || [];
      setProducts(list);
    } catch (err) {
      setError(err.message || 'Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchParam, categoryParam, sortParam, minPriceParam, maxPriceParam]);

  const updateParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        updated.set(key, val);
      } else {
        updated.delete(key);
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const handleCategorySelect = (catId) => {
    updateParams({ category: catId });
  };

  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value });
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    updateParams({ min_price: minPriceInput, max_price: maxPriceInput });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    searchParam || categoryParam || minPriceParam || maxPriceParam || sortParam !== '-created_at'
  );

  const activeCategoryName = CATEGORIES.find((c) => c.id === categoryParam)?.name;

  return (
    <div className="products-page-container">
      {/* Refined Modern Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <span className="hero-pill">Handcrafted Essentials & Everyday Tech</span>
          <h1 className="hero-title">Curated Quality for Your Daily Lifestyle</h1>
          <p className="hero-subtitle">
            Explore authentic electronics, contemporary apparel, and home essentials with verified satisfaction.
          </p>

          <div className="hero-features-row">
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <TruckIcon />
              </div>
              <div>
                <strong>Express Delivery</strong>
                <p>Fast dispatch on verified orders</p>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <ShieldCheckIcon />
              </div>
              <div>
                <strong>Authentic Guarantee</strong>
                <p>100% genuine verified products</p>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <RefreshIcon />
              </div>
              <div>
                <strong>7-Day Returns</strong>
                <p>Hassle-free replacement policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Filters + Grid */}
      <div className="catalog-layout">
        {/* Filter Controls Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-clear-filters"
                onClick={handleResetFilters}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search box inside filter panel */}
          <form onSubmit={handleSearchSubmit} className="filter-group">
            <label className="filter-label" htmlFor="filter-search">
              Keyword Search
            </label>
            <div className="input-search-wrapper">
              <input
                id="filter-search"
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="filter-input"
              />
              <button type="submit" className="btn-search-icon" aria-label="Search">
                <SearchIcon />
              </button>
            </div>
          </form>

          {/* Category Chips */}
          <div className="filter-group">
            <span className="filter-label">Categories</span>
            <div className="category-chips-list">
              {CATEGORIES.map((cat) => {
                const isSelected = categoryParam === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    <span className="chip-name">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <form onSubmit={handlePriceApply} className="filter-group">
            <span className="filter-label">Price Range (₹)</span>
            <div className="price-inputs-row">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="filter-input filter-input-sm"
              />
              <span className="price-dash">–</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="filter-input filter-input-sm"
              />
            </div>
            <button type="submit" className="btn btn-outline btn-sm btn-full mt-2">
              Apply Price
            </button>
          </form>
        </aside>

        {/* Product Grid Area */}
        <main className="catalog-main">
          {/* Top Bar: Results Count + Sort Selector */}
          <div className="catalog-top-bar">
            <div className="results-count">
              {loading ? (
                <span>Loading products...</span>
              ) : (
                <span>
                  Showing <strong>{products.length}</strong> {products.length === 1 ? 'item' : 'items'}
                  {activeCategoryName && ` in ${activeCategoryName}`}
                </span>
              )}
            </div>

            <div className="sort-selector-wrapper">
              <label htmlFor="sort-dropdown">Sort by:</label>
              <select
                id="sort-dropdown"
                value={sortParam}
                onChange={handleSortChange}
                className="sort-select"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="catalog-error-box">
              <p className="error-message">{error}</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={fetchProducts}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="products-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="product-skeleton-card">
                  <div className="skeleton-image skeleton-pulse" />
                  <div className="skeleton-text skeleton-pulse" style={{ width: '70%' }} />
                  <div className="skeleton-text skeleton-pulse" style={{ width: '40%' }} />
                  <div className="skeleton-text skeleton-pulse" style={{ width: '50%' }} />
                </div>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="catalog-empty-state">
              <div className="empty-icon-wrap">
                <SearchIcon className="empty-svg" />
              </div>
              <h3>No products found</h3>
              <p>Try searching for a different keyword or resetting your category filter.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}