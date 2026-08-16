import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { SlidersHorizontal, X } from 'lucide-react';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const maxPrice = searchParams.get('maxPrice') ?? '';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('visibility', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      setProducts((prods as Product[]) ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    if (categorySlug) {
      result = result.filter((p) => p.category?.slug === categorySlug);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      result = result.filter((p) => {
        const price = p.sale_price ?? p.price;
        return price <= max;
      });
    }

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [products, query, categorySlug, maxPrice, sort]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFilters = categorySlug || maxPrice || query;

  const renderFilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateParam('category', '')}
            className={`block text-sm w-full text-left transition-colors ${
              !categorySlug ? 'text-neutral-900 font-medium' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateParam('category', c.slug)}
              className={`block text-sm w-full text-left transition-colors ${
                categorySlug === c.slug ? 'text-neutral-900 font-medium' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Max Price</h3>
        <input
          type="range"
          min="0"
          max="10000"
          step="500"
          value={maxPrice ? parseInt(maxPrice) : 10000}
          onChange={(e) => updateParam('maxPrice', e.target.value === '10000' ? '' : e.target.value)}
          className="w-full accent-neutral-900"
        />
        <p className="text-xs text-neutral-500 mt-1">
          {maxPrice ? `Up to ₹${parseInt(maxPrice).toLocaleString()}` : 'Any price'}
        </p>
      </div>

      {activeFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
        >
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-neutral-900">
          {categorySlug
            ? categories.find((c) => c.slug === categorySlug)?.name ?? 'Shop'
            : query
              ? `Results for "${query}"`
              : 'All Products'}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          {renderFilterPanel()}
        </aside>

        <div className="flex-1">
          {/* Sort + mobile filter toggle */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 text-sm font-medium text-neutral-700"
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-neutral-500">Sort:</label>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Mobile filter panel */}
          {showFilters && (
            <div className="md:hidden mb-6 p-4 bg-neutral-50 rounded-lg">
              {renderFilterPanel()}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-200 rounded-lg mb-3" />
                  <div className="h-4 bg-neutral-200 rounded mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-neutral-500 mb-2">No products found.</p>
              {activeFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-neutral-900 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
