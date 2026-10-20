"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { sceneState } from "@/lib/timeline";
import { scenes } from "@/lib/content";
import { createMaterials, interiorBuilders } from "./model";
import { useDetailedArchitecture } from "./DetailedArchitecture";
import { StudioPostprocessing } from "./StudioPostprocessing";

export interface ExperienceProps {
  progress: React.RefObject<number>;
  renderProgress: number;
  reducedMotion: boolean;
  exploded: boolean;
  lowPower: boolean;
  onReady: () => void;
  onError: () => void;
  interactive?: boolean;
  onLowPower?: () => void;
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
  const hdr = useLoader(RGBELoader, "/models/studio.hdr");
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromEquirectangular(hdr);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, hdr]);
  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.position.set(11.5, 3.9, 13);
    const target = new THREE.Vector3(0, 2.6, 0);
    const distance = c.position.distanceTo(target);
    c.fov = Math.max(
      34,
      THREE.MathUtils.radToDeg(
        2 * Math.atan(6.1 / ((size.width / size.height) * distance)),
      ),
    );
    c.lookAt(target);
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
      {!lowPower && (
        <rectAreaLight
          position={[0, 3, 3]}
          rotation={[-0.5, 0, 0]}
          width={6}
          height={3}
          intensity={2.8}
          color="#e0b78c"
        />
      )}
      {!lowPower && (
        <rectAreaLight
          position={[-4, 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          width={3}
          height={4}
          intensity={2.1}
          color="#eece9d"
        />
      )}
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
  lowPower,
  onReady,
}: Omit<ExperienceProps, "onError">) {
  const detailed = useDetailedArchitecture(lowPower);
  const model = useMemo(() => {
    const materials = createMaterials();
    return {
      materials,
      shell: detailed.shell,
      base: detailed.base,
      engineering: detailed.engineering,
      interiors: interiorBuilders.map((build, i) =>
        i === 2 ? detailed.office : build(materials),
      ),
    };
  }, [detailed]);
  const root = useRef<THREE.Group>(null);
  const engineering = useRef<THREE.Object3D>(null);
  const base = useRef<THREE.Object3D>(null);
  const roofRestHeight = detailed.roofRestHeight;
  const baseRestHeight = detailed.baseRestHeight;
  const sceneLight = useRef<THREE.PointLight>(null);
  const animatedExplosion = useRef(0);
  const { gl, invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [renderProgress, reducedMotion, exploded, invalidate]);
  useEffect(() => {
    // The locally hosted GLBs and all embedded light atlases are loaded.
    onReady();
  }, [gl, onReady]);
  useFrame((_, delta) => {
    const s = sceneState(progress.current, reducedMotion);
    if (root.current) root.current.rotation.y = s.rotation;
    gl.domElement.dataset.rotation = s.rotation.toFixed(5);
    gl.domElement.dataset.scene = String(s.index);
    gl.domElement.dataset.geometry =
      s.index === 2 ? "blender-office" : "hybrid";
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
      engineering.current.position.y =
        roofRestHeight + animatedExplosion.current;
    if (base.current)
      base.current.position.y =
        baseRestHeight - animatedExplosion.current * 0.3;
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
      <primitive ref={base} object={model.base} />
      <primitive ref={engineering} object={model.engineering} />
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
        camera={{ position: [11.5, 3.9, 13], fov: 34, near: 0.1, far: 100 }}
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
          const context = gl.getContext();
          const debug = context.getExtension("WEBGL_debug_renderer_info");
          if (
            debug &&
            /swiftshader|llvmpipe|software/i.test(
              String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)),
            )
          )
            props.onLowPower?.();
          gl.domElement.addEventListener("webglcontextlost", props.onError, {
            once: true,
          });
        }}
      >
        <Suspense fallback={null}>
          <Studio lowPower={props.lowPower} />
          <ArchitecturalCube {...props} />
          {props.interactive && (
            <OrbitControls
              makeDefault
              target={[0, 2.6, 0]}
              enablePan={false}
              enableDamping={!props.lowPower}
              minDistance={11}
              maxDistance={28}
              minPolarAngle={Math.PI * 0.2}
              maxPolarAngle={Math.PI * 0.58}
            />
          )}
          <StudioPostprocessing lowPower={props.lowPower} />
        </Suspense>
      </Canvas>
    </CanvasBoundary>
  );
}
