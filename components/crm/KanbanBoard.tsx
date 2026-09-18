'use client';

import React, { useState } from 'react';
import { Lead, LeadStatus, LeadCard } from './LeadCard';
import { EmptyState } from '../ui/EmptyState';
import { LeadModal } from './LeadModal';

export interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdate: (lead: Lead) => Promise<void> | void;
  onLeadDelete: (leadId: string) => Promise<void> | void;
}

interface Column {
  status: LeadStatus;
  label: string;
  headerClass: string;
  countClass: string;
}

const COLUMNS: Column[] = [
  {
    status: 'NEW',
    label: 'Yangi',
    headerClass: 'bg-blue-50 border-blue-200',
    countClass: 'bg-blue-100 text-blue-700',
  },
  {
    status: 'CONTACTED',
    label: "Bog'lanildi",
    headerClass: 'bg-amber-50 border-amber-200',
    countClass: 'bg-amber-100 text-amber-700',
  },
  {
    status: 'ORDERED',
    label: 'Buyurtma berdi',
    headerClass: 'bg-emerald-50 border-emerald-200',
    countClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    status: 'CLOSED',
    label: 'Yopildi',
    headerClass: 'bg-gray-50 border-gray-200',
    countClass: 'bg-gray-100 text-gray-600',
  },
];

export function KanbanBoard({ leads, onLeadUpdate, onLeadDelete }: KanbanBoardProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const leadsByStatus = (status: LeadStatus) =>
    leads.filter((l) => l.status === status);

  return (
    <>
      {/* Board: horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
        {COLUMNS.map((col) => {
          const colLeads = leadsByStatus(col.status);
          return (
            <div
              key={col.status}
              className="flex flex-col shrink-0 w-72 lg:w-auto rounded-xl border overflow-hidden"
              style={{ borderColor: 'transparent' }}
            >
              {/* Column header */}
              <div
                className={`flex items-center justify-between px-3 py-2.5 border-b ${col.headerClass}`}
              >
                <span className="text-sm font-semibold text-[#111827]">{col.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-bold ${col.countClass}`}
                >
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2 bg-gray-50 min-h-[200px] flex-1">
                {colLeads.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-xs text-[#6B7280] text-center">
                      Lidlar yo&apos;q
                    </p>
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onTap={setSelectedLead}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead detail modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={async (updated) => {
            await onLeadUpdate(updated);
            setSelectedLead(null);
          }}
          onDelete={async (id) => {
            await onLeadDelete(id);
            setSelectedLead(null);
          }}
        />
      )}
    </>
  );
}
