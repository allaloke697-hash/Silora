import { Outlet, Link } from 'react-router-dom';
import { Package, ShoppingBag, LayoutDashboard, Tag, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout() {
  const { profile, signOut } = useAuth();

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: Tag },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 bg-neutral-900 text-neutral-300 md:min-h-screen flex-shrink-0">
        <div className="p-6">
          <Link to="/admin" className="text-xl font-serif font-bold text-white">SILORA Admin</Link>
          <p className="text-xs text-neutral-400 mt-1">{profile?.email}</p>
        </div>

        <nav className="px-3 pb-6 flex md:flex-col gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors whitespace-nowrap"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-6 hidden md:block">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
