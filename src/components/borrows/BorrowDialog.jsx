"use client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import "./borrows.css";
export default function BorrowDialog({ open, onClose, title, description, busy, error, disabled, onConfirm, confirmLabel, children }) {
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}><DialogContent className="borrow-dialog" overlayClassName="borrow-overlay" showCloseButton={!busy} aria-busy={busy}>
    <DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>
    {children}{error && <p className="borrow-error" role="alert">{error}</p>}
    <div className="borrow-actions"><button type="button" className="borrow-secondary" disabled={busy} onClick={onClose}>Cancel</button><button type="button" className="borrow-primary" disabled={busy || disabled} onClick={onConfirm}>{busy ? "Processing…" : confirmLabel}</button></div>
  </DialogContent></Dialog>;
}
