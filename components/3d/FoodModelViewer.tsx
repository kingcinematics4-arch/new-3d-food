'use client';

import React, { Suspense, useState, Component, ReactNode } from 'react';
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
// It deliberately depicts nothing: Dine3D never fabricates a dish.
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
      className={`relative overflow-hidden ${className}`}
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-warm)', borderRadius: 12 }}
    >
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 2, 4], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
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
          autoRotate={isRotating}
          autoRotateSpeed={2.5}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={1.8}
          maxDistance={8}
        />
      </Canvas>

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
          padding: '0.4375rem 0.75rem',
          borderRadius: 8,
          background: 'rgba(11,10,8,0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-warm)',
          fontSize: '0.625rem',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
        }}
      >
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 'inherit',
            letterSpacing: 'inherit',
            color: 'inherit',
            transition: 'color 200ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          {isRotating ? 'Pause rotation' : 'Rotate 360°'}
        </button>

        {hasError && (
          <span style={{ color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
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
              color: 'var(--gold)',
              textDecoration: 'none',
              transition: 'color 200ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold-bright)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gold)')}
          >
            View in AR
          </a>
        )}
      </div>
    </div>
  );
}
