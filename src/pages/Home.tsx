import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: products }, { data: cats }] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('visibility', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('categories').select('*').order('name'),
      ]);
      setFeatured((products as Product[]) ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-neutral-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 leading-tight">
              Essentials, refined.
            </h1>
            <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-lg">
              Discover thoughtfully crafted pieces designed to last. Quality materials, timeless design, made for everyday life.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors group"
            >
              Shop the collection
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block opacity-30">
          <div className="h-full w-full bg-gradient-to-l from-neutral-200 to-transparent" />
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On all orders, no minimum' },
              { icon: Shield, title: 'Secure Payment', desc: 'Protected checkout' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '5-day return policy' },
              { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <f.icon size={24} className="text-neutral-700 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{f.title}</h3>
                  <p className="text-xs text-neutral-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-8">Shop by category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="group relative aspect-square bg-neutral-100 rounded-xl overflow-hidden flex items-end p-6 hover:shadow-lg transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent" />
                <h3 className="relative text-lg font-serif font-semibold text-white group-hover:translate-x-1 transition-transform">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-neutral-900">New arrivals</h2>
          <Link to="/shop" className="text-sm font-medium text-neutral-700 hover:text-neutral-900 flex items-center gap-1">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-neutral-200 rounded-lg mb-3" />
                <div className="h-4 bg-neutral-200 rounded mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-neutral-500 text-center py-12">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
