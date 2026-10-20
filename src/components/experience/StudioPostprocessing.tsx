"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function StudioPostprocessing({ lowPower }: { lowPower: boolean }) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  useEffect(() => {
    if (lowPower) return;
    const effect = new EffectComposer(gl);
    effect.setPixelRatio(Math.min(gl.getPixelRatio(), 1.25));
    effect.setSize(size.width, size.height);
    effect.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new Vector2(size.width, size.height),
      0.22,
      0.35,
      1.2,
    );
    effect.addPass(bloom);
    effect.addPass(new OutputPass());
    composer.current = effect;
    invalidate();
    return () => {
      composer.current = null;
      effect.passes.forEach((pass) => pass.dispose());
      effect.dispose();
    };
  }, [gl, scene, camera, size.width, size.height, lowPower, invalidate]);
  useFrame((_, delta) => {
    if (composer.current) composer.current.render(delta);
    else gl.render(scene, camera);
  }, 1);
  return null;
}
