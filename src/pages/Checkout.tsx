import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { Loader2, AlertCircle, ArrowRight, ShieldCheck, Phone, Check, RefreshCw } from 'lucide-react';

// Normalize a phone input to E.164. Defaults Indian numbers to +91.
function toE164(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length > 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

export default function Checkout() {
  const { user, profile } = useAuth();
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    delivery_address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP verification state
  const [otpStep, setOtpStep] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified'>('idle');
  const [otpToken, setOtpToken] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  const shipping = 0;
  const total = subtotal + shipping;

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        customer_name: profile.full_name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
      }));
    }
  }, [profile]);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Changing the phone resets verification
    if (name === 'phone') {
      setOtpStep('idle');
      setOtpError(null);
      setVerifiedPhone(null);
      setOtpToken('');
    }
  };

  const validate = (): string | null => {
    if (!form.customer_name.trim()) return 'Full name is required';
    if (!form.phone.trim()) return 'Phone number is required';
    if (!/^\+?[\d\s-]{10,15}$/.test(form.phone.trim())) return 'Enter a valid phone number';
    if (!form.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) return 'Enter a valid email';
    if (!form.delivery_address.trim()) return 'Delivery address is required';
    if (!form.pincode.trim()) return 'Pincode is required';
    return null;
  };

  const handleSendOtp = async () => {
    setOtpError(null);
    setError(null);
    const e164 = toE164(form.phone);
    if (!e164) {
      setOtpError('Enter a valid mobile number (10 digits, or with country code).');
      return;
    }

    setOtpStep('sending');
    try {
      // For an already-authenticated user, updateUser({ phone }) triggers an OTP.
      const { error: sendError } = await supabase.auth.updateUser({ phone: e164 });
      if (sendError) {
        // Rate-limit / provider errors surface here
        setOtpStep('idle');
        setOtpError(sendError.message);
        return;
      }
      setOtpStep('sent');
      setResendIn(60);
    } catch {
      setOtpStep('idle');
      setOtpError('Could not send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);
    const e164 = toE164(form.phone);
    if (!e164 || !otpToken.trim()) {
      setOtpError('Enter the OTP sent to your phone.');
      return;
    }

    setOtpStep('verifying');
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164,
        token: otpToken.trim(),
        type: 'phone_change',
      });

      if (verifyError) {
        setOtpStep('sent');
        setOtpError(verifyError.message);
        return;
      }

      // Persist verified phone to profile
      await supabase.from('profiles').update({ phone: e164 }).eq('id', user!.id);

      setVerifiedPhone(e164);
      setOtpStep('verified');
      setOtpError(null);
    } catch {
      setOtpStep('sent');
      setOtpError('OTP verification failed. Please try again.');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (otpStep !== 'verified' || !verifiedPhone) {
      setError('Verify your phone number with OTP before placing the order.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: '',
          user_id: user.id,
          customer_name: form.customer_name,
          phone: verifiedPhone,
          email: form.email,
          delivery_address: form.delivery_address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          subtotal,
          shipping,
          total,
          payment_method: 'upi',
          payment_status: 'pending_verification',
          order_status: 'new',
        })
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error(orderError?.message ?? 'Failed to create order');
      }

      const { data: orderNumber } = await supabase.rpc('generate_order_number');
      if (orderNumber) {
        await supabase
          .from('orders')
          .update({ order_number: orderNumber })
          .eq('id', orderData.id);
        orderData.order_number = orderNumber;
      }

      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.name,
        price: item.sale_price ?? item.price,
        quantity: item.quantity,
        image_url: item.image,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(itemsError.message);

      navigate(`/order-success/${orderData.id}`);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Your cart is empty</h1>
        <p className="text-neutral-600 mb-6">Add some products before checking out.</p>
        <Link to="/shop" className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-8">Checkout</h1>

      <form onSubmit={handleCheckout} className="grid lg:grid-cols-3 gap-8">
        {/* Delivery details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Delivery Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Delivery Address *</label>
                <textarea
                  name="delivery_address"
                  value={form.delivery_address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Phone OTP verification */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-1 flex items-center gap-2">
              <Phone size={18} /> Phone Verification
            </h2>
            <p className="text-xs text-neutral-500 mb-4">Verify your mobile number with OTP to place the order.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Mobile Number *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    disabled={otpStep === 'verified'}
                    className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-500"
                  />
                  {otpStep !== 'verified' && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpStep === 'sending' || !form.phone.trim() || otpStep === 'sent'}
                      className="px-4 py-2.5 border border-neutral-900 text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
                    >
                      {otpStep === 'sending' ? (
                        <><Loader2 size={16} className="animate-spin" /> Sending...</>
                      ) : otpStep === 'sent' ? (
                        <><Check size={16} /> Sent</>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* OTP input */}
              {(otpStep === 'sent' || otpStep === 'verifying') && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Enter OTP sent to {toE164(form.phone)}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/[^\d]/g, ''))}
                        placeholder="6-digit OTP"
                        className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpStep === 'verifying' || otpToken.length < 4}
                        className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
                      >
                        {otpStep === 'verifying' ? (
                          <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    {resendIn > 0 ? (
                      <span className="text-neutral-500">Resend OTP in {resendIn}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-neutral-900 font-medium hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Verified badge */}
              {otpStep === 'verified' && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Phone verified</p>
                      <p className="text-xs text-green-700 font-mono">{verifiedPhone}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('idle');
                      setVerifiedPhone(null);
                      setOtpToken('');
                    }}
                    className="text-xs text-neutral-600 hover:text-neutral-900 underline"
                  >
                    Change number
                  </button>
                </div>
              )}

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Payment Method</h2>
            <div className="flex items-center gap-3 p-4 border-2 border-neutral-900 rounded-lg bg-neutral-50">
              <input type="radio" checked readOnly className="accent-neutral-900" />
              <div>
                <p className="text-sm font-medium text-neutral-900">UPI (Manual Payment)</p>
                <p className="text-xs text-neutral-500">After placing your order, you'll get the UPI ID to pay. Enter your transaction reference ID and we'll verify your payment manually.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-50 rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-neutral-200 rounded flex-shrink-0 overflow-hidden">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-900 line-clamp-1">{item.name}</p>
                    <p className="text-neutral-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-neutral-900">
                    {formatPrice((item.sale_price ?? item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Shipping</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="flex justify-between text-base border-t border-neutral-200 pt-2">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="font-bold text-neutral-900">{formatPrice(total)}</span>
              </div>
            </div>

            {otpStep !== 'verified' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
                <span>Verify your phone number with OTP to enable checkout.</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || otpStep !== 'verified'}
              className="w-full mt-6 px-6 py-3.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Placing order...
                </>
              ) : (
                <>
                  Place order <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
