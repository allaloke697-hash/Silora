import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif font-bold text-white mb-3">SILORA</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Timeless essentials crafted with intention. Quality you can feel, design you can trust.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=apparel" className="hover:text-white transition-colors">Apparel</Link></li>
              <li><Link to="/shop?category=footwear" className="hover:text-white transition-colors">Footwear</Link></li>
              <li><Link to="/shop?category=accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors" aria-label="Twitter"><Twitter size={20} /></a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors" aria-label="Facebook"><Facebook size={20} /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 text-center text-sm text-neutral-500">
          <a
  href="https://wa.me/918790222258"
  target="_blank"
  rel="noopener noreferrer"
>
  For any help, contact us on WhatsApp: 8790222258
</a>
          © {new Date().getFullYear()} SILORA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
