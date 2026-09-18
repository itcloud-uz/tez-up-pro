'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/Button';

export interface ReceiptUploadProps {
  orderId: string;
  totalAmount: number;
  onUpload: (orderId: string, file: File) => Promise<void>;
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'done' | 'error';

const BANK_CARD = process.env.NEXT_PUBLIC_BANK_CARD ?? '0000 0000 0000 0000';
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME ?? 'Bank nomi';

function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

export function ReceiptUpload({ orderId, totalAmount, onUpload }: ReceiptUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setErrorMsg("Faqat rasm fayllari qabul qilinadi (JPG, PNG, WEBP)");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg("Fayl hajmi 10 MB dan oshmasligi kerak");
      return;
    }
    setErrorMsg('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setState('selected');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0] ?? null);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleSubmit = async () => {
    if (!file) return;
    setState('uploading');
    try {
      await onUpload(orderId, file);
      setState('done');
    } catch {
      setState('error');
      setErrorMsg('Yuklashda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  };

  const copyCard = async () => {
    await navigator.clipboard.writeText(BANK_CARD.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-[#111827]">Chek yuklandi!</h3>
          <p className="text-sm text-[#6B7280] mt-1">
            To&apos;lov tekshiruvi davom etmoqda. Tasdiqlangach xabar keladi.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-amber-700">Ko&apos;rib chiqilmoqda</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bank transfer info */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111827]">To&apos;lov ma&apos;lumotlari</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-[#6B7280]">Bank</p>
              <p className="text-sm font-semibold text-[#111827]">{BANK_NAME}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B7280]">Summa</p>
              <p className="text-sm font-bold text-[#FF6B35]">{formatUZS(totalAmount)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 bg-white rounded-lg border border-orange-200 px-3 py-2">
            <div>
              <p className="text-xs text-[#6B7280]">Karta raqami</p>
              <p className="text-base font-mono font-bold text-[#111827] tracking-wider">{BANK_CARD}</p>
            </div>
            <button
              onClick={copyCard}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors text-[#FF6B35]"
              aria-label="Karta raqamini nusxalash"
            >
              {copied ? (
                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-[#6B7280]">
          Pul o&apos;tkazgandan so&apos;ng chekni quyidagi maydonga yuklang.
        </p>
      </div>

      {/* Upload area */}
      <div>
        <p className="text-sm font-medium text-[#111827] mb-2">To&apos;lov chekini yuklang</p>
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            className={[
              'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors duration-150',
              dragging
                ? 'border-[#FF6B35] bg-orange-50'
                : 'border-[#E5E7EB] hover:border-[#FF6B35] hover:bg-gray-50',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#111827]">
                Rasmni bu yerga tashlang
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                yoki <span className="text-[#FF6B35] font-medium">tanlash uchun bosing</span>
              </p>
              <p className="text-xs text-[#6B7280] mt-1">JPG, PNG, WEBP • Max 10 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] aspect-video">
              <img src={preview} alt="Chek ko'rinishi" className="w-full h-full object-contain bg-gray-100" />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setState('idle');
                }}
                aria-label="Rasmni olib tashlash"
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-[#EF4444] hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-[#6B7280] text-center truncate">{file?.name}</p>
          </div>
        )}
        {errorMsg && (
          <p className="text-xs text-[#EF4444] mt-2">{errorMsg}</p>
        )}
      </div>

      {/* Submit */}
      {(state === 'selected' || state === 'uploading') && (
        <Button
          variant="primary"
          fullWidth
          loading={false}
          onClick={handleSubmit}
        >
          Chekni yuborish
        </Button>
      )}
      {state === 'error' && (
        <Button
          variant="danger"
          fullWidth
          onClick={handleSubmit}
        >
          Qayta urinish
        </Button>
      )}
    </div>
  );
}
