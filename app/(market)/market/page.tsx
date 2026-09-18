'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, X } from 'lucide-react'
import { useCartStore } from '@/lib/cartStore'
import CartSidebar from '@/components/market/CartSidebar'

interface Product {
  id: string
  name: string
  price: number
  imageUrl?: string
  category: string
  unit: string
  stock: number
  description?: string
}

interface Category {
  id: string
  name: string
}

const STATIC_CATEGORIES = [
  { id: 'ALL', name: 'Barchasi' },
  { id: 'Kofta', name: 'Kofta' },
  { id: 'Yostiq', name: 'Yostiq' },
  { id: 'Yorgan', name: 'Yorgan' },
  { id: 'Choyshablar', name: 'Choyshablar' },
  { id: 'Matolar', name: 'Matolar' },
]

function formatUZS(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-1" />
        <div className="h-10 bg-gray-200 rounded-xl mt-2" />
      </div>
    </div>
  )
}

function ProductCardItem({ product }: { product: Product }) {
  const { addItem, updateQuantity, removeItem, items } = useCartStore()
  const router = useRouter()
  const [imgErr, setImgErr] = useState(false)

  const cartItem = items.find((i) => i.productId === product.id)
  const qty = cartItem?.quantity ?? 0
  const outOfStock = product.stock === 0
  const lowStock = product.stock > 0 && product.stock <= 5

  const handleAdd = () => {
    if (outOfStock) return
    if (qty === 0) {
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        unit: product.unit,
        quantity: 1,
      })
    } else {
      updateQuantity(product.id, qty + 1)
    }
  }

  const handleDecrement = () => {
    if (qty <= 1) {
      removeItem(product.id)
    } else {
      updateQuantity(product.id, qty - 1)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-150">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.imageUrl && !imgErr ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-50">
            <span className="text-4xl">🧵</span>
          </div>
        )}
        {/* Stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
              Tugagan
            </span>
          </div>
        )}
        {lowStock && !outOfStock && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">
              {product.stock} ta qoldi
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
            {product.category}
          </p>
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mt-0.5 leading-tight">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto space-y-2">
          <div>
            <p className="font-black text-[#FF6B35] text-base leading-none">
              {formatUZS(product.price)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">/{product.unit}</p>
          </div>

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={`w-full h-11 rounded-xl text-sm font-bold transition-colors ${
                outOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#FF6B35] text-white hover:bg-[#E55A24] active:scale-95'
              }`}
            >
              {outOfStock ? "Mavjud emas" : "Qo'shish"}
            </button>
          ) : (
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={handleDecrement}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-lg transition-colors"
                aria-label="Kamaytirish"
              >
                −
              </button>
              <span className="flex-1 text-center font-bold text-gray-900 text-base">
                {qty}
              </span>
              <button
                onClick={handleAdd}
                disabled={product.stock !== null && qty >= product.stock}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FF6B35] text-white hover:bg-[#E55A24] font-bold text-lg transition-colors disabled:opacity-50"
                aria-label="Ko'paytirish"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MarketPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [apiCategories, setApiCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { openCart, getTotalItems, getTotalPrice } = useCartStore()

  const totalItems = getTotalItems()

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
      if (debouncedSearch) params.set('search', debouncedSearch)
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`/api/market/products?${params.toString()}`),
        fetch('/api/market/categories'),
      ])
      const prods = await prodsRes.json()
      const cats = await catsRes.json()
      setProducts(Array.isArray(prods) ? prods : prods.products ?? [])
      setApiCategories(Array.isArray(cats) ? cats : cats.categories ?? [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, debouncedSearch])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Build category list from API or static fallback
  const categories = [
    { id: 'ALL', name: 'Barchasi' },
    ...(apiCategories.length > 0
      ? apiCategories.map((c) => ({ id: c.name, name: c.name }))
      : STATIC_CATEGORIES.slice(1)),
  ]

  return (
    <>
      <div className="space-y-5">
        {/* Hero */}
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">Xush kelibsiz! 👋</p>
          <h1 className="text-2xl font-black mt-1">Tez Up Do&apos;kon</h1>
          <p className="text-sm opacity-80 mt-1">Sifatli to&apos;qimachilik mahsulotlari</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="w-full h-12 pl-11 pr-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] transition"
            placeholder="Mahsulot qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label="Tozalash"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#FF6B35] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-sm text-gray-500">
            {products.length} ta mahsulot
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="text-6xl">🔍</span>
            <div className="text-center">
              <p className="font-bold text-gray-800">Mahsulot topilmadi</p>
              <p className="text-sm text-gray-500 mt-1">
                Boshqa kalit so&apos;z yoki kategoriya tanlang
              </p>
            </div>
            {(search || selectedCategory !== 'ALL') && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory('ALL') }}
                className="px-6 h-11 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-[#E55A24] transition-colors"
              >
                Filtrni tozalash
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => (
              <ProductCardItem key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Floating cart button */}
      {totalItems > 0 && (
        <button
          onClick={openCart}
          className="fixed bottom-20 right-4 md:bottom-6 z-30 bg-[#FF6B35] text-white rounded-2xl px-5 py-3 flex items-center gap-2.5 shadow-xl shadow-orange-200 hover:bg-[#E55A24] active:scale-95 transition-all"
          aria-label="Savatni ochish"
        >
          <ShoppingCart size={20} />
          <span className="font-bold text-sm">{totalItems} ta</span>
          <span className="text-sm font-medium opacity-80">|</span>
          <span className="text-sm font-bold">{formatUZS(getTotalPrice())}</span>
        </button>
      )}

      {/* Cart Sidebar — zero-prop, reads from useCartStore internally */}
      <CartSidebar />
    </>
  )
}