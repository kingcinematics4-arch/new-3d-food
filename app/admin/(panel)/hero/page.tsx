'use client';

// app/admin/(panel)/hero/page.tsx
//
// HERO SECTION EDITOR
//
// Every visible element of the first screen: headline, supporting copy, both
// calls to action and their destinations, the optional background image and the
// 3D dish demonstration — plus per-element visibility switches.

import React from 'react';
import { useSiteContent } from '@/components/admin/SiteContentProvider';
import {
  AdminPageHeader,
  AdminPanel,
  AdminField,
  AdminInput,
  AdminTextarea,
  AdminToggle,
  AdminNote,
} from '@/components/admin/ui';
import HeroImageUploader from '@/components/admin/HeroImageUploader';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

const FoodModelViewer = dynamic(() => import('@/components/3d/FoodModelViewer'), { ssr: false });

export default function AdminHeroPage() {
  const { draft, update, loading } = useSiteContent();
  const hero = draft.hero;

  const set = <K extends keyof typeof hero>(key: K, value: (typeof hero)[K]) =>
    update((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));

  if (loading) {
    return (
      <>
        <AdminPageHeader eyebrow="HERO" title="Hero section" />
        <div className="d3-panel p-8" style={{ color: 'var(--text-dimmed)', fontSize: '0.875rem' }}>
          Loading…
        </div>
      </>
    );
  }

  const hasContent = Boolean(hero.heading || hero.subheading || hero.ctaText);

  // File upload logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show processing UI
    setUploadStatus(`Uploading & Processing ${file.name}...`);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/hero-model', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Update the draft with the real storage URL
      set('modelUrlGlb', data.model.modelUrlGlb);
      set('modelName', data.model.modelName);
      setUploadStatus(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setUploadStatus(`Upload failed: ${message}`);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="HERO"
        title="Hero section"
        description="The first thing a visitor sees. Write the headline, supporting copy and where each button should take people."
      />

      <div className="flex flex-col gap-6">
        <AdminPanel title="Visibility">
          <div className="flex flex-col gap-4">
            <AdminToggle
              checked={hero.enabled}
              onChange={(v) => set('enabled', v)}
              label="Show the hero section"
              description="When off, the website opens straight into the next section."
            />
            <div className="d3-rule" />
            <AdminToggle
              checked={hero.showSecondaryCta}
              onChange={(v) => set('showSecondaryCta', v)}
              label="Show the second button"
              description="Usually a quieter link such as “See how it works”."
            />
            <AdminToggle
              checked={hero.showViewer}
              onChange={(v) => set('showViewer', v)}
              label="Show the 3D model"
              description="The interactive dish preview beside the headline."
            />
          </div>
        </AdminPanel>

        <AdminPanel title="3D MODEL">
          <div className="flex flex-col gap-5">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage the interactive 3D food model shown in the hero section.
            </p>

            {hero.modelUrlGlb ? (
              <div className="flex flex-col gap-4">
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>Current model:</p>
                <div 
                  style={{ 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: 12, 
                    overflow: 'hidden',
                    background: 'var(--bg-surface-2)' 
                  }}
                >
                  <FoodModelViewer 
                    modelUrlGlb={hero.modelUrlGlb} 
                    className="w-full h-64" 
                    autoRotate={true}
                  />
                  <div className="p-4" style={{ background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{hero.modelName || 'Custom Model'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>GLB</p>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="d3-btn-secondary"
                  >
                    Replace 3D Model
                  </button>
                </div>
              </div>
            ) : (
              <div 
                style={{ 
                  border: '1px dashed var(--border-subtle)', 
                  borderRadius: 12, 
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-surface-1)'
                }}
                className="flex flex-col items-center justify-center gap-4"
              >
                <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>No 3D model uploaded yet.</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Upload a 3D food model to display it in the hero section.</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="d3-btn-primary"
                  style={{ marginTop: '0.5rem' }}
                >
                  + Upload 3D Model
                </button>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', marginTop: '1rem', lineHeight: 1.6 }}>
                  <p>Supported: GLB • GLTF • OBJ • FBX • STL • PLY • USDZ</p>
                  <p className="font-medium mt-1" style={{ color: 'var(--gold)' }}>Recommended: GLB</p>
                </div>
              </div>
            )}

            {uploadStatus && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-surface-2)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--gold)' }}>
                <span className="d3-live-dot" style={{ display: 'inline-block', marginRight: 8, background: 'var(--gold)' }} />
                {uploadStatus}
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".glb,.gltf,.obj,.fbx,.stl,.ply,.usdz"
              onChange={handleFileUpload}
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Headline and copy">
          <div className="flex flex-col gap-5">
            <AdminField label="Headline" hint="First line. Keep it short — it sets the display size.">
              <AdminInput value={hero.heading} onChange={(v) => set('heading', v)} placeholder="See your meal" />
            </AdminField>

            <AdminField
              label="Headline second line"
              hint="Rendered in the champagne italic treatment."
            >
              <AdminInput
                value={hero.headingAccent}
                onChange={(v) => set('headingAccent', v)}
                placeholder="before you order."
              />
            </AdminField>

            <AdminField label="Subheading" hint="One sentence that explains the offer.">
              <AdminTextarea
                value={hero.subheading}
                onChange={(v) => set('subheading', v)}
                rows={3}
                placeholder="Turn your restaurant menu into an interactive 3D dining experience."
              />
            </AdminField>

            <AdminField label="Supporting text" hint="Optional second paragraph.">
              <AdminTextarea
                value={hero.secondaryText}
                onChange={(v) => set('secondaryText', v)}
                rows={2}
                placeholder="Scan a QR code. Explore dishes in 3D."
              />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel title="Calls to action">
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div className="flex flex-col gap-4">
              <span className="d3-eyebrow" style={{ color: 'var(--gold-dim)' }}>
                PRIMARY
              </span>
              <AdminField label="Button text">
                <AdminInput value={hero.ctaText} onChange={(v) => set('ctaText', v)} placeholder="Start Free" />
              </AdminField>
              <AdminField label="Destination" hint="A site path such as /signup, or a full https:// URL.">
                <AdminInput value={hero.ctaHref} onChange={(v) => set('ctaHref', v)} placeholder="/signup" />
                {hero.ctaHref && !/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(hero.ctaHref) && (
                  <div className="mt-2 text-[#E7B4AC]" style={{ fontSize: '0.8125rem' }}>
                    Invalid link<br/>
                    Please enter a valid URL such as:<br/>
                    https://example.com<br/>
                    or<br/>
                    /menu<br/>
                    or<br/>
                    #features
                  </div>
                )}
              </AdminField>
            </div>

            <div className="flex flex-col gap-4">
              <span className="d3-eyebrow" style={{ color: 'var(--gold-dim)' }}>
                SECONDARY
              </span>
              <AdminField label="Button text">
                <AdminInput
                  value={hero.secondaryCtaText}
                  onChange={(v) => set('secondaryCtaText', v)}
                  placeholder="See How It Works"
                />
              </AdminField>
              <AdminField label="Destination">
                <AdminInput
                  value={hero.secondaryCtaHref}
                  onChange={(v) => set('secondaryCtaHref', v)}
                  placeholder="/#how-it-works"
                />
                {hero.secondaryCtaHref && !/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(hero.secondaryCtaHref) && (
                  <div className="mt-2 text-[#E7B4AC]" style={{ fontSize: '0.8125rem' }}>
                    Invalid link<br/>
                    Please enter a valid URL such as:<br/>
                    https://example.com<br/>
                    or<br/>
                    /menu<br/>
                    or<br/>
                    #features
                  </div>
                )}
              </AdminField>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Background image">
          <div className="flex flex-col gap-5">
            <AdminField
              label="Hero image"
              hint="Optional. Leave empty to keep the current background treatment. Accepts a site path or an https URL."
            >
              <AdminInput
                value={hero.imageUrl}
                onChange={(v) => set('imageUrl', v)}
                placeholder="Leave empty for the current look"
              />
              {hero.imageUrl && !/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(hero.imageUrl) && (
                <div className="mt-2 text-[#E7B4AC]" style={{ fontSize: '0.8125rem' }}>
                  Invalid link<br/>
                  Please enter a valid URL such as:<br/>
                  https://example.com<br/>
                  or<br/>
                  /menu<br/>
                  or<br/>
                  #features
                </div>
              )}
            </AdminField>

            <div className="d3-rule" />

            <HeroImageUploader />

            <AdminField label="Image description" hint="Read aloud by screen readers. Describe the image.">
              <AdminInput
                value={hero.imageAlt}
                onChange={(v) => set('imageAlt', v)}
                placeholder="Describe the hero image"
              />
            </AdminField>
          </div>
        </AdminPanel>

        {!hasContent && hero.enabled ? (
          <AdminNote tone="accent">
            The hero is switched on but has no copy yet. Add a headline and supporting text, then publish.
          </AdminNote>
        ) : null}
      </div>
    </>
  );
}