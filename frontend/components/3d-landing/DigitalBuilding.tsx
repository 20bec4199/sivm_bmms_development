'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ─── Floor slab ───────────────────────────────────────────────────────────────
function FloorSlab({
  y,
  index,
  totalFloors,
  hovered,
  onClick,
}: {
  y: number;
  index: number;
  totalFloors: number;
  hovered: boolean;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const edgeRef = useRef<THREE.LineSegments>(null!);

  const floorColor = hovered ? '#22d3ee' : '#1e3a5f';
  const edgeColor = hovered ? '#38bdf8' : '#2563eb';
  const opacity = 0.7 + (index / totalFloors) * 0.3;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    if (hovered) {
      ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, 1.04, 0.1);
      ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, 1.04, 0.1);
    } else {
      ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, 1, 0.1);
      ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, 1, 0.1);
    }
    // subtle breathing
    ref.current.position.y = y + Math.sin(t * 0.4 + index * 0.5) * 0.01;
  });

  const geo = useMemo(() => new THREE.BoxGeometry(2.2, 0.12, 1.4), []);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

  return (
    <group>
      <mesh
        ref={ref}
        geometry={geo}
        position={[0, y, 0]}
        onClick={onClick}
        onPointerEnter={(e) => { e.stopPropagation(); }}
        onPointerLeave={(e) => { e.stopPropagation(); }}
      >
        <meshStandardMaterial
          color={floorColor}
          transparent
          opacity={opacity * 0.85}
          roughness={0.2}
          metalness={0.8}
          emissive={hovered ? '#0ea5e9' : '#0d2244'}
          emissiveIntensity={hovered ? 0.6 : 0.2}
        />
      </mesh>
      <lineSegments ref={edgeRef} geometry={edgeGeo} position={[0, y, 0]}>
        <lineBasicMaterial color={edgeColor} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}

// ─── Vertical columns / pillars ───────────────────────────────────────────────
function Pillars() {
  const positions: [number, number][] = [
    [-1.0, -0.65], [1.0, -0.65],
    [-1.0, 0.65], [1.0, 0.65],
  ];
  return (
    <>
      {positions.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.8, z]}>
          <cylinderGeometry args={[0.04, 0.04, 4.2, 8]} />
          <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} emissive="#1e3a8a" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </>
  );
}

// ─── Data node orbiting the building ──────────────────────────────────────────
function DataNode({ angle, radius, speed, color, label }: {
  angle: number; radius: number; speed: number; color: string; label: string;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const a = angle + t * speed;
    ref.current.position.x = Math.cos(a) * radius;
    ref.current.position.z = Math.sin(a) * radius;
    ref.current.position.y = Math.sin(t * 0.5 + angle) * 0.3 + 0.8;
  });
  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0} metalness={1} />
      </mesh>
    </group>
  );
}

// ─── Orbit ring ───────────────────────────────────────────────────────────────
function OrbitRing({ radius, y = 0.8 }: { radius: number; y?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
    return pts;
  }, [radius, y]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);
  return (
    <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#1d4ed8', transparent: true, opacity: 0.25 }))} />
  );
}

// ─── Ground grid ──────────────────────────────────────────────────────────────
function GroundGrid() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const size = 6; const divisions = 12;
    const step = (size * 2) / divisions;
    for (let i = 0; i <= divisions; i++) {
      const pos = -size + i * step;
      pts.push(new THREE.Vector3(pos, 0, -size), new THREE.Vector3(pos, 0, size));
      pts.push(new THREE.Vector3(-size, 0, pos), new THREE.Vector3(size, 0, pos));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  return (
    <lineSegments geometry={geo} position={[0, -1.6, 0]}>
      <lineBasicMaterial color="#1e3a8a" transparent opacity={0.18} />
    </lineSegments>
  );
}

// ─── Mouse parallax camera controller ─────────────────────────────────────────
function CameraController({ mouse }: { mouse: { x: number; y: number } }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 1.5, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3.5 + mouse.y * 0.8, 0.05);
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}

// ─── Main scene ───────────────────────────────────────────────────────────────
function BuildingScene({ onFloorClick }: { onFloorClick: (floor: number) => void }) {
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const floors = 7;
  const floorSpacing = 0.52;
  const startY = -1.2;

  const DATA_NODES = [
    { angle: 0, radius: 2.2, speed: 0.18, color: '#38bdf8', label: 'Residents' },
    { angle: 1.2, radius: 2.0, speed: -0.14, color: '#4ade80', label: 'Facilities' },
    { angle: 2.5, radius: 2.4, speed: 0.12, color: '#f59e0b', label: 'Work Orders' },
    { angle: 3.8, radius: 1.9, speed: -0.20, color: '#a78bfa', label: 'Assets' },
    { angle: 5.1, radius: 2.2, speed: 0.16, color: '#f87171', label: 'Security' },
    { angle: 0.6, radius: 2.6, speed: -0.10, color: '#22d3ee', label: 'Parking' },
  ];

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#93c5fd" />
      <pointLight position={[0, 5, 0]} intensity={0.6} color="#38bdf8" distance={12} />
      <pointLight position={[0, -2, 0]} intensity={0.3} color="#1d4ed8" distance={8} />
      <fog attach="fog" args={['#05070A', 8, 20]} />

      <GroundGrid />
      <OrbitRing radius={2.0} />
      <OrbitRing radius={2.6} y={1.2} />
      <Pillars />

      {Array.from({ length: floors }, (_, i) => (
        <FloorSlab
          key={i}
          y={startY + i * floorSpacing}
          index={i}
          totalFloors={floors}
          hovered={hoveredFloor === i}
          onClick={() => { onFloorClick(i + 1); }}
        />
      ))}

      {/* Roof element */}
      <mesh position={[0, startY + floors * floorSpacing, 0]}>
        <boxGeometry args={[2.2, 0.04, 1.4]} />
        <meshStandardMaterial color="#1e40af" emissive="#3b82f6" emissiveIntensity={0.8} roughness={0.1} metalness={1} />
      </mesh>

      {/* Core glow beacon */}
      <mesh position={[0, startY + floors * floorSpacing + 0.3, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} roughness={0} metalness={1} />
      </mesh>

      {DATA_NODES.map((node, i) => (
        <DataNode key={i} {...node} />
      ))}

      {/* Hoverable floor hit-areas */}
      {Array.from({ length: floors }, (_, i) => (
        <mesh
          key={`hit-${i}`}
          position={[0, startY + i * floorSpacing, 0]}
          onPointerEnter={() => setHoveredFloor(i)}
          onPointerLeave={() => setHoveredFloor(null)}
          onClick={() => onFloorClick(i + 1)}
        >
          <boxGeometry args={[2.6, 0.5, 1.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
export default function DigitalBuilding({ className = '' }: { className?: string }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
    >
      <Canvas
        camera={{ position: [0, 3.5, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <CameraController mouse={mouse} />
        <BuildingScene onFloorClick={() => {}} />
      </Canvas>
    </div>
  );
}
