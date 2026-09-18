'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Lead, LeadStatus, LeadSource } from './LeadCard';

export interface LeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Lead) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'NEW',       label: 'Yangi' },
  { value: 'CONTACTED', label: "Bog'lanildi" },
  { value: 'ORDERED',   label: 'Buyurtma berdi' },
  { value: 'CLOSED',    label: 'Yopildi' },
];

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TELEGRAM',  label: 'Telegram' },
  { value: 'PHONE',     label: 'Telefon' },
  { value: 'REFERRAL',  label: 'Tavsiya' },
  { value: 'WEBSITE',   label: 'Veb-sayt' },
  { value: 'OTHER',     label: 'Boshqa' },
];

export function LeadModal({ lead, isOpen, onClose, onSave, onDelete }: LeadModalProps) {
  const [form, setForm] = useState<Lead>(lead);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Lead, string>>>({});

  useEffect(() => {
    setForm(lead);
    setErrors({});
    setConfirmDelete(false);
  }, [lead, isOpen]);

  function validate(): boolean {
    const e: Partial<Record<keyof Lead, string>> = {};
    if (!form.name.trim()) e.name = 'Ism majburiy';
    if (!form.phone.trim()) e.phone = 'Telefon majburiy';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ ...form, updatedAt: new Date().toISOString() });
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkContacted() {
    setSaving(true);
    try {
      const updated: Lead = { ...form, status: 'CONTACTED', updatedAt: new Date().toISOString() };
      setForm(updated);
      await onSave(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await onDelete(lead.id); } finally { setDeleting(false); }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lid tafsilotlari"
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="primary" fullWidth loading={saving} onClick={handleSave}>
              Saqlash
            </Button>
            {form.status !== 'CONTACTED' && form.status !== 'ORDERED' && (
              <Button variant="secondary" fullWidth loading={saving} onClick={handleMarkContacted}>
                Bog&apos;lanildi
              </Button>
            )}
          </div>
          <Button
            variant="danger"
            fullWidth
            loading={deleting}
            onClick={handleDelete}
          >
            {confirmDelete ? 'Tasdiqlash — O\'chirish' : "O'chirish"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Ism"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Mijoz ismi"
        />
        <Input
          label="Telefon"
          required
          type="tel"
          value={form.phone}
          error={errors.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+998 90 123 45 67"
        />
        <Select
          label="Holat"
          options={statusOptions}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LeadStatus }))}
        />
        <Select
          label="Manba"
          options={sourceOptions}
          value={form.source}
          onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as LeadSource }))}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111827]">Izoh</label>
          <textarea
            rows={4}
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Qo'shimcha ma'lumot..."
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111827] placeholder-[#6B7280] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>
      </div>
    </Modal>
  );
}
