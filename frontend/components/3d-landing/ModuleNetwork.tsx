'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MODULES } from '../../data/landing';

const MODULE_ANGLES = MODULES.map((_, i) => (i / MODULES.length) * Math.PI * 2);

function ModuleNode({
  angle, radius, label, color, active, onClick,
}: {
  angle: number; radius: number; label: string; color: string; active: boolean; onClick: () => void;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.y = Math.sin(t * 0.6 + angle) * 0.12;
    if (ref.current.children[0]) {
      const mesh = ref.current.children[0] as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = active
        ? THREE.MathUtils.lerp(mat.emissiveIntensity, 1.5, 0.1)
        : THREE.MathUtils.lerp(mat.emissiveIntensity, 0.4, 0.1);
    }
  });

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  return (
    <group ref={ref} position={[x, 0, z]} onClick={onClick}>
      <mesh>
        <sphereGeometry args={[active ? 0.16 : 0.11, 16, 16]} />
        <meshStandardMaterial
          color={active ? color : '#334155'}
          emissive={color}
          emissiveIntensity={active ? 1.5 : 0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {/* connection line to center */}
    </group>
  );
}

function CentralCore({ activeColor }: { activeColor: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.3;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.15;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissive.set(activeColor);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.32, 1]} />
      <meshStandardMaterial
        color="#0f172a"
        emissive={activeColor}
        emissiveIntensity={0.8}
        roughness={0.1}
        metalness={1}
        wireframe
      />
    </mesh>
  );
}

function ConnectionLines({ activeIndex }: { activeIndex: number }) {
  const lines = useMemo(() => {
    return MODULES.map((mod, i) => {
      const angle = MODULE_ANGLES[i];
      const radius = 2.0;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, z)];
      return new THREE.BufferGeometry().setFromPoints(pts);
    });
  }, []);

  return (
    <>
      {lines.map((geo, i) => {
        const mat = new THREE.LineBasicMaterial({
          color: i === activeIndex ? MODULES[i].color : '#1e3a5f',
          transparent: true,
          opacity: i === activeIndex ? 0.8 : 0.2,
        });
        return <primitive key={i} object={new THREE.Line(geo, mat)} />;
      })}
    </>
  );
}

function Scene({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (i: number) => void }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 3, 0]} intensity={1} color="#38bdf8" />
      <fog attach="fog" args={['#05070A', 6, 16]} />

      <CentralCore activeColor={MODULES[activeIndex].color} />
      <ConnectionLines activeIndex={activeIndex} />

      {MODULES.map((mod, i) => (
        <ModuleNode
          key={mod.id}
          angle={MODULE_ANGLES[i]}
          radius={2.0}
          label={mod.label}
          color={mod.color}
          active={i === activeIndex}
          onClick={() => setActiveIndex(i)}
        />
      ))}
    </>
  );
}

export default function ModuleNetwork({ activeIndex, setActiveIndex }: {
  activeIndex: number; setActiveIndex: (i: number) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 2.5, 4.5], fov: 55 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }} dpr={[1, 1.5]}>
      <Scene activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
    </Canvas>
  );
}
