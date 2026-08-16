import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { Loader2, AlertCircle, ArrowLeft, Plus, Trash2, X } from 'lucide-react';

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string;
  stock: string;
  category_id: string;
  visibility: boolean;
  status: string;
  images: string[];
}

const emptyForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  sale_price: '',
  stock: '0',
  category_id: '',
  visibility: true,
  status: 'active',
  images: [],
};

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      setCategories(cats ?? []);

      if (isEdit && id) {
        const { data, error: err } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (err || !data) {
          setError('Product not found.');
          setLoading(false);
          return;
        }

        setForm({
          name: data.name,
          slug: data.slug,
          description: data.description ?? '',
          price: data.price.toString(),
          sale_price: data.sale_price?.toString() ?? '',
          stock: data.stock.toString(),
          category_id: data.category_id ?? '',
          visibility: data.visibility,
          status: data.status,
          images: data.images ?? [],
        });
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm({ ...form, [target.name]: value });
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (url && !form.images.includes(url)) {
      setForm({ ...form, images: [...form.images, url] });
      setImageInput('');
    }
  };

  const removeImage = (url: string) => {
    setForm({ ...form, images: form.images.filter((i) => i !== url) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!form.price || parseFloat(form.price) < 0) {
      setError('Enter a valid price.');
      return;
    }

    setSaving(true);

    const slug = form.slug.trim() || slugify(form.name);
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock: parseInt(form.stock) || 0,
      category_id: form.category_id || null,
      visibility: form.visibility,
      status: form.status,
      images: form.images,
    };

    if (isEdit && id) {
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('products').insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    navigate('/admin/products');
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-4">
        <ArrowLeft size={16} /> Back to products
      </Link>

      <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-6">
        {isEdit ? 'Edit Product' : 'Add Product'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Product Name *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Slug</label>
          <input
            type="text"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder={form.name ? slugify(form.name) : 'auto-generated'}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <p className="text-xs text-neutral-500 mt-1">Leave blank to auto-generate from name.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Price (₹) *</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Sale Price (₹)</label>
            <input
              type="number"
              name="sale_price"
              value={form.sale_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Product Images</label>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <button
              type="button"
              onClick={addImage}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 flex items-center gap-1"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {form.images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                name="visibility"
                checked={form.visibility}
                onChange={handleChange}
                className="w-4 h-4 accent-neutral-900"
              />
              Visible to customers
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Update product' : 'Create product'}
          </button>
          <Link
            to="/admin/products"
            className="px-6 py-2.5 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
