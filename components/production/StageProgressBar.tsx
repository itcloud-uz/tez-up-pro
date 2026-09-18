'use client';

import React from 'react';

export type ProductionStage =
  | 'RECEIVING'
  | 'CUTTING'
  | 'ASSEMBLY'
  | 'SEWING'
  | 'PACKAGING'
  | 'COMPLETED';

export const STAGE_ORDER: ProductionStage[] = [
  'RECEIVING',
  'CUTTING',
  'ASSEMBLY',
  'SEWING',
  'PACKAGING',
  'COMPLETED',
];

export const STAGE_LABELS: Record<ProductionStage, string> = {
  RECEIVING:  'Qabul',
  CUTTING:    'Kesish',
  ASSEMBLY:   'Yig\'ish',
  SEWING:     'Tikish',
  PACKAGING:  'Qadoqlash',
  COMPLETED:  'Tayyor',
};

const stageIcons: Record<ProductionStage, React.ReactNode> = {
  RECEIVING: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  CUTTING: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  ),
  ASSEMBLY: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  SEWING: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  PACKAGING: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  COMPLETED: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
};

export interface StageProgressBarProps {
  currentStage: ProductionStage;
  className?: string;
}

export function StageProgressBar({ currentStage, className = '' }: StageProgressBarProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="flex items-center min-w-max">
        {STAGE_ORDER.map((stage, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <React.Fragment key={stage}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                    isDone
                      ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                      : isCurrent
                      ? 'bg-orange-50 border-[#FF6B35] text-[#FF6B35]'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stageIcons[stage]
                  )}
                </div>
                <span
                  className={[
                    'text-[10px] font-medium whitespace-nowrap',
                    isCurrent ? 'text-[#FF6B35]' : isPending ? 'text-[#6B7280]' : 'text-[#111827]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {STAGE_LABELS[stage]}
                </span>
              </div>

              {/* Connector line */}
              {index < STAGE_ORDER.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-1 min-w-[24px] transition-colors duration-200',
                    index < currentIndex ? 'bg-[#FF6B35]' : 'bg-[#E5E7EB]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
