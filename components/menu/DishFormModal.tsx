'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Category, MenuItem } from '@/lib/useHotel';
import { CubeIcon } from './DishCard';
import { formatBytes } from '@/lib/foodModel';
import MenuImageUploader from './MenuImageUploader';
import { useDashboardDialogs } from '@/components/dashboard/DashboardDialogs';

const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        color: 'var(--text-dimmed)',
        fontSize: '0.5625rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
    >
      Loading preview
    </div>
  ),
});

const AVAILABLE_DIETARY = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Chef Special', 'Spicy', 'Organic'];

export interface DishPayload {
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  image_url: string;
  model_url_glb: string;
  model_url_usdz: string;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_veg: boolean;
  allergens: string[];
  dietary_tags: string[];
  calories?: number;
  preparation_time_mins?: number;
  ingredients: string[];
  rating: number;
  order_count: number;
  // Size options
  has_sizes: boolean;
  size_selection_required: boolean;
  sizes: Array<{
    name: string;
    price: number;
    position: number;
    is_available: boolean;
  }>;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  model_url_glb: string;
  model_url_usdz: string;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_veg: boolean;
  calories: string;
  preparation_time_mins: string;
  ingredients: string;
  allergens: string;
  dietary_tags: string[];
  // 3D model upload state (independent GLB/USDZ assets for cross-platform AR)
  modelFile: File | null;
  modelUploading: boolean;
  modelUploadProgress: number;
  modelUploadError: string | null;
  glbFile: File | null;
  usdzFile: File | null;
  glbUploading: boolean;
  usdzUploading: boolean;
  glbUploadProgress: number;
  usdzUploadProgress: number;
  glbUploadError: string | null;
  usdzUploadError: string | null;
  // Size options state
  has_sizes: boolean;
  size_selection_required: boolean;
  sizes: Array<{
    id?: string;
    name: string;
    price: string;
    position: number;
    is_available: boolean;
  }>;
}

function numberToInput(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? String(n) : '';
}

function initialState(item: MenuItem | null, categories: Category[]): FormState {
  if (item) {
    return {
      name: item.name,
      description: item.description || '',
      price: numberToInput(item.price),
      category: item.category || '',
      image_url: item.image_url || '',
      model_url_glb: item.model_url_glb || '',
      model_url_usdz: item.model_url_usdz || '',
      is_available: item.is_available,
      is_featured: item.is_featured,
      is_popular: item.is_popular,
      is_veg: item.is_veg,
      calories: numberToInput(item.calories),
      preparation_time_mins: numberToInput(item.preparation_time_mins),
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '',
      allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : '',
      dietary_tags: Array.isArray(item.dietary_tags) ? item.dietary_tags : [],
      modelFile: null,
      modelUploading: false,
      modelUploadProgress: 0,
      modelUploadError: null,
      glbFile: null,
      usdzFile: null,
      glbUploading: false,
      usdzUploading: false,
      glbUploadProgress: 0,
      usdzUploadProgress: 0,
      glbUploadError: null,
      usdzUploadError: null,
      // Size options - load from item if available
      has_sizes: item.has_sizes || false,
      size_selection_required: item.size_selection_required || false,
      sizes: (item.sizes || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        price: numberToInput(s.price),
        position: s.position || 0,
        is_available: s.is_available !== false,
      })),
    };
  }

  return {
    name: '',
    description: '',
    price: '',
    category: categories[0]?.name || '',
    image_url: '',
    // A dish is a dish first — 3D stays opt-in, never pre-attached.
    model_url_glb: '',
    model_url_usdz: '',
    is_available: true,
    is_featured: false,
    is_popular: false,
    is_veg: true,
    calories: '',
    preparation_time_mins: '',
    ingredients: '',
    allergens: '',
    dietary_tags: [],
    modelFile: null,
    modelUploading: false,
    modelUploadProgress: 0,
    modelUploadError: null,
    glbFile: null,
    usdzFile: null,
    glbUploading: false,
    usdzUploading: false,
    glbUploadProgress: 0,
    usdzUploadProgress: 0,
    glbUploadError: null,
    usdzUploadError: null,
    // Size options defaults
    has_sizes: false,
    size_selection_required: false,
    sizes: [],
  };
}

