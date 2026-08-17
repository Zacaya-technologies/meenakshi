'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icons';

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-ink dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border-[1.5px] border-border bg-white p-5 shadow-card dark:bg-navy2 dark:border-white/10 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-gradient-to-r from-brand-blue to-brand-deep text-white shadow-glow hover:-translate-y-0.5',
    outline: 'border-[1.5px] border-brand-blue text-brand-blue hover:bg-brand-blue/5',
    ghost: 'text-slate-500 hover:bg-brand-light dark:text-slate-400 dark:hover:bg-white/5',
    danger: 'border-[1.5px] border-rose-400 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass = 'w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10';

export function Input(props) {
  return <input {...props} className={`${inputClass} ${props.className || ''}`} />;
}
export function TextArea(props) {
  return <textarea {...props} className={`${inputClass} ${props.className || ''}`} />;
}
export function Select({ children, ...props }) {
  return <select {...props} className={`${inputClass} cursor-pointer ${props.className || ''}`}>{children}</select>;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-white/15'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
      {label && <span className="text-sm font-medium text-ink dark:text-white">{label}</span>}
    </label>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    red: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    blue: 'bg-brand-blue/10 text-brand-blue'
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-start justify-center overflow-y-auto bg-navy/60 p-4 py-10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy2`}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-ink dark:text-white">{title}</h3>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-ink dark:bg-white/10 dark:text-white" aria-label="Close">
                <Icon.close className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({ label }) {
  return <p className="py-10 text-center text-sm text-slate-400">{label}</p>;
}
