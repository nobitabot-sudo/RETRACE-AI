import React, { useState } from 'react';
import {
  Headphones,
  Tv,
  Watch,
  Plane,
  Tablet,
  Package,
} from 'lucide-react';
import { Product } from '../types';
import { getProductImageUrl } from '../data/productImages';

export type ProductImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ProductImageProps {
  sku?: string;
  product?: Partial<Product> | null;
  name?: string;
  category?: string;
  size?: ProductImageSize;
  className?: string;
  alt?: string;
  showCategoryBadge?: boolean;
}

const SIZE_CLASSES: Record<ProductImageSize, { container: string; icon: string; text: string }> = {
  xs: {
    container: 'w-6 h-6 min-w-6 min-h-6 rounded',
    icon: 'w-3 h-3',
    text: 'text-[9px]',
  },
  sm: {
    container: 'w-9 h-9 min-w-9 min-h-9 rounded-md',
    icon: 'w-4 h-4',
    text: 'text-[10px]',
  },
  md: {
    container: 'w-12 h-12 min-w-12 min-h-12 rounded-lg',
    icon: 'w-5 h-5',
    text: 'text-xs',
  },
  lg: {
    container: 'w-16 h-16 min-w-16 min-h-16 rounded-xl',
    icon: 'w-7 h-7',
    text: 'text-sm',
  },
  xl: {
    container: 'w-24 h-24 min-w-24 min-h-24 sm:w-28 sm:h-28 sm:min-w-28 sm:min-h-28 rounded-2xl',
    icon: 'w-10 h-10',
    text: 'text-base',
  },
};

/**
 * Returns appropriate category icon for product fallback
 */
function getCategoryIcon(category?: string, className?: string) {
  const norm = (category || '').toLowerCase();
  if (norm.includes('audio') || norm.includes('headphone') || norm.includes('sound')) {
    return <Headphones className={className} />;
  }
  if (norm.includes('display') || norm.includes('monitor') || norm.includes('screen')) {
    return <Tv className={className} />;
  }
  if (norm.includes('wearable') || norm.includes('watch')) {
    return <Watch className={className} />;
  }
  if (norm.includes('drone') || norm.includes('quad') || norm.includes('aero')) {
    return <Plane className={className} />;
  }
  if (norm.includes('tablet') || norm.includes('pad')) {
    return <Tablet className={className} />;
  }
  return <Package className={className} />;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  sku,
  product,
  name,
  category,
  size = 'md',
  className = '',
  alt,
  showCategoryBadge = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveSku = sku || product?.sku;
  const effectiveName = name || product?.name || effectiveSku || 'Product';
  const effectiveCategory = category || product?.category || '';

  // Resolve image URL
  const resolvedSrc = getProductImageUrl(
    product ? { sku: effectiveSku, image_url: product.image_url } : effectiveSku
  );

  const sizeConfig = SIZE_CLASSES[size];
  const accessibilityAlt =
    alt || `${effectiveName}${effectiveSku ? ` (${effectiveSku})` : ''} product photo`;

  // Fallback rendering when no image is registered or when image loading fails
  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center bg-slate-100 border border-slate-200/90 text-slate-500 overflow-hidden shrink-0 select-none ${sizeConfig.container} ${className}`}
        title={`${effectiveName} (${effectiveSku || 'No SKU'})`}
        aria-label={accessibilityAlt}
      >
        <div className="flex flex-col items-center justify-center text-center p-0.5">
          {getCategoryIcon(effectiveCategory, `${sizeConfig.icon} text-slate-600`)}
          {size === 'xl' && effectiveSku && (
            <span className="font-mono text-[10px] font-bold text-slate-700 mt-1 uppercase">
              {effectiveSku}
            </span>
          )}
        </div>
        {showCategoryBadge && effectiveCategory && (
          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] text-white font-mono text-center py-0.5 truncate px-0.5">
            {effectiveCategory}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block bg-slate-900/5 border border-slate-200/90 overflow-hidden shrink-0 ${sizeConfig.container} ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
          <div className="w-1/2 h-1/2 rounded bg-slate-200/80" />
        </div>
      )}
      <img
        src={resolvedSrc}
        alt={accessibilityAlt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover object-center transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {showCategoryBadge && effectiveCategory && (
        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-2xs text-[8px] text-slate-200 font-mono text-center py-0.5 truncate px-0.5">
          {effectiveCategory}
        </span>
      )}
    </div>
  );
};
