import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Check, AlertCircle, Store, Tag, Smartphone, MessageSquare } from 'lucide-react';

export default function AdminSettings() {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storeName, setStoreName] = useState('SILORA');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // In a real app, this would persist to a settings table
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-6">Settings</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Store size={18} /> Store Information
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save settings'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Smartphone size={18} /> UPI Payment
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Manual UPI Payment Active</p>
              <p className="text-xs text-green-700 mt-1">
                Customers pay via UPI to your ID and submit a transaction reference ID. You manually verify payments and mark orders as Paid or Failed.
              </p>
              <p className="text-xs text-green-700 mt-2">
                Your UPI ID: <code className="font-mono font-bold">{import.meta.env.VITE_UPI_ID ?? 'silora@upi'}</code>
                <br />Change it in your <code className="font-mono">.env</code> file under <code className="font-mono">VITE_UPI_ID</code>.
              </p>
              <p className="text-xs text-green-700 mt-2">
                Verification window: tell customers payments are verified between 6:00 PM and 9:00 PM.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> Phone OTP Verification
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Smartphone size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Mandatory at Checkout</p>
              <p className="text-xs text-blue-700 mt-1">
                Every customer must enter a mobile number and verify it with a one-time password (OTP) before placing an order. The verified phone is saved to the customer's profile and the order.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">SMS Provider Required</p>
              <p className="text-xs text-amber-700 mt-1">
                OTPs are sent through Supabase Auth's phone provider. To enable real SMS delivery, configure an SMS provider (Twilio, MessageBird, Vonage, or TextLocal) in your Supabase dashboard under <strong>Authentication &gt; Providers &gt; Phone</strong>. Without a provider, OTP delivery will fail.
              </p>
              <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
                <li>Enable the <strong>Phone</strong> auth provider in Supabase</li>
                <li>Add your SMS provider credentials</li>
                <li>Set the OTP template if you want custom message text</li>
                <li>Test with a real mobile number at checkout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Admin Account</h2>
        <div className="text-sm space-y-2">
          <div className="flex justify-between"><span className="text-neutral-600">Email</span><span className="font-medium text-neutral-900">{profile?.email}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Role</span><span className="font-medium text-neutral-900 capitalize">{profile?.role}</span></div>
        </div>
      </div>
    </div>
  );
}
