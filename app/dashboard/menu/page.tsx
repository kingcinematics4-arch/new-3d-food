'use client';

import React, { useMemo, useState } from 'react';
import DishCard from '@/components/menu/DishCard';
import DishFormModal, { type DishPayload } from '@/components/menu/DishFormModal';
import Dish3DModal from '@/components/menu/Dish3DModal';
import { formatPrice, resolveCurrency } from '@/lib/menu';
import { useHotel, useMenuItems, useCategories, MenuItem, Category } from '@/lib/useHotel';

const ALL_CATEGORIES = 'All';

export default function MenuManagementPage() {
  const { hotel } = useHotel();
  const { items: menuItems, loading, error: loadError, refetch: refetchItems } = useMenuItems(hotel?.id || null);
  const { categories: categoryList, refetch: refetchCategories, createCategory } = useCategories(
    hotel?.id || null
  );

  const hotelId = hotel?.id || '';
  const currencyLabel = resolveCurrency(hotel?.currency).symbol.trim() || '$';

  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [inspectItem, setInspectItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---------------- helpers ---------------- */

  const categoryNameOf = (item: MenuItem): string => {
    if (item.category) return item.category;
    if (item.category_id) {
      return categoryList.find((c: Category) => c.id === item.category_id)?.name || '';
    }
    return '';
  };

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...categoryList.map((c: Category) => c.name)],
    [categoryList]
  );

  const countForCategory = (cat: string) =>
    cat === ALL_CATEGORIES
      ? menuItems.length
      : menuItems.filter((i: MenuItem) => categoryNameOf(i) === cat).length;

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item: MenuItem) =>
        selectedCategory === ALL_CATEGORIES ? true : categoryNameOf(item) === selectedCategory
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menuItems, selectedCategory, categoryList]
  );

  const modelCount = menuItems.filter(
    (i: MenuItem) => Boolean(i.model_url_glb?.trim() || i.model_url_usdz?.trim())
  ).length;

  const photoCount = menuItems.filter((i: MenuItem) => Boolean(i.image_url?.trim())).length;

  const priceOf = (item: MenuItem) => formatPrice(item.price, hotel?.currency);

  /* ---------------- actions ---------------- */

  const openCreate = () => {
    setEditingItem(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload: DishPayload) => {
    setIsSaving(true);
    setFormError(null);
    try {
      if (!hotelId) {
        throw new Error('Your restaurant could not be resolved. Please refresh and try again.');
      }
      const res = editingItem
        ? await fetch(`/api/menu/${editingItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotel_id: hotelId, ...payload }),
          });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to save dish');
      }

      await refetchItems();
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save dish');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async (name: string): Promise<boolean> => {
    const created = await createCategory(name);
    await refetchCategories();
    return Boolean(created);
  };

  const handleAddCategory = async () => {
    const name = window.prompt('Enter category name:');
    if (name && name.trim()) {
      await createCategory(name.trim());
      await refetchCategories();
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm(`Delete “${item.name}” from your menu?`)) return;
    try {
      const res = await fetch(`/api/menu/${item.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete dish');
      await refetchItems();
    } catch (err: any) {
      window.alert(err?.message || 'Failed to delete dish');
    }
  };

  const toggleFlag = async (item: MenuItem, field: 'is_available' | 'is_featured') => {
    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !item[field] }),
      });
      const json = await res.json();
      if (json.success) await refetchItems();
    } catch (err: any) {
      window.alert(err?.message || 'Failed to update dish');
    }
  };

  /* ---------------- render ---------------- */

  const hasNoDishesAtAll = !loading && menuItems.length === 0;

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto">

      {/* ================= Page header ================= */}
      <header
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5"
      >
        <div>
          <span className="d3-eyebrow" style={{ fontSize: '0.5625rem' }}>
            Menu &amp; 3D Models
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              margin: '0.5rem 0 0',
            }}
          >
            Menu
          </h1>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              maxWidth: '56ch',
            }}
          >
            Manage dishes, categories, food photography and optional 3D experiences.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="d3-btn-quiet"
          style={{ flexShrink: 0, opacity: loading || !hotelId ? 0.5 : 1, cursor: loading || !hotelId ? 'not-allowed' : 'pointer' }}
          disabled={loading || !hotelId}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1.5V10.5M1.5 6H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Add Dish
        </button>
      </header>

      {/* ================= At-a-glance ================= */}
      {!hasNoDishesAtAll && !loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 28,
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border-warm)',
          }}
        >
          {[
            { label: 'Dishes', value: menuItems.length },
            { label: 'Categories', value: categoryList.length },
            { label: 'With photography', value: photoCount },
            { label: '3D ready', value: modelCount },
          ].map((stat) => (
            <div key={stat.label}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.375rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dimmed)',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ================= Category filter ================= */}
      {!hasNoDishesAtAll && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '0.375rem 0.875rem',
                  borderRadius: 100,
                  background: active ? 'rgba(201,169,110,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(201,169,110,0.22)' : '1px solid var(--border-warm)',
                  color: active ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 200ms, border-color 200ms, color 200ms',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {cat}
                <span style={{ color: 'var(--text-dimmed)', fontSize: '0.6875rem' }}>{countForCategory(cat)}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleAddCategory}
            className="d3-btn-inline"
            style={{ borderStyle: 'dashed' }}
          >
            + Category
          </button>
        </div>
      )}

      {/* ================= Grid ================= */}
      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          aria-busy="true"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--border-warm)',
                background: 'var(--bg-surface)',
              }}
            >
              <div style={{ aspectRatio: '4 / 3', background: 'var(--bg-secondary)' }} />
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 10, width: '35%', borderRadius: 4, background: 'var(--bg-surface-3)' }} />
                <div style={{ height: 18, width: '70%', borderRadius: 4, background: 'var(--bg-surface-3)' }} />
                <div style={{ height: 10, width: '90%', borderRadius: 4, background: 'var(--bg-surface-2)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <EmptyPanel
          title="Could not load your menu"
          body={loadError}
          actionLabel="Try again"
          onAction={() => refetchItems()}
        />
      ) : hasNoDishesAtAll ? (
        /* ---------- Empty state ---------- */
        <EmptyPanel
          title="No dishes yet"
          body="Add your first dish to start building your digital menu."
          actionLabel="Add Dish"
          onAction={openCreate}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyPanel
          title={`Nothing in ${selectedCategory}`}
          body="This part of your menu is still empty. Add a dish or choose another category."
          actionLabel={selectedCategory === ALL_CATEGORIES ? 'Add Dish' : 'View all dishes'}
          onAction={() =>
            selectedCategory === ALL_CATEGORIES ? openCreate() : setSelectedCategory(ALL_CATEGORIES)
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {filteredItems.map((item: MenuItem) => (
            <DishCard
              key={item.id}
              item={item}
              categoryName={categoryNameOf(item)}
              priceLabel={priceOf(item)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleAvailable={(i) => toggleFlag(i, 'is_available')}
              onToggleFeatured={(i) => toggleFlag(i, 'is_featured')}
              onView3D={setInspectItem}
            />
          ))}
        </div>
      )}

      {/* ================= Add / Edit ================= */}
      {isFormOpen && (
        <DishFormModal
          key={editingItem?.id || 'new-dish'}
          item={editingItem}
          categories={categoryList}
          currencyLabel={currencyLabel}
          isSaving={isSaving}
          error={formError}
          onCreateCategory={handleCreateCategory}
          onSubmit={handleSubmit}
          onClose={() => {
            if (!isSaving) {
              setIsFormOpen(false);
              setEditingItem(null);
              setFormError(null);
            }
          }}
        />
      )}

      {/* ================= Optional 3D viewer ================= */}
      <Dish3DModal
        item={inspectItem}
        priceLabel={inspectItem ? priceOf(inspectItem) : ''}
        categoryName={inspectItem ? categoryNameOf(inspectItem) : ''}
        onClose={() => setInspectItem(null)}
      />
    </div>
  );
}

/* ============================================================
   EMPTY PANEL — minimal, quiet, no coloured panel
   ============================================================ */
function EmptyPanel({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      style={{
        padding: '4rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        border: '1px solid var(--border-warm)',
        borderRadius: 14,
      }}
    >
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none" style={{ color: 'var(--text-dimmed)', opacity: 0.55 }} aria-hidden="true">
        <circle cx="20" cy="22" r="13" stroke="currentColor" strokeWidth="1.1" />
        <path d="M13 22C13 17.6 16.6 14 20 14C23.4 14 27 17.6 27 22" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M8 10L32 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
      </svg>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.375rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.015em',
          margin: '1.25rem 0 0',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: '0.5rem 0 0',
          fontSize: '0.875rem',
          lineHeight: 1.65,
          color: 'var(--text-muted)',
          maxWidth: '40ch',
        }}
      >
        {body}
      </p>
      <button type="button" onClick={onAction} className="d3-btn-quiet" style={{ marginTop: '1.5rem' }}>
        {actionLabel}
      </button>
    </div>
  );
}
