import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const ProductModel = () => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1.5, 0.3]} />
      <meshPhongMaterial
        color="#047ca8"
        shininess={100}
        emissive="#0592b0"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const Product3DScene = () => {
  return (
    <Suspense fallback={<div style={{ width: '100%', height: '100%', background: '#f3f4f6' }} />}>
      <Canvas
        style={{ width: '100%', height: '100%', background: '#f3f4f6' }}
        camera={{ position: [0, 0, 2.5], fov: 75 }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, 10]} intensity={0.5} />
        
        <ProductModel />
        
        <OrbitControls
          autoRotate
          autoRotateSpeed={4}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </Suspense>
  );
};

export default Product3DScene;
