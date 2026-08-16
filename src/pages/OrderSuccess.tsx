import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart-context';
import type { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { CheckCircle, Package, ArrowRight, Copy, Check, Clock, AlertCircle, Loader2 } from 'lucide-react';

const UPI_ID = import.meta.env.VITE_UPI_ID ?? 'silora@upi';

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [submittingRef, setSubmittingRef] = useState(false);
  const [refSubmitted, setRefSubmitted] = useState(false);

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
      if (data.payment_reference_id) {
        setReferenceId(data.payment_reference_id);
        setRefSubmitted(true);
      }
      clearCart();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReferenceSubmit = async () => {
    if (!order || !referenceId.trim()) return;
    setSubmittingRef(true);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_reference_id: referenceId.trim() })
      .eq('id', order.id);

    if (updateError) {
      setError(updateError.message);
      setSubmittingRef(false);
      return;
    }

    setRefSubmitted(true);
    setSubmittingRef(false);
    setOrder({ ...order, payment_reference_id: referenceId.trim() });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-600 mb-4">{error ?? 'Order not found.'}</p>
        <Link to="/orders" className="text-neutral-900 font-medium underline">View my orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">Order Placed</h1>
        <p className="text-neutral-600">Your order has been placed. Complete your UPI payment below to get it confirmed.</p>
      </div>

      {/* Order details card */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 mb-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Order Number</p>
            <p className="text-lg font-semibold text-neutral-900">{order.order_number}</p>
          </div>
          <Package size={32} className="text-neutral-400" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">Order Date</p>
            <p className="font-medium text-neutral-900">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Total Amount</p>
            <p className="font-medium text-neutral-900">{formatPrice(order.total)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Payment Status</p>
            <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full capitalize">
              {order.payment_status.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <p className="text-neutral-500">Order Status</p>
            <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
              {order.order_status}
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-sm text-neutral-500 mb-2">Delivering to</p>
          <p className="text-sm text-neutral-900">{order.customer_name}</p>
          <p className="text-sm text-neutral-600">{order.delivery_address}</p>
          <p className="text-sm text-neutral-600">
            {order.city} {order.state} {order.pincode}
          </p>
        </div>
      </div>

      {/* UPI Payment instructions */}
      <div className="bg-white border-2 border-neutral-900 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Complete Your Payment</h2>

        {/* UPI ID display + copy */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-neutral-600 mb-2">Pay using UPI ID:</p>
          <div className="flex items-center gap-3">
            <code className="text-xl font-bold text-neutral-900 flex-1 font-mono">{UPI_ID}</code>
            <button
              onClick={handleCopyUpi}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy UPI ID'}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Open any UPI app (Google Pay, PhonePe, Paytm, etc.), send {formatPrice(order.total)} to the UPI ID above, then enter your transaction/reference ID below.
          </p>
        </div>

        {/* Reference ID input / confirmation */}
        {refSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Payment confirmation submitted</p>
                <p className="text-xs text-green-700 mt-1">
                  Reference ID: <strong className="font-mono">{order.payment_reference_id}</strong>
                </p>
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Payment verification pending. Payments are manually verified between 6:00 PM and 9:00 PM. Your order will be confirmed after verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Transaction / Reference ID <span className="text-neutral-400">(from your UPI app)</span>
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={handleReferenceSubmit}
              disabled={submittingRef || !referenceId.trim()}
              className="w-full px-6 py-3.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submittingRef ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Submitting...
                </>
              ) : (
                "I've Paid"
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to={`/orders/${order.id}`}
          className="flex-1 px-6 py-3.5 border border-neutral-900 text-neutral-900 rounded-lg font-medium hover:bg-neutral-50 transition-colors text-center"
        >
          View order details
        </Link>
        <Link
          to="/shop"
          className="flex-1 px-6 py-3.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors text-center flex items-center justify-center gap-2"
        >
          Continue shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
