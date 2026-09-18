'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Loader2,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Truck,
} from 'lucide-react'

interface Material {
  id: string
  name: string
  unit: string
  stock: number
  minStock: number
  pricePerUnit: number
}

interface Supplier {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  materials: string[]
}

type Tab = 'materials' | 'suppliers'

function StockBar({ stock, minStock }: { stock: number; minStock: number }) {
  const pct = minStock > 0 ? Math.min((stock / (minStock * 3)) * 100, 100) : 100
  const isLow = stock <= minStock
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Qoldi: {stock}</span>
        <span>Min: {minStock}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-[#FF6B35]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('materials')
  const [materials, setMaterials] = useState<Material[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  const [matModal, setMatModal] = useState(false)
  const [supModal, setSupModal] = useState(false)
  const [editMat, setEditMat] = useState<Material | null>(null)
  const [editSup, setEditSup] = useState<Supplier | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [matForm, setMatForm] = useState({ name: '', unit: 'metr', stock: '', minStock: '', pricePerUnit: '' })
  const [supForm, setSupForm] = useState({ name: '', phone: '', email: '', address: '', materials: '' })

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/inventory/materials').then((r) => r.json()),
      fetch('/api/admin/suppliers').then((r) => r.json()),
    ])
      .then(([mats, sups]) => {
        const rawMats = Array.isArray(mats) ? mats : mats.materials ?? []
        const rawSups = Array.isArray(sups) ? sups : sups.suppliers ?? []

        setMaterials(
          rawMats.map((m: any) => ({
            id: m.id,
            name: m.name ?? '',
            unit: m.unit ?? 'metr',
            stock: Number(m.currentStock ?? m.stock ?? 0),
            minStock: Number(m.minStock ?? 0),
            pricePerUnit: Number(m.pricePerUnit ?? 0),
          }))
        )

        setSuppliers(
          rawSups.map((s: any) => ({
            id: s.id,
            name: s.name ?? '',
            phone: s.phone ?? '',
            email: s.email ?? undefined,
            address: s.address ?? undefined,
            materials: Array.isArray(s.materials)
              ? s.materials
              : Array.isArray(s.rawMaterials)
              ? s.rawMaterials.map((rm: any) => rm.name)
              : [],
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openMatModal = (m?: Material) => {
    if (m) {
      setEditMat(m)
      setMatForm({
        name: m.name,
        unit: m.unit,
        stock: m.stock.toString(),
        minStock: m.minStock.toString(),
        pricePerUnit: m.pricePerUnit.toString(),
      })
    } else {
      setEditMat(null)
      setMatForm({ name: '', unit: 'metr', stock: '', minStock: '', pricePerUnit: '' })
    }
    setMatModal(true)
  }

  const openSupModal = (s?: Supplier) => {
    if (s) {
      setEditSup(s)
      setSupForm({
        name: s.name,
        phone: s.phone,
        email: s.email ?? '',
        address: s.address ?? '',
        materials: s.materials.join(', '),
      })
    } else {
      setEditSup(null)
      setSupForm({ name: '', phone: '', email: '', address: '', materials: '' })
    }
    setSupModal(true)
  }

  const handleSaveMat = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const body = {
      name: matForm.name,
      unit: matForm.unit,
      stock: parseFloat(matForm.stock),
      minStock: parseFloat(matForm.minStock),
      pricePerUnit: parseFloat(matForm.pricePerUnit),
    }
    try {
      if (editMat) {
        await fetch(`/api/admin/inventory/materials/${editMat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/inventory/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setMatModal(false)
      fetchData()
    } catch {}
    finally { setSubmitting(false) }
  }

  const handleSaveSup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const body = {
      name: supForm.name,
      phone: supForm.phone,
      email: supForm.email,
      address: supForm.address,
      materials: supForm.materials.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      if (editSup) {
        await fetch(`/api/admin/suppliers/${editSup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setSupModal(false)
      fetchData()
    } catch {}
    finally { setSubmitting(false) }
  }

  const handleDeleteMat = async (id: string) => {
    if (!confirm("Materialni o'chirmoqchimisiz?")) return
    await fetch(`/api/admin/inventory/materials/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchData()
  }

  const handleDeleteSup = async (id: string) => {
    if (!confirm("Yetkazib beruvchini o'chirmoqchimisiz?")) return
    await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' }).catch(() => {})
    fetchData()
  }

  const lowStock = materials.filter((m) => m.stock <= m.minStock)

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Ombor</h1>
        {lowStock.length > 0 && (
          <p className="text-red-500 text-sm flex items-center gap-1 mt-0.5">
            <AlertTriangle size={14} />
            {lowStock.length} ta material kam
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('materials')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'materials' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600'
          }`}
        >
          <Package size={16} />
          Xom ashyo
        </button>
        <button
          onClick={() => setTab('suppliers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'suppliers' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600'
          }`}
        >
          <Truck size={16} />
          Yetkazib beruvchilar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
        </div>
      ) : tab === 'materials' ? (
        <>
          <div className="flex gap-2">
            <button onClick={() => openMatModal()} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} />
              Material
            </button>
          </div>
          <div className="space-y-3">
            {materials.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                <p>Materiallar topilmadi</p>
              </div>
            ) : (
              materials.map((m) => (
                <div key={m.id} className={`card ${m.stock <= m.minStock ? 'border-red-200 bg-red-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{m.name}</p>
                        {m.stock <= m.minStock && (
                          <span className="badge bg-red-100 text-red-700 text-xs">Kam</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Intl.NumberFormat('uz-UZ').format(m.pricePerUnit)} so'm / {m.unit}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openMatModal(m)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMat(m.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <StockBar stock={m.stock} minStock={m.minStock} />
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => openSupModal()} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />
            Yetkazib beruvchi
          </button>
          <div className="space-y-3">
            {suppliers.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <Truck size={32} className="mx-auto mb-2 opacity-50" />
                <p>Yetkazib beruvchilar topilmadi</p>
              </div>
            ) : (
              suppliers.map((s) => (
                <div key={s.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <a href={`tel:${s.phone}`} className="text-sm text-[#FF6B35]">{s.phone}</a>
                      {s.email && <p className="text-sm text-gray-500">{s.email}</p>}
                      {s.address && <p className="text-xs text-gray-400 mt-1">📍 {s.address}</p>}
                      {s.materials.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.materials.map((mat) => (
                            <span key={mat} className="badge bg-orange-50 text-orange-600 text-xs">{mat}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openSupModal(s)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSup(s.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Material modal */}
      {matModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMatModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editMat ? "Materialni tahrirlash" : "Yangi material"}
              </h2>
              <button onClick={() => setMatModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveMat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomi *</label>
                <input type="text" className="input-field" value={matForm.name}
                  onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">O'lchov birligi</label>
                  <select className="input-field" value={matForm.unit}
                    onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}>
                    <option value="metr">Metr</option>
                    <option value="kg">Kg</option>
                    <option value="dona">Dona</option>
                    <option value="litr">Litr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Narx (so'm)</label>
                  <input type="number" className="input-field" value={matForm.pricePerUnit}
                    onChange={(e) => setMatForm({ ...matForm, pricePerUnit: e.target.value })} required min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mavjud</label>
                  <input type="number" className="input-field" value={matForm.stock}
                    onChange={(e) => setMatForm({ ...matForm, stock: e.target.value })} required min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum</label>
                  <input type="number" className="input-field" value={matForm.minStock}
                    onChange={(e) => setMatForm({ ...matForm, minStock: e.target.value })} required min="0" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Supplier modal */}
      {supModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSupModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editSup ? "Yetkazib beruvchini tahrirlash" : "Yangi yetkazib beruvchi"}
              </h2>
              <button onClick={() => setSupModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveSup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomi *</label>
                <input type="text" className="input-field" value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon *</label>
                <input type="tel" className="input-field" value={supForm.phone}
                  onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" className="input-field" value={supForm.email}
                  onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Manzil</label>
                <input type="text" className="input-field" value={supForm.address}
                  onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Materiallar (vergul bilan)</label>
                <input type="text" className="input-field" placeholder="Gazlama, ip, tugma"
                  value={supForm.materials}
                  onChange={(e) => setSupForm({ ...supForm, materials: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}