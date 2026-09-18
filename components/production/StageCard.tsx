'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';
import { StageProgressBar, ProductionStage, STAGE_ORDER, STAGE_LABELS } from './StageProgressBar';

export interface Batch {
  id: string;
  batchNumber: string;
  productName: string;
  quantity: number;
  currentStage: ProductionStage;
  assignedEmployee?: string;
  startedAt: string;
  updatedAt: string;
}

export interface StageCardProps {
  batch: Batch;
  onAdvanceStage: (batchId: string, nextStage: ProductionStage) => Promise<void> | void;
  loading?: boolean;
}

export function StageCard({ batch, onAdvanceStage, loading = false }: StageCardProps) {
  const currentIndex = STAGE_ORDER.indexOf(batch.currentStage);
  const isCompleted = batch.currentStage === 'COMPLETED';
  const nextStage = !isCompleted ? STAGE_ORDER[currentIndex + 1] : null;

  const handleAdvance = () => {
    if (nextStage) onAdvanceStage(batch.id, nextStage);
  };

  const progressPercent = Math.round((currentIndex / (STAGE_ORDER.length - 1)) * 100);

  return (
    <Card
      padding="none"
      className="flex flex-col"
      footer={
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          disabled={isCompleted}
          onClick={handleAdvance}
          className="rounded-t-none rounded-b-xl"
        >
          {isCompleted
            ? 'Jarayon tugallandi'
            : `Keyingi bosqich: ${nextStage ? STAGE_LABELS[nextStage] : ''}`}
        </Button>
      }
    >
      {/* Stage progress bar */}
      <div className="px-4 pt-4 pb-3 border-b border-[#E5E7EB] overflow-x-auto">
        <StageProgressBar currentStage={batch.currentStage} />
      </div>

      {/* Batch info */}
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-[#6B7280] font-medium">Partiya №</p>
            <p className="text-base font-bold text-[#111827]">{batch.batchNumber}</p>
          </div>
          <StatusBadge status={batch.currentStage} />
        </div>

        {/* Product name */}
        <div>
          <p className="text-xs text-[#6B7280] font-medium">Mahsulot</p>
          <p className="text-sm font-semibold text-[#111827]">{batch.productName}</p>
        </div>

        {/* Qty + Employee */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-[#6B7280] font-medium">Miqdor</p>
            <p className="text-sm font-semibold text-[#111827]">{batch.quantity} dona</p>
          </div>
          {batch.assignedEmployee && (
            <div>
              <p className="text-xs text-[#6B7280] font-medium">Ishchi</p>
              <p className="text-sm font-semibold text-[#111827]">{batch.assignedEmployee}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#6B7280]">Jarayon</span>
            <span className="text-xs font-semibold text-[#FF6B35]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF6B35] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-[#6B7280]">
          <span>
            Boshlangan:{' '}
            {new Date(batch.startedAt).toLocaleDateString('uz-UZ')}
          </span>
          <span>
            Yangilangan:{' '}
            {new Date(batch.updatedAt).toLocaleDateString('uz-UZ')}
          </span>
        </div>
      </div>
    </Card>
  );
}
