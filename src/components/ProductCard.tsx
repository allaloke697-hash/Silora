import { Link } from 'react-router-dom';
import { getEffectivePrice, formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const effectivePrice = getEffectivePrice(product);
  const hasSale = product.sale_price !== null && product.sale_price < product.price;
  const image = product.images?.[0] ?? '';

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden mb-3">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <span className="text-sm">No image</span>
          </div>
        )}
        {hasSale && (
          <span className="absolute top-3 left-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded">
            Sale
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-sm font-semibold text-neutral-700">Out of stock</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-1">
        {product.name}
      </h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-semibold text-neutral-900">{formatPrice(effectivePrice)}</span>
        {hasSale && (
          <span className="text-xs text-neutral-400 line-through">{formatPrice(product.price)}</span>
        )}
      </div>
    </Link>
  );
}
