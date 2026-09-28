import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Database, User, FileText, TrendingUp, History, Sparkles } from 'lucide-react';

interface MemoryCore3DProps {
  onNavigateToSupport?: () => void;
}

export const MemoryCore3D: React.FC<MemoryCore3DProps> = ({ onNavigateToSupport }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Three.js Scene Setup ───────────────────────────────────────────
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Lighting ────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x4f7cff, 4, 50);
    blueLight.position.set(10, 10, 10);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 4, 50);
    purpleLight.position.set(-10, -10, 8);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x22d3ee, 5, 40);
    cyanLight.position.set(0, 0, 12);
    scene.add(cyanLight);

    // ── Central Memory Core Group ───────────────────────────────────────
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Core Glow Sphere (Inner core)
    const innerGeo = new THREE.SphereGeometry(3.2, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerSphere);

    // 2. High-intensity dense inner node sphere
    const denseGeo = new THREE.IcosahedronGeometry(2.4, 2);
    const denseMat = new THREE.MeshStandardMaterial({
      color: 0x4f7cff,
      roughness: 0.1,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const denseSphere = new THREE.Mesh(denseGeo, denseMat);
    coreGroup.add(denseSphere);

    // 3. Orbital Rings (Tilted rings with glowing energy paths)
    const ringMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }),
      new THREE.MeshBasicMaterial({ color: 0x8b5cff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }),
      new THREE.MeshBasicMaterial({ color: 0x5e8bff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }),
    ];

    // Ring 1 (Horizontal tilt)
    const ring1Geo = new THREE.TorusGeometry(5.8, 0.05, 16, 100);
    const ring1 = new THREE.Mesh(ring1Geo, ringMaterials[0]);
    ring1.rotation.x = Math.PI / 2.8;
    ring1.rotation.y = Math.PI / 8;
    coreGroup.add(ring1);

    // Ring 2 (Vertical tilt)
    const ring2Geo = new THREE.TorusGeometry(6.6, 0.04, 16, 100);
    const ring2 = new THREE.Mesh(ring2Geo, ringMaterials[1]);
    ring2.rotation.x = Math.PI / 4;
    ring2.rotation.z = Math.PI / 3;
    coreGroup.add(ring2);

    // Ring 3 (Outer dynamic orbit)
    const ring3Geo = new THREE.TorusGeometry(7.4, 0.035, 16, 100);
    const ring3 = new THREE.Mesh(ring3Geo, ringMaterials[2]);
    ring3.rotation.y = Math.PI / 3.2;
    ring3.rotation.x = -Math.PI / 6;
    coreGroup.add(ring3);

    // 4. Orbiting Glowing Nodes
    const nodesGroup = new THREE.Group();
    coreGroup.add(nodesGroup);

    const nodeCount = 12;
    const nodeSpheres: THREE.Mesh[] = [];
    const nodeAngles: number[] = [];

    const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      nodesGroup.add(node);
      nodeSpheres.push(node);
      nodeAngles.push((i / nodeCount) * Math.PI * 2);
    }

    // 5. Ambient Data Particles Cloud
    const particleCount = 240;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x22d3ee);
    const color2 = new THREE.Color(0xa855f7);

    for (let i = 0; i < particleCount; i++) {
      const radius = 4 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const mixedColor = color1.clone().lerp(color2, Math.random());
      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particles);

    // ── Interactive Mouse Parallax ──────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // ── Resize Handler ──────────────────────────────────────────────────
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // ── Animation Loop ──────────────────────────────────────────────────
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const speedMultiplier = prefersReducedMotion ? 0.2 : 1;

      // Parallax smooth interpolation
      targetX += (mouseX * 0.3 - targetX) * 0.05;
      targetY += (mouseY * 0.3 - targetY) * 0.05;

      coreGroup.rotation.y = elapsedTime * 0.15 * speedMultiplier + targetX;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1 + targetY;

      // Inner spheres counter-rotation
      innerSphere.rotation.y = -elapsedTime * 0.25 * speedMultiplier;
      denseSphere.rotation.x = elapsedTime * 0.2 * speedMultiplier;

      // Orbit individual rings
      ring1.rotation.z = elapsedTime * 0.2 * speedMultiplier;
      ring2.rotation.y = -elapsedTime * 0.18 * speedMultiplier;
      ring3.rotation.x = elapsedTime * 0.12 * speedMultiplier;

      // Orbit nodes along Ring 1 radius (~5.8)
      for (let i = 0; i < nodeCount; i++) {
        const angle = nodeAngles[i] + elapsedTime * 0.4 * speedMultiplier;
        const radius = i % 2 === 0 ? 5.8 : 6.6;
        nodeSpheres[i].position.x = Math.cos(angle) * radius;
        nodeSpheres[i].position.y = Math.sin(angle) * (radius * 0.6);
        nodeSpheres[i].position.z = Math.sin(angle * 2) * 1.5;
      }

      // Rotate particle cloud gently
      particles.rotation.y = elapsedTime * 0.05 * speedMultiplier;

      renderer.render(scene, camera);
    };

    animate();

    // ── Clean Cleanup ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      innerGeo.dispose();
      innerMat.dispose();
      denseGeo.dispose();
      denseMat.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      ringMaterials.forEach((m) => m.dispose());
      nodeGeo.dispose();
      nodeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="memory-core-wrapper" ref={containerRef}>
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="memory-core-canvas-container" />

      {/* Central Integrated Core Typography */}
      <div className="memory-core-center-badge">
        <div className="core-center-icon-glow">
          <Database size={22} />
        </div>
        <span className="core-center-heading">MEMORY CORE</span>
        <span className="core-center-subhead">Persistent Customer Memory</span>
      </div>

      {/* 5 Orbiting Floating Glass Cards (Matching Reference Layout) */}

      {/* 1. Customer History (Top-Center) */}
      <div
        className="orbit-card card-customer-history"
        onClick={onNavigateToSupport}
        style={{ cursor: onNavigateToSupport ? 'pointer' : 'default' }}
      >
        <div className="orbit-card-icon icon-purple">
          <User size={16} />
        </div>
        <div className="orbit-card-meta">
          <span className="orbit-card-title">Customer History</span>
          <span className="orbit-card-desc">Previous issues & conversations</span>
        </div>
      </div>

      {/* 2. Current Case (Top-Left) */}
      <div
        className="orbit-card card-current-case"
        onClick={onNavigateToSupport}
        style={{ cursor: onNavigateToSupport ? 'pointer' : 'default' }}
      >
        <div className="orbit-card-icon icon-cyan">
          <FileText size={16} />
        </div>
        <div className="orbit-card-meta">
          <span className="orbit-card-title">Current Case</span>
          <span className="orbit-card-desc">Real-time context</span>
        </div>
      </div>

      {/* 3. Relevant Memory (Top-Right) */}
      <div
        className="orbit-card card-relevant-memory"
        onClick={onNavigateToSupport}
        style={{ cursor: onNavigateToSupport ? 'pointer' : 'default' }}
      >
        <div className="orbit-card-icon icon-blue">
          <TrendingUp size={16} />
        </div>
        <div className="orbit-card-meta">
          <span className="orbit-card-title">Relevant Memory</span>
          <span className="orbit-card-desc">Recalled when needed</span>
        </div>
      </div>

      {/* 4. Previous Attempts (Bottom-Left) */}
      <div
        className="orbit-card card-previous-attempts"
        onClick={onNavigateToSupport}
        style={{ cursor: onNavigateToSupport ? 'pointer' : 'default' }}
      >
        <div className="orbit-card-icon icon-purple">
          <History size={16} />
        </div>
        <div className="orbit-card-meta">
          <span className="orbit-card-title">Previous Attempts</span>
          <span className="orbit-card-desc">What worked & what didn't</span>
        </div>
      </div>

      {/* 5. Better Support (Bottom-Right) */}
      <div
        className="orbit-card card-better-support"
        onClick={onNavigateToSupport}
        style={{ cursor: onNavigateToSupport ? 'pointer' : 'default' }}
      >
        <div className="orbit-card-icon icon-green">
          <Sparkles size={16} />
        </div>
        <div className="orbit-card-meta">
          <span className="orbit-card-title">Better Support</span>
          <span className="orbit-card-desc">More personalized help</span>
        </div>
      </div>
    </div>
  );
};
