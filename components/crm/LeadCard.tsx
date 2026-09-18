'use client';

import React from 'react';
import { StatusBadge } from '../ui/Badge';

export type LeadSource = 'INSTAGRAM' | 'TELEGRAM' | 'PHONE' | 'REFERRAL' | 'WEBSITE' | 'OTHER';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'ORDERED' | 'CLOSED';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCardProps {
  lead: Lead;
  onTap: (lead: Lead) => void;
}

const sourceColors: Record<LeadSource, string> = {
  INSTAGRAM: 'bg-pink-100 text-pink-700',
  TELEGRAM:  'bg-blue-100 text-blue-700',
  PHONE:     'bg-gray-100 text-gray-700',
  REFERRAL:  'bg-green-100 text-green-700',
  WEBSITE:   'bg-purple-100 text-purple-700',
  OTHER:     'bg-yellow-100 text-yellow-700',
};

const sourceLabels: Record<LeadSource, string> = {
  INSTAGRAM: 'Instagram',
  TELEGRAM:  'Telegram',
  PHONE:     'Telefon',
  REFERRAL:  'Tavsiya',
  WEBSITE:   'Veb-sayt',
  OTHER:     'Boshqa',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hozir';
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

export function LeadCard({ lead, onTap }: LeadCardProps) {
  return (
    <div
      onClick={() => onTap(lead)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onTap(lead)}
      className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-3 cursor-pointer hover:shadow-md hover:border-[#FF6B35]/30 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
    >
      {/* Name + time */}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <p className="text-sm font-semibold text-[#111827] leading-tight line-clamp-1">
          {lead.name}
        </p>
        <span className="text-[10px] text-[#6B7280] shrink-0 mt-0.5">
          {timeAgo(lead.updatedAt)}
        </span>
      </div>

      {/* Phone */}
      <p className="text-xs text-[#6B7280] mb-2">{lead.phone}</p>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${sourceColors[lead.source]}`}
        >
          {sourceLabels[lead.source]}
        </span>
        <StatusBadge status={lead.status} />
      </div>

      {/* Notes preview */}
      {lead.notes && (
        <p className="mt-2 text-xs text-[#6B7280] line-clamp-2 bg-gray-50 rounded-lg px-2 py-1.5">
          {lead.notes}
        </p>
      )}
    </div>
  );
}