const splitList = (raw: string) =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

interface DishFormModalProps {
  item: MenuItem | null;
  categories: Category[];
  currencyLabel: string;
  isSaving: boolean;
  error: string | null;
  onCreateCategory: (name: string) => Promise<Category | null>;
  onSubmit: (payload: DishPayload) => Promise<MenuItem | null | void>;
  onClose: () => void;
}

export default function DishFormModal({
  item,
  categories,
  currencyLabel,
  isSaving,
  error,
  onCreateCategory,
  onSubmit,
  onClose,
}: DishFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(item, categories));
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
const categoryPortalRef = useRef<HTMLUListElement>(null);
  const { toast, prompt } = useDashboardDialogs();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDietaryTag = (tag: string) =>
    setForm((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter((t) => t !== tag)
        : [...prev.dietary_tags, tag],
    }));

  const glbInputRef = useRef<HTMLInputElement>(null);
  const usdzInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!categoryOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        (categoryRef.current && categoryRef.current.contains(e.target as Node)) ||
        (categoryPortalRef.current && categoryPortalRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setCategoryOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [categoryOpen]);

  type ModelSlot = 'glb' | 'usdz';

  const validateModelFile = (file: File, slot: ModelSlot): string | null => {
    const name = file.name.toLowerCase();
    if (file.size <= 0) return 'That file is empty.';
    if (slot === 'glb') {
      if (!name.endsWith('.glb')) {
        return 'GLB upload requires a self-contained .glb file. Standalone .gltf files with external dependencies are not supported as a single upload.';
      }
    } else {
      if (!name.endsWith('.usdz')) {
        return 'USDZ upload requires a genuine .usdz file for Apple Quick Look. Renaming a GLB to USDZ is not a valid conversion.';
      }
    }
    return null;
  };

  const uploadModelSlot = async (slot: ModelSlot, menuItemId: string, file: File): Promise<any> => {
    const isGlb = slot === 'glb';
    setForm((prev) => isGlb
      ? { ...prev, glbUploading: true, glbUploadProgress: 0, glbUploadError: null }
      : { ...prev, usdzUploading: true, usdzUploadProgress: 0, usdzUploadError: null });

    try {
      const json = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('menu_item_id', menuItemId);
        formData.append('model_type', slot);

        xhr.open('POST', '/api/menu/3d-model');
        xhr.withCredentials = true;
        xhr.upload.onprogress = (event) => {
          const pct = event.lengthComputable ? Math.max(0, Math.min(99, Math.round((event.loaded / event.total) * 100))) : 10;
          setForm((prev) => isGlb ? { ...prev, glbUploadProgress: pct } : { ...prev, usdzUploadProgress: pct });
        };
        xhr.onerror = () => reject(new Error('Network error while uploading the model. Please try again.'));
        xhr.onload = () => {
          let payload: any = null;
          try { payload = JSON.parse(xhr.responseText || '{}'); } catch { payload = null; }
          if (xhr.status >= 200 && xhr.status < 300 && payload?.success) resolve(payload);
          else reject(new Error(payload?.error || `Upload failed (HTTP ${xhr.status}).`));
        };
        xhr.send(formData);
      });

      setForm((prev) => {
        const next = { ...prev } as FormState;
        if (isGlb) {
          next.model_url_glb = json.models?.glb_url || json.model?.url || prev.model_url_glb;
          next.glbFile = null; next.glbUploading = false; next.glbUploadProgress = 100; next.glbUploadError = null;
        } else {
          next.model_url_usdz = json.models?.usdz_url || json.model?.url || prev.model_url_usdz;
          next.usdzFile = null; next.usdzUploading = false; next.usdzUploadProgress = 100; next.usdzUploadError = null;
        }
        if (json.models) {
          if (json.models.glb_url !== undefined) next.model_url_glb = json.models.glb_url || '';
          if (json.models.usdz_url !== undefined) next.model_url_usdz = json.models.usdz_url || '';
        }
        next.modelFile = null; next.modelUploading = false; next.modelUploadProgress = 0; next.modelUploadError = null;
        return next;
      });
      if (isGlb && glbInputRef.current) glbInputRef.current.value = '';
      if (!isGlb && usdzInputRef.current) usdzInputRef.current.value = '';
      toast(isGlb ? 'GLB model uploaded.' : 'USDZ model uploaded.', 'success');
      return json;
    } catch (err: any) {
      const msg = err?.message || 'Upload failed. Please try again.';
      setForm((prev) => isGlb
        ? { ...prev, glbUploading: false, glbUploadError: msg }
        : { ...prev, usdzUploading: false, usdzUploadError: msg });
      throw err;
    }
  };

  const handleModelUpload = async (slot: ModelSlot) => {
    const file = slot === 'glb' ? form.glbFile : form.usdzFile;
    if (!file) return;
    if (!item?.id) {
      const msg = 'Save the dish first, then upload 3D/AR model files so they can be linked to this product.';
      setForm((prev) => slot === 'glb' ? { ...prev, glbUploadError: msg } : { ...prev, usdzUploadError: msg });
      return;
    }
    const busy = slot === 'glb' ? form.glbUploading : form.usdzUploading;
    if (busy) return;
    const err = validateModelFile(file, slot);
    if (err) {
      setForm((prev) => slot === 'glb' ? { ...prev, glbUploadError: err } : { ...prev, usdzUploadError: err });
      return;
    }
    try { await uploadModelSlot(slot, item.id, file); } catch {}
  };

  const selectModelFile = (slot: ModelSlot, file: File) => {
    const err = validateModelFile(file, slot);
    setForm((prev) => slot === 'glb'
      ? { ...prev, glbFile: err ? null : file, glbUploadError: err, glbUploadProgress: 0 }
      : { ...prev, usdzFile: err ? null : file, usdzUploadError: err, usdzUploadProgress: 0 });
    if (err) {
      if (slot === 'glb' && glbInputRef.current) glbInputRef.current.value = '';
      if (slot === 'usdz' && usdzInputRef.current) usdzInputRef.current.value = '';
    }
  };

  const clearModelFile = (slot: ModelSlot) => {
    setForm((prev) => slot === 'glb'
      ? { ...prev, glbFile: null, glbUploadError: null, glbUploadProgress: 0 }
      : { ...prev, usdzFile: null, usdzUploadError: null, usdzUploadProgress: 0 });
    if (slot === 'glb' && glbInputRef.current) glbInputRef.current.value = '';
    if (slot === 'usdz' && usdzInputRef.current) usdzInputRef.current.value = '';
  };

  const removeExistingModel = async (slot: 'glb' | 'usdz' | 'all') => {
    if (!item) return;
    try {
      const res = await fetch(`/api/menu/3d-model?menu_item_id=${item.id}&model_type=${slot}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || 'Failed to remove model.');
      }
      setForm((prev) => ({
        ...prev,
        model_url_glb: (slot === 'glb' || slot === 'all') ? '' : (json.models?.glb_url ?? prev.model_url_glb),
        model_url_usdz: (slot === 'usdz' || slot === 'all') ? '' : (json.models?.usdz_url ?? prev.model_url_usdz),
      }));
      toast(slot === 'all' ? '3D/AR models removed.' : (slot === 'glb' ? 'GLB model removed.' : 'USDZ model removed.'), 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to remove model.', 'error');
    }
  };

  // legacy stubs (UI replaced)
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (_e: React.DragEvent) => { _e.preventDefault(); _e.stopPropagation(); };
  const handleInputChange = (_e: React.ChangeEvent<HTMLInputElement>) => {};

    const handleCategoryChange = async (value: string) => {
    if (value !== '__add_new__') {
      set('category', value);
      return;
    }
    const name = await prompt({
      title: 'Add category',
      label: 'Category name',
      placeholder: 'e.g. Starters, Main Course, Desserts',
      confirmLabel: 'Create category',
      validate: (v) => (!v.trim() ? 'Enter a category name.' : null),
    });
    if (!name || !name.trim()) return;

    setCategoryBusy(true);
    try {
      const created = await onCreateCategory(name.trim());
      if (created?.name) set('category', created.name);
      else toast('Failed to create category.', 'error');
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || form.glbUploading || form.usdzUploading) return;
    const price = parseFloat(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast('Enter a valid price greater than 0.', 'error');
      return;
    }
    const caloriesRaw = form.calories.trim();
    const prepRaw = form.preparation_time_mins.trim();
    const calories = caloriesRaw === '' ? undefined : Math.max(0, Math.trunc(Number(caloriesRaw)));
    const preparation_time_mins =
      prepRaw === '' ? undefined : Math.max(0, Math.trunc(Number(prepRaw)));

    const matchedCategory = categories.find((c) => c.name === form.category);
    const categoryId = matchedCategory?.id || null;

    if (!matchedCategory && form.category) {
      toast(`Category "${form.category}" is no longer available. Please select a valid category.`, 'error');
      return;
    }

    // Validate sizes if enabled
    if (form.has_sizes) {
      const validSizes = form.sizes.filter(s => s.name.trim() && parseFloat(s.price) > 0);
      if (validSizes.length === 0) {
        toast('Add at least one size with a name and price.', 'error');
        return;
      }
      // Check for duplicate size names
      const names = validSizes.map(s => s.name.trim().toLowerCase());
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        toast('Size names must be unique.', 'error');
        return;
      }
    }

    const saved = await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category_id: categoryId,
      image_url: form.image_url.trim(),
      model_url_glb: form.model_url_glb.trim(),
      model_url_usdz: form.model_url_usdz.trim(),
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_popular: form.is_popular,
      is_veg: form.is_veg,
      allergens: splitList(form.allergens),
      dietary_tags: form.dietary_tags,
      ...(calories !== undefined && Number.isFinite(calories) ? { calories } : {}),
      ...(preparation_time_mins !== undefined && Number.isFinite(preparation_time_mins)
        ? { preparation_time_mins }
        : {}),
      ingredients: splitList(form.ingredients),
      rating: item ? Number(item.rating) || 0 : 0,
      order_count: item ? Number(item.order_count) || 0 : 0,
      // Size options
      has_sizes: form.has_sizes,
      size_selection_required: form.has_sizes ? form.size_selection_required : false,
      sizes: form.has_sizes
        ? form.sizes
            .filter(s => s.name.trim() && parseFloat(s.price) > 0)
            .map((s, idx) => ({
              name: s.name.trim(),
              price: parseFloat(s.price),
              position: idx,
              is_available: s.is_available,
            }))
        : [],
    });

    if (!saved) return;

    // If a model file was selected but not uploaded yet, upload it after save so
    // the workflow "select -> save -> upload -> persist" completes in one action.
    if (saved?.id && (false as any)) {
      try {
        const json = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('file', (false as any) as File);
          formData.append('menu_item_id', saved.id);

          setForm((prev) => ({ ...prev, modelUploading: true, modelUploadProgress: 0, modelUploadError: null }));
          xhr.open('POST', '/api/menu/3d-model');
          xhr.withCredentials = true;
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const pct = Math.max(0, Math.min(99, Math.round((event.loaded / event.total) * 100)));
              setForm((prev) => ({ ...prev, modelUploadProgress: pct }));
            } else {
              setForm((prev) => ({ ...prev, modelUploadProgress: prev.modelUploadProgress || 10 }));
            }
          };
          xhr.onerror = () => reject(new Error('Network error while uploading the model. Please try again.'));
          xhr.onload = () => {
            let payload: any = null;
            try {
              payload = JSON.parse(xhr.responseText || '{}');
            } catch {
              payload = null;
            }
            if (xhr.status >= 200 && xhr.status < 300 && payload?.success) {
              resolve(payload);
            } else {
              reject(new Error(payload?.error || `Upload failed (HTTP ${xhr.status}).`));
            }
          };
          xhr.send(formData);
        });

        setForm((prev) => ({
          ...prev,
          model_url_glb: json.model?.mimeType === 'model/gltf-binary' ? json.model.url : prev.model_url_glb,
          model_url_usdz: json.model?.mimeType === 'model/vnd.usdz+zip' ? json.model.url : prev.model_url_usdz,
          modelFile: null,
          modelUploading: false,
          modelUploadProgress: 100,
          modelUploadError: null,
        }));
        if (glbInputRef.current) glbInputRef.current.value = '';
        toast('Dish saved and 3D model uploaded.', 'success');
        onClose();
        return;
      } catch (err: any) {
        setForm((prev) => ({
          ...prev,
          modelUploading: false,
          modelUploadError: err?.message || 'Dish saved, but 3D model upload failed. Please try uploading again.',
        }));
        toast('Dish saved, but 3D model upload failed. Please upload the model again.', 'error');
        return;
      }
    }

    toast(item ? 'Dish saved.' : 'Dish added.', 'success');
    onClose();
  };

  const photoPreview = form.image_url.trim();
  const modelPreview = form.model_url_glb.trim();
  const has3D = Boolean(form.model_url_glb.trim() || form.model_url_usdz.trim());

  // Supported formats for the file input accept attribute
  const ACCEPTED_3D_FORMATS = '.glb,.gltf,.usdz,.obj,.fbx,.stl,.ply,.3ds,.dae,model/gltf-binary,model/gltf+json,model/vnd.usdz+zip,model/obj';

  const checkboxStyle: React.CSSProperties = {
    width: 15,
    height: 15,
    accentColor: '#B8A47A',
    cursor: 'pointer',
    flexShrink: 0,
  };

  const toggleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ background: 'rgba(6,5,4,0.86)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving && !form.modelUploading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={item ? 'Edit dish' : 'Add dish'}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-warm)',
          borderRadius: 10,
           overflow: 'visible',
           margin: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '1.375rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
              {item ? 'Edit Dish' : 'New Dish'}
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: '0.25rem 0 0',
                lineHeight: 1.2,
              }}
            >
              {item ? item.name : 'Add a dish to your menu'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid var(--border-warm)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* ---------- Essentials ---------- */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
                <div>
                  <label className="d3-label" htmlFor="dish-name">
                    Dish Name
                  </label>
                  <input
                    id="dish-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Name of the dish"
                    className="d3-input"
                  />
                </div>
                <div>
<label className="d3-label" htmlFor="dish-price">
                     Price ({currencyLabel} INR)
                   </label>
                  <input
                    id="dish-price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="0.00"
                    className="d3-input"
                  />
                </div>
              </div>

              {/* ---------- Size Options ---------- */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
                    Size Options
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={form.has_sizes}
                      onChange={(e) => set('has_sizes', e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                    Enable size variants
                  </label>
                </div>

                {form.has_sizes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-dimmed)', lineHeight: 1.5 }}>
                      Add size variants with custom names and prices. Customers must select a size when ordering.
                    </p>

                    {form.sizes.map((size, index) => (
                      <div key={size.id || index} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={size.name}
                          onChange={(e) => {
                            const newSizes = [...form.sizes];
                            newSizes[index] = { ...newSizes[index], name: e.target.value };
                            set('sizes', newSizes);
                          }}
                          placeholder="Size name (e.g. Small, Medium, Large)"
                          className="d3-input"
                          style={{ flex: '1 1 180px', minWidth: 150 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          <span>{currencyLabel}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={size.price}
                            onChange={(e) => {
                              const newSizes = [...form.sizes];
                              newSizes[index] = { ...newSizes[index], price: e.target.value };
                              set('sizes', newSizes);
                            }}
                            placeholder="0.00"
                            className="d3-input"
                            style={{ width: 100 }}
                          />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={size.is_available}
                            onChange={(e) => {
                              const newSizes = [...form.sizes];
                              newSizes[index] = { ...newSizes[index], is_available: e.target.checked };
                              set('sizes', newSizes);
                            }}
                            style={{ width: 14, height: 14, accentColor: 'var(--gold)' }}
                          />
                          Available
                        </label>
                        {form.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSizes = form.sizes.filter((_, i) => i !== index);
                              set('sizes', newSizes);
                            }}
                            style={{
                              padding: '0.375rem 0.625rem',
                              background: 'transparent',
                              border: '1px solid rgba(200,80,80,0.3)',
                              borderRadius: 6,
                              color: '#FCA5A5',
                              fontSize: '0.625rem',
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newSizes = [...form.sizes, { name: '', price: '', position: form.sizes.length, is_available: true }];
                        set('sizes', newSizes);
                      }}
                      className="d3-btn-inline"
                      style={{ width: 'fit-content', borderStyle: 'dashed' }}
                    >
                      + Add Size
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: '0.5rem', borderTop: '1px solid var(--border-warm)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={form.size_selection_required}
                          onChange={(e) => set('size_selection_required', e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: 'var(--gold)' }}
                        />
                        Require size selection (customer must choose a size before adding to cart)
                      </label>
                    </div>
                  </div>
                )}
              </section>

              <div>
                <label className="d3-label" htmlFor="dish-description">
                  Description
                </label>
                <textarea
                  id="dish-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Ingredients, taste profile, chef commentary…"
                  className="d3-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <label className="d3-label" htmlFor="dish-category">
                    Category
                  </label>
                  <div ref={categoryRef} style={{ position: 'relative' }}>
                    <button
                      id="dish-category"
                      type="button"
                      disabled={categoryBusy}
                      onClick={() => setCategoryOpen((o) => !o)}
                      className="d3-input"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textAlign: 'left',
                        cursor: categoryBusy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span style={{ color: form.category ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {form.category || 'Select category'}
                      </span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {categoryOpen && (
                      <ul
                        ref={categoryPortalRef}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 60,
                          margin: 0,
                          padding: '0.375rem',
                          listStyle: 'none',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-warm)',
                          borderRadius: 10,
                          boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
                          maxHeight: 240,
                          overflowY: 'auto',
                        }}
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              set('category', '');
                              setCategoryOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.5rem 0.625rem',
                              borderRadius: 6,
                              border: 'none',
                              background: form.category === '' ? 'rgba(201,169,110,0.08)' : 'transparent',
                              color: form.category === '' ? 'var(--gold)' : 'var(--text-secondary)',
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                            }}
                          >
                            Select category
                          </button>
                        </li>
                        {categories.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => {
                                set('category', c.name);
                                setCategoryOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '0.5rem 0.625rem',
                                borderRadius: 6,
                                border: 'none',
                                background: form.category === c.name ? 'rgba(201,169,110,0.08)' : 'transparent',
                                color: form.category === c.name ? 'var(--gold)' : 'var(--text-secondary)',
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                              }}
                            >
                              {c.name}
                            </button>
                          </li>
                        ))}
                        <li style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={async () => {
                              setCategoryOpen(false);
                              await handleCategoryChange('__add_new__');
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.5rem 0.625rem',
                              borderRadius: 6,
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--gold)',
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            + Add New Category
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
                <div>
                  <label className="d3-label" htmlFor="dish-calories">
                    Calories (kcal)
                  </label>
                  <input
                    id="dish-calories"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={form.calories}
                    onChange={(e) => set('calories', e.target.value)}
                    placeholder="Optional"
                    className="d3-input"
                  />
                </div>
                <div>
                  <label className="d3-label" htmlFor="dish-prep">
                    Prep Time (mins)
                  </label>
                  <input
                    id="dish-prep"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={form.preparation_time_mins}
                    onChange={(e) => set('preparation_time_mins', e.target.value)}
                    placeholder="Optional"
                    className="d3-input"
                  />
                </div>
              </div>
            </section>

            {/* ---------- Photography ---------- */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <MenuImageUploader
                value={form.image_url}
                onChange={(url) => set('image_url', url)}
                onRemove={() => set('image_url', '')}
                menuItemId={item?.id || ''}
                disabled={isSaving}
              />
            </section>

            {/* ---------- 3D Experience (optional) ---------- */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
                  3D Experience — Optional
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {form.model_url_glb ? <span className="d3-chip d3-chip-3d">GLB ready</span> : <span className="d3-chip">No GLB</span>}
                  {form.model_url_usdz ? <span className="d3-chip d3-chip-3d">USDZ ready</span> : <span className="d3-chip">No USDZ</span>}
                </div>
              </div>

              {/* Independent GLB / USDZ uploads (formats are not mutually required) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ border: '1px solid var(--border-warm)', borderRadius: 10, background: 'var(--bg-secondary)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>GLB (3D & Android AR)</span>
                    <span className={form.model_url_glb ? 'd3-chip d3-chip-3d' : 'd3-chip'}>{form.model_url_glb ? 'Uploaded' : 'Not uploaded'}</span>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Self-contained .glb file. Enables 3D preview and AR on compatible Android devices (Scene Viewer). Not required for Apple AR.</span>
                  <input ref={glbInputRef} type="file" accept=".glb,model/gltf-binary" style={{ display: 'none' }} disabled={form.glbUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) selectModelFile('glb', f); e.target.value = ''; }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button type="button" className="d3-btn-quiet" style={{ padding: '0.45rem 0.75rem', fontSize: '0.6875rem' }} disabled={form.glbUploading || isSaving} onClick={() => glbInputRef.current?.click()}>
                      {form.glbFile ? 'Replace selected GLB' : form.model_url_glb ? 'Replace GLB file' : 'Upload GLB'}
                    </button>
                    {form.model_url_glb ? (
                      <button type="button" className="d3-btn-subtle" style={{ padding: '0.45rem 0.75rem', fontSize: '0.6875rem' }} disabled={form.glbUploading || isSaving} onClick={() => removeExistingModel('glb')}>Remove GLB</button>
                    ) : null}
                  </div>
                  {form.glbFile ? (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-primary)' }}>
                      Selected: {form.glbFile.name} ({formatBytes(form.glbFile.size)})
                      {form.glbUploading ? (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ height: 4, background: 'var(--bg-surface-2)', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${form.glbUploadProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 300ms' }} /></div>
                          <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>Uploading… {form.glbUploadProgress}%</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <button type="button" className="d3-btn-quiet" style={{ padding: '0.35rem 0.65rem', fontSize: '0.625rem' }} onClick={() => handleModelUpload('glb')} disabled={isSaving}>{item?.id ? 'Upload GLB now' : 'Will upload on save'}</button>
                          <button type="button" className="d3-btn-subtle" style={{ padding: '0.35rem 0.65rem', fontSize: '0.625rem' }} onClick={() => clearModelFile('glb')}>Clear selection</button>
                        </div>
                      )}
                    </div>
                  ) : null}
                  {form.glbUploadError ? <span style={{ fontSize: '0.6875rem', color: '#FCA5A5' }}>{form.glbUploadError}</span> : null}
                </div>

                <div style={{ border: '1px solid var(--border-warm)', borderRadius: 10, background: 'var(--bg-secondary)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>USDZ (Apple AR)</span>
                    <span className={form.model_url_usdz ? 'd3-chip d3-chip-3d' : 'd3-chip'}>{form.model_url_usdz ? 'Uploaded' : 'Not uploaded'}</span>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Genuine .usdz export of the same model. Enables AR on compatible iPhone/iPad (Quick Look). Not required for Android AR. Renaming a file is not a valid conversion.</span>
                  <input ref={usdzInputRef} type="file" accept=".usdz,model/vnd.usdz+zip" style={{ display: 'none' }} disabled={form.usdzUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) selectModelFile('usdz', f); e.target.value = ''; }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button type="button" className="d3-btn-quiet" style={{ padding: '0.45rem 0.75rem', fontSize: '0.6875rem' }} disabled={form.usdzUploading || isSaving} onClick={() => usdzInputRef.current?.click()}>
                      {form.usdzFile ? 'Replace selected USDZ' : form.model_url_usdz ? 'Replace USDZ file' : 'Upload USDZ'}
                    </button>
                    {form.model_url_usdz ? (
                      <button type="button" className="d3-btn-subtle" style={{ padding: '0.45rem 0.75rem', fontSize: '0.6875rem' }} disabled={form.usdzUploading || isSaving} onClick={() => removeExistingModel('usdz')}>Remove USDZ</button>
                    ) : null}
                  </div>
                  {form.usdzFile ? (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-primary)' }}>
                      Selected: {form.usdzFile.name} ({formatBytes(form.usdzFile.size)})
                      {form.usdzUploading ? (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ height: 4, background: 'var(--bg-surface-2)', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${form.usdzUploadProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 300ms' }} /></div>
                          <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)' }}>Uploading… {form.usdzUploadProgress}%</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <button type="button" className="d3-btn-quiet" style={{ padding: '0.35rem 0.65rem', fontSize: '0.625rem' }} onClick={() => handleModelUpload('usdz')} disabled={isSaving}>{item?.id ? 'Upload USDZ now' : 'Will upload on save'}</button>
                          <button type="button" className="d3-btn-subtle" style={{ padding: '0.35rem 0.65rem', fontSize: '0.625rem' }} onClick={() => clearModelFile('usdz')}>Clear selection</button>
                        </div>
                      )}
                    </div>
                  ) : null}
                  {form.usdzUploadError ? <span style={{ fontSize: '0.6875rem', color: '#FCA5A5' }}>{form.usdzUploadError}</span> : null}
                </div>
              </div>

              <div className="d3-note" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span><strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>AR availability by uploaded format (independent):</strong></span>
                <span>• Android AR (Scene Viewer): {form.model_url_glb ? 'Enabled — GLB uploaded.' : 'Not available on Android — upload a GLB to enable.'}</span>
                <span>• Apple AR (Quick Look): {form.model_url_usdz ? 'Enabled — USDZ uploaded.' : 'Not available on Apple devices — upload a USDZ to enable.'}</span>
                <span>• You do not need both formats. If both are uploaded, the correct format is selected automatically for the customer’s device. 3D preview remains available when a GLB is present.</span>
                {!item?.id ? <span style={{ color: 'var(--gold)' }}>Save the dish first to upload and persist model files to this product.</span> : null}
              </div>

              {(modelPreview || form.model_url_usdz.trim()) && !form.glbFile && !form.usdzFile ? (
                <div
                  style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid var(--border-warm)',
                    height: 180,
                  }}
                >
                  <FoodModelViewer
                    modelUrlGlb={modelPreview || undefined}
                    modelUrlUsdz={form.model_url_usdz.trim() || undefined}
                    altText={form.name || '3D preview'}
                    className="h-full w-full"
                  />
                </div>
              ) : null}
            </section>

            {/* ---------- Composition ---------- */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
                  Composition
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <label className="d3-label" htmlFor="dish-ingredients">
                    Ingredients
                  </label>
                  <input
                    id="dish-ingredients"
                    type="text"
                    value={form.ingredients}
                    onChange={(e) => set('ingredients', e.target.value)}
                    placeholder="Separate each ingredient with a comma"
                    className="d3-input"
                  />
                </div>
                <div>
                  <label className="d3-label" htmlFor="dish-allergens">
                    Allergens
                  </label>
                  <input
                    id="dish-allergens"
                    type="text"
                    value={form.allergens}
                    onChange={(e) => set('allergens', e.target.value)}
                    placeholder="Separate each allergen with a comma"
                    className="d3-input"
                  />
                </div>
              </div>

              <div>
                <span className="d3-label">Dietary Tags</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AVAILABLE_DIETARY.map((tag) => {
                    const active = form.dietary_tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDietaryTag(tag)}
                        className="d3-btn-inline"
                        style={
                          active
                            ? {
                                background: 'rgba(201,169,110,0.08)',
                                borderColor: 'rgba(201,169,110,0.3)',
                                color: 'var(--gold)',
                              }
                            : undefined
                        }
                        aria-pressed={active}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 20,
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-warm)',
                }}
              >
                <label style={toggleRowStyle}>
                  <input
                    type="checkbox"
                    checked={form.is_veg}
                    onChange={(e) => set('is_veg', e.target.checked)}
                    style={checkboxStyle}
                  />
                  Vegetarian
                </label>
                <label style={toggleRowStyle}>
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => set('is_available', e.target.checked)}
                    style={checkboxStyle}
                  />
                  Available
                </label>
                <label style={toggleRowStyle}>
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => set('is_featured', e.target.checked)}
                    style={checkboxStyle}
                  />
                  Featured
                </label>
                <label style={toggleRowStyle}>
                  <input
                    type="checkbox"
                    checked={form.is_popular}
                    onChange={(e) => set('is_popular', e.target.checked)}
                    style={checkboxStyle}
                  />
                  Popular
                </label>
              </div>
            </section>

            {error && (
              <p
                role="alert"
                style={{
                  margin: 0,
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(200,80,80,0.07)',
                  border: '1px solid rgba(200,80,80,0.2)',
                  color: '#FCA5A5',
                  fontSize: '0.75rem',
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '1.125rem 1.75rem',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
            }}
          >
            <button type="button" className="d3-btn-subtle" onClick={onClose} disabled={isSaving || form.modelUploading}>
              Cancel
            </button>
            <button type="submit" className="d3-btn-quiet" disabled={isSaving || form.modelUploading}>
              {isSaving ? 'Saving…' : form.modelUploading ? 'Uploading 3D model…' : item ? 'Save Changes' : 'Add Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
