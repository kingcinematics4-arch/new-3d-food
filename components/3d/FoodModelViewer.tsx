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

// Stylish fallback 3D procedural food plate visualization
function FallbackPlate() {
  return (
    <group position={[0, -0.2, 0]}>
      {/* Plate Base */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 1.2, 0.15, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
      </mesh>
      {/* Plate Rim */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[1.7, 1.6, 0.04, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
      {/* Gourmet Food Burger Layer 1 (Bun Bottom) */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.2, 32]} />
        <meshStandardMaterial color="#d97706" roughness={0.5} />
      </mesh>
      {/* Pattie */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.95, 0.95, 0.18, 32]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      {/* Cheese Melt */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[1.4, 0.04, 1.4]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} />
      </mesh>
      {/* Lettuce */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[1.05, 1.0, 0.06, 16]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>
      {/* Tomato Slices */}
      <mesh position={[0.3, 0.65, 0.2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.05, 16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
      <mesh position={[-0.3, 0.65, -0.2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.05, 16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
      {/* Bun Top */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} />
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
                  fallback={<FallbackPlate />}
                  onError={() => setHasError(true)}
                >
                  <GltfModel url={modelUrlGlb} />
                </ThreeErrorBoundary>
              ) : (
                <FallbackPlate />
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
