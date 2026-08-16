import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { formatPrice, getEffectivePrice } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import { ChevronLeft, Minus, Plus, ShoppingBag, Check, Truck, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (err) {
        setError('Failed to load product.');
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Product not found.');
        setLoading(false);
        return;
      }
      setProduct(data as Product);
      setLoading(false);
    })();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const price = getEffectivePrice(product);
    addToCart({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price,
      image: product.images?.[0] ?? '',
      quantity,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-neutral-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-6 bg-neutral-200 rounded w-1/4" />
            <div className="h-24 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-600 mb-4">{error ?? 'Product not found.'}</p>
        <Link to="/shop" className="text-neutral-900 font-medium underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice(product);
  const hasSale = product.sale_price !== null && product.sale_price < product.price;
  const outOfStock = product.stock === 0;
  const images = product.images?.length ? product.images : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-6">
        <ChevronLeft size={16} /> Back to shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-4">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                <span>No image</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i ? 'border-neutral-900' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <Link
              to={`/shop?category=${product.category.slug}`}
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="text-3xl font-serif font-bold text-neutral-900 mt-2">{product.name}</h1>

          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-semibold text-neutral-900">{formatPrice(effectivePrice)}</span>
            {hasSale && (
              <span className="text-lg text-neutral-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <p className="text-neutral-600 leading-relaxed mt-6">{product.description}</p>

          <div className="mt-6">
            {outOfStock ? (
              <p className="text-sm font-medium text-red-600">Out of stock</p>
            ) : product.stock <= 10 ? (
              <p className="text-sm font-medium text-amber-600">Only {product.stock} left in stock</p>
            ) : (
              <p className="text-sm font-medium text-green-600">In stock</p>
            )}
          </div>

          {/* Quantity + actions */}
          {!outOfStock && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-neutral-300 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-neutral-700 hover:text-neutral-900"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 text-sm font-medium min-w-[2.5rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-2.5 text-neutral-700 hover:text-neutral-900"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 px-6 py-3.5 border border-neutral-900 text-neutral-900 rounded-lg font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              {added ? 'Added to cart' : 'Add to cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="flex-1 px-6 py-3.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy now
            </button>
          </div>

          {!user && !outOfStock && (
            <p className="text-xs text-neutral-500 mt-3">
              You can browse and add to cart without an account. You'll need to sign in at checkout.
            </p>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-200">
            {[
              { icon: Truck, label: 'Free shipping on all orders' },
              { icon: RefreshCw, label: '30-day returns' },
              { icon: Shield, label: 'Secure checkout' },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <b.icon size={20} className="text-neutral-700 mx-auto mb-2" />
                <p className="text-xs text-neutral-600">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
