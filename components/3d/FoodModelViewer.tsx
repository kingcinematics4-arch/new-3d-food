'use client';

import React, { Suspense, useState, useEffect, Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Center, Float } from '@react-three/drei';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Custom React Error Boundary to catch 3D GLTF load failures (404, CORS, invalid file)
class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('3D GLTF Model load error caught gracefully:', error?.message || error);
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Sub-component to safely load GLTF model
function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} scale={1.5} />;
}

// Neutral placeholder shown when a real model cannot be loaded.
// It deliberately depicts nothing: DinePixel never fabricates a dish.
function ModelUnavailable() {
  return (
    <group position={[0, -0.1, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.06, 48]} />
        <meshStandardMaterial color="#1D1B17" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[1.5, 0.015, 12, 64]} />
        <meshStandardMaterial color="#B8A47A" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-3" style={{ color: 'var(--text-dimmed)' }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: '1px solid rgba(201,169,110,0.2)',
            borderTopColor: 'var(--gold)',
            animation: 'spin 1.1s linear infinite',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Rendering 3D
        </span>
      </div>
    </Html>
  );
}

interface FoodModelViewerProps {
  modelUrlGlb?: string;
  modelUrlUsdz?: string;
  imageUrl?: string;
  altText?: string;
  autoRotate?: boolean;
  className?: string;
}

export default function FoodModelViewer({
  modelUrlGlb,
  modelUrlUsdz,
  imageUrl,
  altText = 'Food item',
  autoRotate = true,
  className = 'h-72 w-full',
}: FoodModelViewerProps) {
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [hasError, setHasError] = useState(false);

  // Reset viewer state when the model source changes so replacements/reloads
  // render the new asset instead of keeping a previous error or stale canvas.
  useEffect(() => {
    setHasError(false);
    setIsRotating(autoRotate);
  }, [modelUrlGlb, modelUrlUsdz, autoRotate]);

  // If item has no GLB URL or GLB failed to load, check if 2D image is available
  if ((!modelUrlGlb || hasError) && imageUrl) {
    return (
      <div
        className={`relative overflow-hidden ${className} flex items-center justify-center`}
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-warm)', borderRadius: 12 }}
      >
        <img src={imageUrl} alt={altText} className="w-full h-full object-cover" />
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '0.1875rem 0.5rem',
            borderRadius: 5,
            background: 'rgba(11,10,8,0.75)',
            border: '1px solid var(--border-warm)',
            backdropFilter: 'blur(6px)',
            color: 'var(--text-dimmed)',
            fontSize: '0.5625rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          3D unavailable
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-warm)',
        borderRadius: 12,
        touchAction: 'none',
        WebkitUserSelect: 'none',
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 2, 4], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-5, 3, -5]} intensity={0.5} />

        <Suspense fallback={<Loader />}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <Center>
              {modelUrlGlb && !hasError ? (
                <ThreeErrorBoundary
                  fallback={<ModelUnavailable />}
                  onError={() => setHasError(true)}
                >
                  <GltfModel url={modelUrlGlb} />
                </ThreeErrorBoundary>
              ) : (
                <ModelUnavailable />
              )}
            </Center>
          </Float>
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enableRotate={true}
          enablePan={false}
          autoRotate={isRotating}
          autoRotateSpeed={2.5}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={1.5}
          maxDistance={8}
        />
      </Canvas>

      {/* Floating gesture hint badge */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0.25rem 0.5rem',
          borderRadius: 6,
          background: 'rgba(11,10,8,0.72)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
          color: 'var(--text-secondary, #C2BCB0)',
          fontSize: '0.625rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1.5L14 5v6L8 14.5L2 11V5L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        <span>3D • Drag to rotate</span>
      </div>

      {/* Interactive Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '0.375rem 0.75rem',
          borderRadius: 8,
          background: 'rgba(11,10,8,0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-medium, rgba(184,164,122,0.3))',
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: 'var(--text-primary, #F3EFE7)',
        }}
      >
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isRotating ? 'rgba(184,164,122,0.15)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${isRotating ? 'var(--gold, #B8A47A)' : 'var(--border-warm, rgba(255,255,255,0.15))'}`,
            padding: '0.3rem 0.65rem',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: isRotating ? 'var(--gold, #B8A47A)' : 'var(--text-primary, #F3EFE7)',
            transition: 'all 180ms ease',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: isRotating ? 'var(--gold, #B8A47A)' : 'var(--text-dimmed, #888)',
              display: 'inline-block',
            }}
          />
          {isRotating ? 'Pause rotation' : 'Rotate 360°'}
        </button>

        {hasError && (
          <span style={{ color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.625rem' }}>
            Preview unavailable
          </span>
        )}

        {modelUrlUsdz && (
          <a
            href={modelUrlUsdz}
            rel="ar"
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.3rem 0.65rem',
              borderRadius: 6,
              background: 'var(--gold, #B8A47A)',
              color: '#0B0B0A',
              fontWeight: 700,
              fontSize: '0.6875rem',
              textDecoration: 'none',
              transition: 'opacity 180ms ease',
            }}
          >
            View in AR
          </a>
        )}
      </div>
    </div>
  );
}
