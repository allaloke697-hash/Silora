import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Order } from '@/lib/types';
import { formatPrice, formatShortDate } from '@/lib/utils';
import { Package, ChevronRight, Search } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentColors: Record<string, string> = {
  pending_verification: 'bg-amber-100 text-amber-700',
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-neutral-200 text-neutral-700',
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) {
        setError('Failed to load orders.');
        setLoading(false);
        return;
      }
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = filter
    ? orders.filter((o) => o.order_number.toLowerCase().includes(filter.toLowerCase()))
    : orders;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-8">My Orders</h1>

      {orders.length > 0 && (
        <div className="relative mb-6 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by order number..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          </h2>
          <p className="text-neutral-600 mb-6">
            {orders.length === 0
              ? "You haven't placed any orders yet. Start shopping to see them here."
              : 'Try a different search term.'}
          </p>
          {orders.length === 0 && (
            <Link
              to="/shop"
              className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Browse products
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const itemCount = order.order_items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
            const firstImage = order.order_items?.[0]?.image_url;

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                    {firstImage ? (
                      <img src={firstImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-neutral-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-neutral-900">{order.order_number}</p>
                        <p className="text-sm text-neutral-500">{formatShortDate(order.created_at)}</p>
                      </div>
                      <p className="font-bold text-neutral-900">{formatPrice(order.total)}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-neutral-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[order.order_status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {order.order_status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${paymentColors[order.payment_status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {order.payment_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={20} className="text-neutral-300 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
