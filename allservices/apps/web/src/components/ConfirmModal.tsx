'use client';

import { ReactNode } from 'react';

export function ConfirmModal({
  open,
  title,
  children,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 'min(520px, 94vw)', padding: 18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>{title}</div>

        <div className="small" style={{ lineHeight: 1.5 }}>
          {children}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn secondary" onClick={onClose} disabled={!!loading}>
            {cancelText}
          </button>
          <button className="btn" onClick={onConfirm} disabled={!!loading}>
            {loading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
