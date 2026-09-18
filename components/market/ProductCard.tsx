'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // in UZS
  imageUrl?: string;
  stock: number;
  description?: string;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " so'm";
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-150">
      {/* Product image */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Stock badge overlay */}
        <div className="absolute top-2 right-2">
          {outOfStock && (
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-red-200">
              Tugagan
            </span>
          )}
          {lowStock && !outOfStock && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">
              {product.stock} ta qoldi
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div>
          <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wide">
            {product.category}
          </p>
          <p className="text-sm font-semibold text-[#111827] leading-tight line-clamp-2 mt-0.5">
            {product.name}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-base font-bold text-[#FF6B35]">{formatUZS(product.price)}</p>
        </div>
        <Button
          variant={outOfStock ? 'ghost' : 'primary'}
          fullWidth
          disabled={outOfStock}
          onClick={() => onAddToCart(product)}
          className="text-xs"
        >
          {outOfStock ? "Mavjud emas" : 'Savatga qo\'shish'}
        </Button>
      </div>
    </div>
  );
}
