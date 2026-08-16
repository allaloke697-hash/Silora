import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onLogoTap: () => void;
}

export default function Navbar({ onLogoTap }: NavbarProps) {
  const { itemCount } = useCart();
  const { user, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = (
    <>
      <Link
        to="/shop"
        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        Shop
      </Link>
      <Link
        to="/shop?category=apparel"
        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        Apparel
      </Link>
      <Link
        to="/shop?category=footwear"
        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        Footwear
      </Link>
      <Link
        to="/shop?category=accessories"
        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        Accessories
      </Link>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: mobile menu + logo */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 -ml-2 text-neutral-700"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <button
                onClick={onLogoTap}
                className="text-2xl font-serif font-bold tracking-tight text-neutral-900 select-none"
                aria-label="SILORA"
              >
                SILORA
              </button>
            </div>

            {/* Center: nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-8">{navLinks}</nav>

            {/* Right: actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-neutral-700 hover:text-neutral-900 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
              <Link
                to={user ? '/account' : '/login'}
                className="p-2 text-neutral-700 hover:text-neutral-900 transition-colors"
                aria-label="Account"
              >
                <User size={20} />
              </Link>
              <Link
                to="/cart"
                className="relative p-2 text-neutral-700 hover:text-neutral-900 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-neutral-900 text-white text-[10px] font-semibold rounded-full h-4.5 w-4.5 min-w-[18px] h-[18px] flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search bar expand */}
          {searchOpen && (
            <div className="pb-4">
              <form onSubmit={handleSearch} className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </form>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-neutral-200 bg-white px-4 py-4 flex flex-col gap-4">
            {navLinks}
            {user && profile?.role !== 'admin' && (
              <Link
                to="/orders"
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                onClick={() => setMobileOpen(false)}
              >
                My Orders
              </Link>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
