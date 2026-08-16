import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { formatPrice, getEffectivePrice } from '@/lib/utils';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('products').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchProducts();
  };

  const toggleVisibility = async (product: Product) => {
    await supabase.from('products').update({ visibility: !product.visibility }).eq('id', product.id);
    fetchProducts();
  };

  const filtered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-serif font-bold text-neutral-900">Products</h1>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-500 mb-4">No products found.</p>
          <Link
            to="/admin/products/new"
            className="text-sm font-medium text-neutral-900 underline"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-neutral-700">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-700 hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-700">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-700 hidden sm:table-cell">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-700">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="font-medium text-neutral-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {formatPrice(getEffectivePrice(product))}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell">{product.stock}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleVisibility(product)}
                        className="flex items-center gap-1 text-xs font-medium"
                      >
                        {product.visibility ? (
                          <span className="flex items-center gap-1 text-green-600"><Eye size={14} /> Visible</span>
                        ) : (
                          <span className="flex items-center gap-1 text-neutral-400"><EyeOff size={14} /> Hidden</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product?"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
