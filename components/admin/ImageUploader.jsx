'use client';

import { useRef, useState } from 'react';
import { API } from '@/lib/api';
import { Input } from '@/components/admin/AdminUI';
import { Icon } from '@/components/ui/Icons';

const MAX_SIDE = 1600;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This file is not a readable image.'));
    img.src = src;
  });
}

// Shrinks photos to at most 1600px and re-encodes them as WebP (JPEG where the
// browser can't encode WebP), so a 6 MB phone photo uploads as ~300 KB.
// GIFs are sent as-is to keep any animation.
async function prepareImage(file) {
  const original = await readAsDataUrl(file);
  if (file.type === 'image/gif') return original;
  const img = await loadImage(original);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  let out = canvas.toDataURL('image/webp', 0.85);
  if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', 0.88);
  // Keep the original if re-encoding somehow made it bigger.
  return out.length < original.length ? out : original;
}

/**
 * images: [{ url, alt, is_primary }]
 * onChange(nextImages)
 */
export default function ImageUploader({ images, onChange, productName = '' }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const withPrimary = (list) => {
    if (!list.length) return list;
    return list.some(i => i.is_primary) ? list : list.map((img, idx) => ({ ...img, is_primary: idx === 0 }));
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) { setError('Choose image files (JPG, PNG, WebP, GIF or AVIF).'); return; }
    setError('');
    setBusy(n => n + files.length);
    const uploaded = [];
    const failures = [];
    for (const file of files) {
      try {
        const dataUrl = await prepareImage(file);
        const res = await API.uploadImage(dataUrl, file.name);
        if (!res.success) throw new Error(res.message || 'Upload failed');
        uploaded.push({ url: res.url, alt: productName, is_primary: false });
      } catch (e) {
        failures.push(`${file.name}: ${e.message}`);
      } finally {
        setBusy(n => n - 1);
      }
    }
    if (uploaded.length) onChange(withPrimary([...images.filter(i => i.url), ...uploaded]));
    if (failures.length) setError(failures.join(' · '));
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    onChange(withPrimary([...images.filter(i => i.url), { url, alt: productName, is_primary: false }]));
    setUrlDraft('');
  };

  const remove = (idx) => onChange(withPrimary(images.filter((_, i) => i !== idx)));
  const setPrimary = (idx) => onChange(images.map((img, i) => ({ ...img, is_primary: i === idx })));
  const setAlt = (idx, alt) => onChange(images.map((img, i) => (i === idx ? { ...img, alt } : img)));
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  // The form keeps only real images (no blank URL rows), so indexes match.
  const list = images;

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
          dragOver ? 'border-brand-blue bg-brand-blue/5' : 'border-border dark:border-white/15'
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand-blue dark:bg-white/5">
          <Icon.layers className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-ink dark:text-white">Drag &amp; drop product photos here</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG, WebP, GIF or AVIF — resized to 1600px automatically</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy > 0}
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand-blue to-brand-deep px-4 py-2.5 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {busy > 0 ? `Uploading ${busy}…` : 'Select Files'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {error && <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10">{error}</div>}

      {list.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((img, i) => (
            <li key={`${img.url}-${i}`} className={`overflow-hidden rounded-xl border-[1.5px] ${img.is_primary ? 'border-brand-blue' : 'border-border dark:border-white/10'}`}>
              <div className="relative aspect-square bg-brand-light dark:bg-white/5">
                <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
                {img.is_primary && (
                  <span className="absolute left-2 top-2 rounded-md bg-brand-blue px-2 py-0.5 text-[10px] font-bold uppercase text-white">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove image"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:text-rose-600"
                >
                  <Icon.close className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 p-2">
                <input
                  value={img.alt}
                  onChange={e => setAlt(i, e.target.value)}
                  placeholder="Alt text"
                  className="w-full rounded-lg border border-border bg-white px-2 py-1 text-xs text-ink outline-hidden focus:border-brand-blue dark:bg-navy dark:text-white dark:border-white/10"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-bold ${img.is_primary ? 'bg-brand-blue text-white' : 'bg-brand-light text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400'}`}
                  >
                    {img.is_primary ? 'Main photo' : 'Set as main'}
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" className="rounded-lg bg-brand-light p-1 text-slate-500 disabled:opacity-30 dark:bg-white/5">
                    <Icon.chevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move right" className="rounded-lg bg-brand-light p-1 text-slate-500 disabled:opacity-30 dark:bg-white/5">
                    <Icon.chevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <Input
          value={urlDraft}
          onChange={e => setUrlDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="…or paste an image URL"
          className="flex-1"
        />
        <button type="button" onClick={addUrl} className="shrink-0 rounded-xl border-[1.5px] border-brand-blue px-3.5 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5">
          Add
        </button>
      </div>
    </div>
  );
}
