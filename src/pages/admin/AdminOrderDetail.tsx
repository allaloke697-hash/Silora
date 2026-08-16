import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { PAYMENT_STATUSES } from '@/lib/types';
import { ChevronLeft, MapPin, CreditCard, Package, Loader2, Save, AlertCircle, Check } from 'lucide-react';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) {
        setError('Order not found.');
        setLoading(false);
        return;
      }
      setOrder(data as Order);
      setNewStatus(data.order_status);
      setNewPaymentStatus(data.payment_status);
      setLoading(false);
    })();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    setSaving(true);
    setError(null);

    const updates: Record<string, string> = { order_status: newStatus };
    if (newPaymentStatus !== order.payment_status) {
      updates.payment_status = newPaymentStatus;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setOrder({ ...order, ...updates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-600 mb-4">{error ?? 'Order not found.'}</p>
        <Link to="/admin/orders" className="text-neutral-900 font-medium underline">Back to orders</Link>
      </div>
    );
  }

  const hasChanges = newStatus !== order.order_status || newPaymentStatus !== order.payment_status;

  return (
    <div className="max-w-4xl">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-4">
        <ChevronLeft size={16} /> Back to orders
      </Link>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-neutral-900">{order.order_number}</h1>
            <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${statusColors[order.order_status] ?? 'bg-neutral-100 text-neutral-600'}`}>
            {order.order_status}
          </span>
        </div>

        {/* Status update */}
        <div className="bg-neutral-50 rounded-lg p-4 mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Order Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white capitalize"
            >
              {['new', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Payment Status
              {order.payment_status === 'pending_verification' && (
                <span className="ml-2 text-xs text-amber-600">Manual verification required</span>
              )}
            </label>
            <select
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white capitalize"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {newPaymentStatus === 'paid' && order.payment_status !== 'paid' && (
              <p className="text-xs text-green-600 mt-1">Marking as paid will confirm this order.</p>
            )}
            {newPaymentStatus === 'failed' && order.payment_status !== 'failed' && (
              <p className="text-xs text-red-600 mt-1">Marking as failed will indicate payment was not received.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStatusUpdate}
              disabled={saving || !hasChanges}
              className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
            </button>
            {hasChanges && (
              <button
                onClick={() => {
                  setNewStatus(order.order_status);
                  setNewPaymentStatus(order.payment_status);
                }}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
            )}
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Items</h2>
        <div className="space-y-4">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-14 h-14 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image_url && <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{item.product_name}</p>
                <p className="text-sm text-neutral-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <span className="text-sm font-semibold text-neutral-900">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span className="font-medium">{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Shipping</span><span className="font-medium">Free</span></div>
          <div className="flex justify-between text-base border-t border-neutral-200 pt-2"><span className="font-semibold text-neutral-900">Total</span><span className="font-bold text-neutral-900">{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {/* Customer + Delivery + Payment */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2"><MapPin size={16} /> Customer & Delivery</h3>
          <div className="text-sm text-neutral-600 space-y-1">
            <p className="font-medium text-neutral-900">{order.customer_name}</p>
            <p>{order.delivery_address}</p>
            <p>{order.city} {order.state} {order.pincode}</p>
            <p>Phone: {order.phone}</p>
            <p>Email: {order.email}</p>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2"><CreditCard size={16} /> Payment</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-neutral-600">Method</span><span className="font-medium capitalize">{order.payment_method}</span></div>
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
              <div className="flex justify-between items-start">
                <span className="text-neutral-600">Customer Reference ID</span>
                <span className="font-mono text-xs text-neutral-900 bg-neutral-100 px-2 py-1 rounded">{order.payment_reference_id}</span>
              </div>
            )}
            {order.payment_id && (
              <div className="flex justify-between"><span className="text-neutral-600">Transaction ID</span><span className="font-mono text-xs text-neutral-900">{order.payment_id}</span></div>
            )}
            <div className="flex justify-between"><span className="text-neutral-600">Order Status</span><span className="font-medium capitalize">{order.order_status}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
