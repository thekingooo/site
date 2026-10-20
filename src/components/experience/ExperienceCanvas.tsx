"use client";

import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { sceneState } from "@/lib/timeline";
import { scenes } from "@/lib/content";
import {
  createMaterials,
  buildShell,
  buildBase,
  buildEngineering,
  interiorBuilders,
} from "./model";

export interface ExperienceProps {
  progress: React.RefObject<number>;
  renderProgress: number;
  reducedMotion: boolean;
  exploded: boolean;
  lowPower: boolean;
  onReady: () => void;
  onError: () => void;
}

class CanvasBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Studio({ lowPower }: { lowPower: boolean }) {
  const { gl, scene, camera, size } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.03);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
      target.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    const c = camera as THREE.OrthographicCamera;
    c.zoom = Math.min(size.width / 11.7, size.height / 8.1);
    c.position.set(11, 8.5, 13);
    c.lookAt(0, 1.65, 0);
    c.updateProjectionMatrix();
  }, [camera, size]);
  return (
    <>
      <ambientLight intensity={0.25} color="#eee7da" />
      <directionalLight
        position={[-3, 9, 7]}
        intensity={2.1}
        color="#f5e7d3"
        castShadow={!lowPower}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[6, 6, -5]} intensity={1.8} color="#acbab6" />
      <rectAreaLight
        position={[0, 3, 3]}
        rotation={[-0.5, 0, 0]}
        width={6}
        height={3}
        intensity={2.8}
        color="#e0b78c"
      />
      <rectAreaLight
        position={[-4, 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={3}
        height={4}
        intensity={2.1}
        color="#eece9d"
      />
      {!lowPower && (
        <ContactShadows
          position={[0, -1.02, 0]}
          opacity={0.6}
          scale={20}
          blur={2.8}
          far={9}
          resolution={512}
          color="#000000"
          frames={Infinity}
        />
      )}
    </>
  );
}

export function ArchitecturalCube({
  progress,
  renderProgress,
  reducedMotion,
  exploded,
  onReady,
}: Omit<ExperienceProps, "lowPower" | "onError">) {
  const model = useMemo(() => {
    const materials = createMaterials();
    return {
      materials,
      shell: buildShell(materials),
      base: buildBase(materials),
      engineering: buildEngineering(materials),
      interiors: interiorBuilders.map((build) => build(materials)),
    };
  }, []);
  const root = useRef<THREE.Group>(null);
  const engineering = useRef<THREE.Group>(null);
  const base = useRef<THREE.Group>(null);
  const sceneLight = useRef<THREE.PointLight>(null);
  const animatedExplosion = useRef(0);
  const { gl, invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [renderProgress, reducedMotion, exploded, invalidate]);
  useEffect(() => {
    // Procedural geometry is mounted; there are no network models to wait for.
    onReady();
  }, [gl, onReady]);
  useFrame((_, delta) => {
    const s = sceneState(progress.current, reducedMotion);
    if (root.current) root.current.rotation.y = s.rotation;
    gl.domElement.dataset.rotation = s.rotation.toFixed(5);
    gl.domElement.dataset.scene = String(s.index);
    model.interiors.forEach((interior, i) => {
      const weight = reducedMotion
        ? i === s.index
          ? 1
          : 0
        : i === s.from
          ? 1 - s.mix
          : i === s.to
            ? s.mix
            : 0;
      interior.visible = weight > 0.001;
      interior.scale.y = Math.max(0.001, weight);
      interior.position.y = -0.08 * (1 - weight);
    });
    const targetExplosion = exploded ? 0.7 : s.explosion * 0.32;
    animatedExplosion.current = THREE.MathUtils.damp(
      animatedExplosion.current,
      targetExplosion,
      5,
      delta,
    );
    if (Math.abs(animatedExplosion.current - targetExplosion) > 0.001)
      invalidate();
    if (engineering.current)
      engineering.current.position.y = 3.9 + animatedExplosion.current;
    if (base.current)
      base.current.position.y = -animatedExplosion.current * 0.3;
    if (sceneLight.current) {
      const color = new THREE.Color(scenes[s.from].color).lerp(
        new THREE.Color(scenes[s.to].color),
        s.mix,
      );
      sceneLight.current.color.copy(color);
      sceneLight.current.intensity = 16 + (s.from >= 3 ? 5 : 0);
    }
  });
  return (
    <group ref={root}>
      <primitive object={model.shell} />
      <group ref={base}>
        <primitive object={model.base} />
      </group>
      <group ref={engineering} position={[0, 3.9, 0]}>
        <primitive object={model.engineering} />
      </group>
      {model.interiors.map((interior, i) => (
        <primitive object={interior} key={i} visible={i === 0} />
      ))}
      <pointLight
        ref={sceneLight}
        position={[0, 2.45, 0.1]}
        intensity={28}
        distance={8}
        decay={2}
        color="#e9ba85"
      />
      <pointLight
        position={[-2.5, 1.4, -1.9]}
        intensity={5}
        distance={3}
        color="#ffd0a0"
      />
    </group>
  );
}

export default function ExperienceCanvas(props: ExperienceProps) {
  return (
    <CanvasBoundary onError={props.onError}>
      <Canvas
        frameloop="demand"
        orthographic
        camera={{ position: [11, 8.5, 13], zoom: 60, near: 0.1, far: 100 }}
        dpr={props.lowPower ? 0.85 : [1, 1.6]}
        shadows={!props.lowPower}
        gl={{
          antialias: !props.lowPower,
          alpha: true,
          powerPreference: props.lowPower ? "low-power" : "high-performance",
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.domElement.setAttribute(
            "aria-label",
            "Трёхмерный архитектурный разрез коммерческого помещения",
          );
          gl.domElement.setAttribute("role", "img");
          gl.domElement.addEventListener("webglcontextlost", props.onError, {
            once: true,
          });
        }}
      >
        <Studio lowPower={props.lowPower} />
        <ArchitecturalCube {...props} />
      </Canvas>
    </CanvasBoundary>
  );
}
