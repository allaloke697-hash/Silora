import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal, loading } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-neutral-300 mx-auto mb-4" />
        <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Your cart is empty</h1>
        <p className="text-neutral-600 mb-6">Looks like you haven't added anything yet.</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.sale_price ?? item.price;
            return (
              <div
                key={item.product_id}
                className="flex gap-4 p-4 border border-neutral-200 rounded-lg bg-white"
              >
                <Link
                  to={`/product/${item.slug}`}
                  className="w-24 h-24 flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden"
                >
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.slug}`}
                    className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm font-semibold text-neutral-900 mt-1">{formatPrice(price)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-neutral-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1.5 text-neutral-700 hover:text-neutral-900"
                        aria-label="Decrease"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1.5 text-neutral-700 hover:text-neutral-900"
                        aria-label="Increase"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatPrice(price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-50 rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Shipping</span>
                <span className="font-medium text-neutral-900">Free</span>
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between text-base">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="font-bold text-neutral-900">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-6 px-6 py-3.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Proceed to checkout
            </button>
            <Link
              to="/shop"
              className="block text-center mt-3 text-sm text-neutral-600 hover:text-neutral-900"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
