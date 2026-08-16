import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Package, ShoppingBag, Tag, TrendingUp, IndianRupee } from 'lucide-react';
import { formatPrice, formatShortDate } from '@/lib/utils';
import type { Order } from '@/lib/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ]);

      const orders = (ordersRes.data as Order[]) ?? [];
      const paidOrders = orders.filter((o) => o.payment_status === 'paid');

      setStats({
        totalOrders: orders.length,
        totalRevenue: paidOrders.reduce((sum, o) => sum + o.total, 0),
        totalProducts: productsRes.count ?? 0,
        pendingOrders: orders.filter((o) => o.order_status === 'new' || o.order_status === 'processing').length,
      });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 mx-auto" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: IndianRupee, color: 'bg-green-50 text-green-600' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Products', value: stats.totalProducts, icon: Package, color: 'bg-neutral-100 text-neutral-600' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-neutral-200 rounded-lg p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{order.order_number}</p>
                    <p className="text-xs text-neutral-500">{formatShortDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">{formatPrice(order.total)}</p>
                    <p className="text-xs text-neutral-500 capitalize">{order.order_status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/products/new"
              className="flex flex-col items-center gap-2 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Package size={24} className="text-neutral-700" />
              <span className="text-sm font-medium text-neutral-900">Add Product</span>
            </Link>
            <Link
              to="/admin/categories"
              className="flex flex-col items-center gap-2 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Tag size={24} className="text-neutral-700" />
              <span className="text-sm font-medium text-neutral-900">Categories</span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex flex-col items-center gap-2 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <ShoppingBag size={24} className="text-neutral-700" />
              <span className="text-sm font-medium text-neutral-900">View Orders</span>
            </Link>
            <Link
              to="/admin/settings"
              className="flex flex-col items-center gap-2 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <TrendingUp size={24} className="text-neutral-700" />
              <span className="text-sm font-medium text-neutral-900">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
