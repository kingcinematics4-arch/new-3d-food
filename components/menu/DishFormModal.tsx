'use client';

import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Category, MenuItem } from '@/lib/useHotel';
import { CubeIcon } from './DishCard';
import { formatBytes } from '@/lib/foodModel';

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
  calories: number;
  preparation_time_mins: number;
  ingredients: string[];
  rating: number;
  order_count: number;
}

interface FormState {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  model_url_glb: string;
  model_url_usdz: string;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_veg: boolean;
  calories: number;
  preparation_time_mins: number;
  ingredients: string;
  allergens: string;
  dietary_tags: string[];
  // 3D model upload state
  modelFile: File | null;
  modelUploading: boolean;
  modelUploadProgress: number;
  modelUploadError: string | null;
}

function initialState(item: MenuItem | null, categories: Category[]): FormState {
  if (item) {
    return {
      name: item.name,
      description: item.description || '',
      price: Number(item.price) || 0,
      category: item.category || '',
      image_url: item.image_url || '',
      model_url_glb: item.model_url_glb || '',
      model_url_usdz: item.model_url_usdz || '',
      is_available: item.is_available,
      is_featured: item.is_featured,
      is_popular: item.is_popular,
      is_veg: item.is_veg,
      calories: item.calories ?? 0,
      preparation_time_mins: item.preparation_time_mins ?? 0,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '',
      allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : '',
      dietary_tags: Array.isArray(item.dietary_tags) ? item.dietary_tags : [],
      modelFile: null,
      modelUploading: false,
      modelUploadProgress: 0,
      modelUploadError: null,
    };
  }

  return {
    name: '',
    description: '',
    price: 0,
    category: categories[0]?.name || '',
    image_url: '',
    // A dish is a dish first — 3D stays opt-in, never pre-attached.
    model_url_glb: '',
    model_url_usdz: '',
    is_available: true,
    is_featured: false,
    is_popular: false,
    is_veg: true,
    calories: 0,
    preparation_time_mins: 0,
    ingredients: '',
    allergens: '',
    dietary_tags: [],
    modelFile: null,
    modelUploading: false,
    modelUploadProgress: 0,
    modelUploadError: null,
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
  onCreateCategory: (name: string) => Promise<boolean>;
  onSubmit: (payload: DishPayload) => Promise<void>;
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

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDietaryTag = (tag: string) =>
    setForm((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter((t) => t !== tag)
        : [...prev.dietary_tags, tag],
    }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModelUpload = async () => {
    if (!form.modelFile || !item) return;

    setForm((prev) => ({ ...prev, modelUploading: true, modelUploadProgress: 0, modelUploadError: null }));

    try {
      const formData = new FormData();
      formData.append('file', form.modelFile);
      formData.append('menu_item_id', item.id);

      const res = await fetch('/api/menu/3d-model', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      setForm((prev) => ({
        ...prev,
        model_url_glb: json.model.mimeType === 'model/gltf-binary' ? json.model.url : prev.model_url_glb,
        model_url_usdz: json.model.mimeType === 'model/vnd.usdz+zip' ? json.model.url : prev.model_url_usdz,
        modelFile: null,
        modelUploading: false,
        modelUploadProgress: 100,
      }));
    } catch (err: any) {
      setForm((prev) => ({
        ...prev,
        modelUploading: false,
        modelUploadError: err.message || 'Upload failed',
      }));
    }
  };

  const handleFileSelect = (file: File) => {
    setForm((prev) => ({ ...prev, modelFile: file, modelUploadError: null }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearModelFile = () => {
    setForm((prev) => ({ ...prev, modelFile: null, modelUploadError: null }));
  };

  const removeExistingModel = async () => {
    if (!item) return;
    try {
      await fetch(`/api/menu/3d-model?menu_item_id=${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setForm((prev) => ({
        ...prev,
        model_url_glb: '',
        model_url_usdz: '',
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to remove model');
    }
  };

  const handleCategoryChange = async (value: string) => {
    if (value !== '__add_new__') {
      set('category', value);
      return;
    }
    const name = window.prompt('Enter new category name:');
    if (!name || !name.trim()) return;

    setCategoryBusy(true);
    try {
      const created = await onCreateCategory(name.trim());
      if (created) set('category', name.trim());
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedCategory = categories.find((c) => c.name === form.category);
    const categoryId = matchedCategory?.id || null;

    if (!matchedCategory && form.category) {
      throw new Error(`Category "${form.category}" no longer exists. Please select a valid category.`);
    }

    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
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
      calories: Number(form.calories) || 0,
      preparation_time_mins: Number(form.preparation_time_mins) || 0,
      ingredients: splitList(form.ingredients),
      rating: item ? Number(item.rating) || 0 : 0,
      order_count: item ? Number(item.order_count) || 0 : 0,
    });
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
        if (e.target === e.currentTarget && !isSaving) onClose();
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
          overflow: 'hidden',
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
                    Price ({currencyLabel})
                  </label>
                  <input
                    id="dish-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={Number.isFinite(form.price) ? form.price : ''}
                    onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                    className="d3-input"
                  />
                </div>
              </div>

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
                  <select
                    id="dish-category"
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={categoryBusy}
                    className="d3-input"
                  >
                    {categories.length === 0 && <option value="">No categories yet</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__add_new__">+ Add new category</option>
                  </select>
                </div>
                <div>
                  <label className="d3-label" htmlFor="dish-calories">
                    Calories (kcal)
                  </label>
                  <input
                    id="dish-calories"
                    type="number"
                    min="0"
                    value={Number.isFinite(form.calories) ? form.calories : ''}
                    onChange={(e) => set('calories', parseInt(e.target.value) || 0)}
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
                    min="0"
                    value={Number.isFinite(form.preparation_time_mins) ? form.preparation_time_mins : ''}
                    onChange={(e) => set('preparation_time_mins', parseInt(e.target.value) || 0)}
                    className="d3-input"
                  />
                </div>
              </div>
            </section>

            {/* ---------- Photography ---------- */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
                  Food Photography
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 148,
                    height: 111,
                    flexShrink: 0,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid var(--border-warm)',
                    background: 'var(--bg-secondary)',
                    position: 'relative',
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5625rem',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--text-dimmed)',
                      }}
                    >
                      No photo
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label className="d3-label" htmlFor="dish-image">
                    Food Image URL
                  </label>
                  <input
                    id="dish-image"
                    type="url"
                    value={form.image_url}
                    onChange={(e) => set('image_url', e.target.value)}
                    placeholder="https://your-cdn.com/dish.jpg"
                    className="d3-input"
                  />
                  <p
                    style={{
                      margin: '0.5rem 0 0',
                      fontSize: '0.6875rem',
                      lineHeight: 1.6,
                      color: 'var(--text-dimmed)',
                    }}
                  >
                    This photograph is what guests see on your menu. It is the dish&apos;s
                    primary visual.
                  </p>
                </div>
              </div>
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
                {has3D ? (
                  <span className="d3-chip d3-chip-3d">
                    <CubeIcon size={10} />
                    3D Available
                  </span>
                ) : (
                  <span className="d3-chip">No 3D model attached</span>
                )}
              </div>

              {/* File upload area — drag & drop or choose file */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  border: form.modelFile ? '2px dashed var(--gold)' : '2px dashed var(--border-warm)',
                  borderRadius: 10,
                  background: form.modelFile ? 'rgba(201,169,110,0.05)' : 'var(--bg-secondary)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  position: 'relative',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_3D_FORMATS}
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                  disabled={form.modelUploading}
                />

                {form.modelFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      style={{ color: 'var(--gold)' }}
                      aria-hidden="true"
                    >
                      <path d="M16 4L28 12V24L16 32L4 24V12L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M16 4V32M4 12L16 20L28 12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinejoin="round" />
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {form.modelFile.name}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {formatBytes(form.modelFile.size)}
                      </span>
                    </div>

                    {form.modelUploading && (
                      <div style={{ width: '100%', maxWidth: 300, marginTop: 8 }}>
                        <div
                          style={{
                            height: 4,
                            background: 'var(--bg-surface-2)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${form.modelUploadProgress}%`,
                              height: '100%',
                              background: 'var(--gold)',
                              borderRadius: 2,
                              transition: 'width 300ms',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)', marginTop: 4 }}>
                          Uploading... {form.modelUploadProgress}%
                        </span>
                      </div>
                    )}

                    {!form.modelUploading && form.modelUploadError && (
                      <span style={{ fontSize: '0.6875rem', color: '#FCA5A5' }}>
                        {form.modelUploadError}
                      </span>
                    )}

                    {!form.modelUploading && !form.modelUploadError && (
                      <button
                        type="button"
                        onClick={handleModelUpload}
                        className="d3-btn-quiet"
                        style={{ marginTop: 8, padding: '0.5rem 1rem' }}
                      >
                        Upload Model
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={clearModelFile}
                      style={{
                        marginTop: 8,
                        padding: '0.375rem 0.75rem',
                        background: 'transparent',
                        border: '1px solid var(--border-warm)',
                        borderRadius: 6,
                        color: 'var(--text-muted)',
                        fontSize: '0.6875rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      style={{ color: 'var(--text-dimmed)', opacity: 0.5 }}
                      aria-hidden="true"
                    >
                      <path d="M20 8L32 16V28L20 36L8 28V16L20 8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      <path d="M20 8V36M8 16L20 24L32 16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Drag & drop a 3D model here
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                        or click to browse
                      </span>
                    </div>
                    <span style={{ fontSize: '0.5625rem', color: 'var(--text-dimmed)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      GLB, GLTF, USDZ, OBJ, FBX, STL, PLY, 3DS, DAE
                    </span>
                  </div>
                )}
              </div>

              {/* Existing model preview + remove option */}
              {has3D && !form.modelFile && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 60,
                        height: 45,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid var(--border-warm)',
                        background: 'var(--bg-secondary)',
                        position: 'relative',
                      }}
                    >
                      {modelPreview ? (
                        <FoodModelViewer
                          modelUrlGlb={modelPreview}
                          modelUrlUsdz={form.model_url_usdz.trim() || undefined}
                          altText={form.name || '3D preview'}
                          className="h-full w-full"
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: 'var(--text-dimmed)' }}>
                          USDZ
                        </div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Current model attached
                      </span>
                      <span style={{ fontSize: '0.5625rem', color: 'var(--text-dimmed)', display: 'block' }}>
                        {form.model_url_glb ? 'GLB' : 'USDZ'} · Ready to view
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeExistingModel}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: 'transparent',
                      border: '1px solid rgba(200,80,80,0.3)',
                      borderRadius: 6,
                      color: '#FCA5A5',
                      fontSize: '0.6875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Remove Model
                  </button>
                </div>
              )}

              {/* Quick presets */}
              <div className="d3-note">
                <span>
                  3D is an <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>optional</strong>{' '}
                  enhancement. Upload a GLB or USDZ for the best 3D viewing experience. Other formats
                  (OBJ, FBX, STL, PLY, 3DS, DAE) are accepted and stored but will show a placeholder
                  in the 3D viewer — the food photograph stays the primary visual either way.
                </span>
              </div>

              {/* Preview only when a model is actually attached */}
              {(modelPreview || form.model_url_usdz.trim()) && !form.modelFile && (
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
              )}
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
            <button type="button" className="d3-btn-subtle" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="d3-btn-quiet" disabled={isSaving}>
              {isSaving ? 'Saving…' : item ? 'Save Changes' : 'Add Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
