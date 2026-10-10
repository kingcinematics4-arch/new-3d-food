'use client';

import React, { useState, useCallback, useRef } from 'react';
import { formatBytes } from '@/lib/branding';
import { MENU_IMAGE_FILE_ACCEPT, MAX_MENU_IMAGE_BYTES, isAcceptableMenuImageFile } from '@/lib/menuImage';

interface MenuImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  menuItemId?: string;
  className?: string;
}

export default function MenuImageUploader({
  value,
  onChange,
  onRemove,
  disabled = false,
  menuItemId,
  className = '',
}: MenuImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImage = value?.trim();
  const hasImage = Boolean(currentImage || previewUrl);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return;

      const validation = isAcceptableMenuImageFile(selectedFile);
      if (!validation.ok) {
        setError(validation.error);
        return;
      }

      setError(null);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null;
      handleFileSelect(selectedFile);
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!file || !menuItemId) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('menu_item_id', menuItemId);

      const res = await fetch('/api/menu/image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      setProgress(100);
      onChange(json.url);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [file, menuItemId, onChange, previewUrl]);

  const handleRemove = useCallback(() => {
    if (currentImage && onRemove) {
      onRemove();
    }
    clearFile();
    onChange('');
  }, [currentImage, onRemove, clearFile, onChange]);

  const handleReplace = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          {(previewUrl || currentImage) ? (
            <img
              src={previewUrl || currentImage}
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

        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {!hasImage ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleReplace}
              style={{
                border: dragActive ? '2px dashed var(--gold)' : '2px dashed var(--border-warm)',
                borderRadius: 10,
                background: dragActive ? 'rgba(201,169,110,0.05)' : 'var(--bg-secondary)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 200ms',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={MENU_IMAGE_FILE_ACCEPT}
                onChange={handleInputChange}
                style={{ display: 'none' }}
                disabled={disabled || uploading}
              />
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                style={{ color: 'var(--text-dimmed)', opacity: 0.5, marginBottom: 8 }}
                aria-hidden="true"
              >
                <path
                  d="M20 8L32 16V28L20 36L8 28V16L20 8Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 8V36M8 16L20 24L32 16"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block' }}>
                  Drag & drop an image here
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                  or click to browse
                </span>
              </div>
              <span style={{ fontSize: '0.5625rem', color: 'var(--text-dimmed)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginTop: 8 }}>
                {MENU_IMAGE_FILE_ACCEPT.split(',').map(t => t.trim()).filter(t => t.startsWith('.')).join(', ')}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {file && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  {uploading && (
                    <div style={{ width: '100%', maxWidth: 300 }}>
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
                            width: `${progress}%`,
                            height: '100%',
                            background: 'var(--gold)',
                            borderRadius: 2,
                            transition: 'width 300ms',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-dimmed)', marginTop: 4 }}>
                        Uploading... {progress}%
                      </span>
                    </div>
                  )}
                  {error && (
                    <span style={{ fontSize: '0.6875rem', color: '#FCA5A5' }}>
                      {error}
                    </span>
                  )}
                  {!uploading && !error && file && (
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={disabled}
                      className="d3-btn-quiet"
                      style={{ padding: '0.5rem 1rem', alignSelf: 'flex-start' }}
                    >
                      Upload Image
                    </button>
                  )}
                </div>
              )}

              {hasImage && !file && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleReplace}
                    disabled={disabled}
                    className="d3-btn-quiet"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Replace Image
                  </button>
                  {onRemove && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={disabled}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: '1px solid rgba(200,80,80,0.3)',
                        borderRadius: 6,
                        color: '#FCA5A5',
                        fontSize: '0.6875rem',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              )}

              <p
                style={{
                  margin: '0.5rem 0 0',
                  fontSize: '0.6875rem',
                  lineHeight: 1.6,
                  color: 'var(--text-dimmed)',
                }}
              >
                This photograph is what guests see on your menu. It is the dish&apos;s
                primary visual. Max size: {formatBytes(MAX_MENU_IMAGE_BYTES)}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}