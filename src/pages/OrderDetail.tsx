import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { ChevronLeft, Package, MapPin, CreditCard, Clock, Truck, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const statusFlow = ['new', 'processing', 'shipped', 'delivered'] as const;
const statusIcons: Record<string, typeof Package> = {
  new: Clock,
  processing: Loader2,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  new: 'text-blue-600',
  processing: 'text-amber-600',
  shipped: 'text-indigo-600',
  delivered: 'text-green-600',
  cancelled: 'text-red-600',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id || !user) return;
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) {
        setError('Order not found or you do not have access to it.');
        setLoading(false);
        return;
      }
      setOrder(data as Order);
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-600 mb-4">{error ?? 'Order not found.'}</p>
        <Link to="/orders" className="text-neutral-900 font-medium underline">Back to orders</Link>
      </div>
    );
  }

  const isCancelled = order.order_status === 'cancelled';
  const currentStepIndex = statusFlow.indexOf(order.order_status as typeof statusFlow[number]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-6">
        <ChevronLeft size={16} /> Back to orders
      </Link>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-neutral-900">{order.order_number}</h1>
            <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded-full capitalize bg-neutral-100 text-neutral-700">
              {order.order_status}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full capitalize bg-neutral-100 text-neutral-700">
              {order.payment_status}
            </span>
          </div>
        </div>

        {/* Status tracking */}
        {!isCancelled ? (
          <div className="mt-8 mb-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-5 h-0.5 bg-neutral-200" />
              <div
                className="absolute left-0 top-5 h-0.5 bg-neutral-900 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (statusFlow.length - 1)) * 100}%` }}
              />
              {statusFlow.map((status, i) => {
                const Icon = statusIcons[status];
                const isDone = i <= currentStepIndex;
                return (
                  <div key={status} className="relative flex flex-col items-center gap-2 z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isDone ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      <Icon size={18} className={status === 'processing' && isDone ? 'animate-spin' : ''} />
                    </div>
                    <span className={`text-xs capitalize ${isDone ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle size={20} className="text-red-600" />
            <p className="text-sm font-medium text-red-700">This order has been cancelled.</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Items</h2>
        <div className="space-y-4">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image_url && <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <Link
                  to={item.product_id ? `/product/${item.product_id}` : '#'}
                  className="text-sm font-medium text-neutral-900 hover:text-neutral-600"
                >
                  {item.product_name}
                </Link>
                <p className="text-sm text-neutral-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <span className="text-sm font-semibold text-neutral-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-200 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-medium">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Shipping</span>
            <span className="font-medium">Free</span>
          </div>
          <div className="flex justify-between text-base border-t border-neutral-200 pt-2">
            <span className="font-semibold text-neutral-900">Total</span>
            <span className="font-bold text-neutral-900">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery + Payment info */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <MapPin size={16} /> Delivery Address
          </h3>
          <div className="text-sm text-neutral-600 space-y-1">
            <p className="font-medium text-neutral-900">{order.customer_name}</p>
            <p>{order.delivery_address}</p>
            <p>{order.city} {order.state} {order.pincode}</p>
            <p>{order.phone}</p>
            <p>{order.email}</p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <CreditCard size={16} /> Payment Information
          </h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Method</span>
              <span className="font-medium text-neutral-900 capitalize">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Status</span>
              <span className={`font-medium capitalize px-2 py-0.5 rounded-full text-xs ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                order.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                order.payment_status === 'pending_verification' ? 'bg-amber-100 text-amber-700' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {order.payment_status.replace(/_/g, ' ')}
              </span>
            </div>
            {order.payment_reference_id && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Reference ID</span>
                <span className="font-mono text-xs text-neutral-900">{order.payment_reference_id}</span>
              </div>
            )}
            {order.payment_id && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Transaction ID</span>
                <span className="font-mono text-xs text-neutral-900">{order.payment_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
