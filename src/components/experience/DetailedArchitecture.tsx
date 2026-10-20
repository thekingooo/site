"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

function layer(scene: THREE.Group, name: string) {
  const object = scene.getObjectByName(name);
  if (!object) throw new Error(`Architectural GLB is missing ${name}`);
  object.removeFromParent();
  // The Blender exporter may keep a Z-up conversion on the imported node.
  // An identity wrapper gives every animation a consistent world Y-up axis.
  const wrapper = new THREE.Group();
  wrapper.name = `${name}Layer`;
  wrapper.add(object);
  return wrapper;
}

export function useDetailedArchitecture(lowPower: boolean) {
  const [architecture, office] = useGLTF([
    "/models/architecture.glb",
    "/models/office.glb",
  ]);
  const { invalidate } = useThree();
  const parts = useMemo(() => {
    const commonScene = architecture.scene.clone(true);
    const officeScene = office.scene.clone(true);
    const glass = new Set<THREE.MeshPhysicalMaterial>();
    const clones = new Map<THREE.Material, THREE.Material>();
    const ecoMaterials = new Map<THREE.Material, THREE.Material>();
    const materialModes: Array<{
      mesh: THREE.Mesh;
      full: THREE.Material | THREE.Material[];
      eco: THREE.Material | THREE.Material[];
    }> = [];
    const configure = (object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.frustumCulled = true;
        object.receiveShadow = false; // Indirect light and contact shadows are baked.
        const clone = (original: THREE.Material) => {
          if (!clones.has(original)) clones.set(original, original.clone());
          const material = clones.get(original)!;
          if (
            material instanceof THREE.MeshPhysicalMaterial &&
            material.transmission > 0
          ) {
            material.userData.transmission = material.transmission;
            glass.add(material);
          }
          return material;
        };
        object.material = Array.isArray(object.material)
          ? object.material.map(clone)
          : clone(object.material);
        const eco = (material: THREE.Material) => {
          if (!ecoMaterials.has(material)) {
            if (
              material instanceof THREE.MeshStandardMaterial &&
              material.emissiveMap
            ) {
              ecoMaterials.set(
                material,
                new THREE.MeshBasicMaterial({
                  map: material.emissiveMap,
                  color: material.emissive
                    .clone()
                    .multiplyScalar(material.emissiveIntensity),
                  side: material.side,
                  vertexColors: material.vertexColors,
                }),
              );
            } else ecoMaterials.set(material, material);
          }
          return ecoMaterials.get(material)!;
        };
        materialModes.push({
          mesh: object,
          full: object.material,
          eco: Array.isArray(object.material)
            ? object.material.map(eco)
            : eco(object.material),
        });
      }
    };
    commonScene.traverse(configure);
    officeScene.traverse(configure);
    return {
      shell: layer(commonScene, "Shell"),
      base: layer(commonScene, "Foundation"),
      engineering: layer(commonScene, "Engineering"),
      office: layer(officeScene, "Interior"),
      roofRestHeight: 0,
      baseRestHeight: 0,
      glass,
      materialModes,
    };
  }, [architecture.scene, office.scene]);
  useEffect(() => {
    parts.materialModes.forEach(({ mesh, full, eco }) => {
      mesh.material = lowPower ? eco : full;
    });
    parts.glass.forEach((material) => {
      material.transmission = lowPower ? 0 : material.userData.transmission;
      material.opacity = lowPower ? 0.15 : 1;
      material.transparent = lowPower;
      material.depthWrite = !lowPower;
      material.needsUpdate = true;
    });
    invalidate();
  }, [parts, lowPower, invalidate]);
  return parts;
}
