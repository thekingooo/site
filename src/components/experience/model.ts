import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Everything is real geometry. Each layer is merged by material to keep draw
// calls bounded. The five interiors share this 8 × 5.6 m coordinate system.
export type Materials = ReturnType<typeof createMaterials>;
type Point = [number, number, number];
type MaterialName = keyof Materials;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function texture(kind: "concrete" | "wood" | "stone" | "marble" | "fabric") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(512, 512);
  const random = rng(131);
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      let v = 185 + random() * 38;
      if (kind === "wood")
        v =
          120 +
          Math.sin(x * 0.12 + Math.sin(y * 0.015) * 2) * 21 +
          Math.sin(x * 0.8 + Math.sin(y * 0.04)) * 14 +
          random() * 22;
      if (kind === "stone")
        v =
          190 +
          Math.sin(y * 0.12 + Math.sin(x * 0.012) * 2) * 10 +
          random() * 25;
      if (kind === "marble") {
        const vein = Math.abs(
          Math.sin(x * 0.013 + y * 0.019 + Math.sin(x * 0.03 + y * 0.01) * 1.5),
        );
        v = vein < 0.055 ? 205 + random() * 40 : 75 + random() * 38;
      }
      if (kind === "fabric")
        v = 185 + (x % 3 === 0 || y % 3 === 0 ? -30 : 20) + random() * 20;
      if (kind === "concrete") {
        v += Math.sin(x * 0.031) * Math.sin(y * 0.022) * 15;
        if (random() > 0.992) v -= 80;
      }
      const i = (y * 512 + x) * 4;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  ctx.putImageData(image, 0, 0);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(kind === "wood" ? 2 : 1, kind === "wood" ? 1 : 1);
  t.anisotropy = 4;
  return t;
}

export function createMaterials() {
  const concrete = texture("concrete"),
    wood = texture("wood"),
    stone = texture("stone"),
    marble = texture("marble"),
    fabric = texture("fabric");
  const pbr = (props: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(props);
  return {
    concrete: pbr({
      color: "#6f706b",
      map: concrete,
      bumpMap: concrete,
      bumpScale: 0.008,
      roughness: 0.95,
    }),
    edge: pbr({ color: "#3b3b35", roughness: 0.95 }),
    stone: pbr({
      color: "#b4aa96",
      map: stone,
      bumpMap: stone,
      bumpScale: 0.006,
      roughness: 0.65,
    }),
    lightStone: pbr({ color: "#e2dfd4", map: stone, roughness: 0.5 }),
    wood: pbr({
      color: "#685039",
      map: wood,
      bumpMap: wood,
      bumpScale: 0.003,
      roughness: 0.5,
    }),
    darkWood: pbr({ color: "#3f3027", map: wood, roughness: 0.45 }),
    metal: pbr({ color: "#262d2d", metalness: 0.85, roughness: 0.4 }),
    black: pbr({ color: "#171c1c", metalness: 0.4, roughness: 0.45 }),
    brass: pbr({ color: "#a58a60", metalness: 0.82, roughness: 0.3 }),
    chrome: pbr({ color: "#bac1bb", metalness: 0.92, roughness: 0.22 }),
    marble: pbr({
      color: "#40594d",
      map: marble,
      bumpMap: marble,
      bumpScale: 0.008,
      metalness: 0.12,
      roughness: 0.25,
    }),
    leather: pbr({
      color: "#715039",
      map: fabric,
      bumpMap: fabric,
      bumpScale: 0.005,
      roughness: 0.6,
    }),
    fabric: pbr({
      color: "#a69e8a",
      map: fabric,
      bumpMap: fabric,
      bumpScale: 0.009,
      roughness: 0.9,
    }),
    sage: pbr({ color: "#8caaa0", map: fabric, roughness: 0.8 }),
    white: pbr({ color: "#f0ece2", roughness: 0.35 }),
    leaf: pbr({ color: "#2d3c27", roughness: 0.8, side: THREE.DoubleSide }),
    leafLight: pbr({ color: "#4c583a", roughness: 0.9 }),
    soil: pbr({ color: "#332b22", roughness: 1 }),
    bottle: pbr({ color: "#233b2a", metalness: 0.25, roughness: 0.13 }),
    glass: pbr({
      color: "#b9d0c6",
      transparent: true,
      opacity: 0.17,
      metalness: 0.25,
      roughness: 0.08,
      depthWrite: false,
    }),
    screen: pbr({
      color: "#233630",
      emissive: "#3b5951",
      emissiveIntensity: 0.4,
      roughness: 0.25,
    }),
    warmLight: pbr({
      color: "#fff0c7",
      emissive: "#ffce85",
      emissiveIntensity: 3.5,
      toneMapped: false,
    }),
    coolLight: pbr({
      color: "#f2fff9",
      emissive: "#e0f6ef",
      emissiveIntensity: 2.5,
      toneMapped: false,
    }),
  };
}

class Builder {
  private buckets = new Map<MaterialName, THREE.BufferGeometry[]>();
  constructor(private materials: Materials) {}
  shape(
    geometry: THREE.BufferGeometry,
    position: Point,
    material: MaterialName,
    rotation: Point = [0, 0, 0],
  ) {
    if (geometry.index) {
      const original = geometry;
      geometry = geometry.toNonIndexed();
      original.dispose();
    }
    if (
      [
        "concrete",
        "stone",
        "lightStone",
        "wood",
        "darkWood",
        "marble",
      ].includes(material)
    ) {
      // Metre-scaled planar UVs prevent noise and grain from stretching across
      // long, thin slab edges. Mapping stays stable when the model turns.
      const vertices = geometry.getAttribute("position"),
        normals = geometry.getAttribute("normal"),
        uv = geometry.getAttribute("uv");
      const scale = material === "wood" || material === "darkWood" ? 1.5 : 0.8;
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i) + position[0],
          y = vertices.getY(i) + position[1],
          z = vertices.getZ(i) + position[2];
        const nx = Math.abs(normals.getX(i)),
          ny = Math.abs(normals.getY(i)),
          nz = Math.abs(normals.getZ(i));
        uv.setXY(
          i,
          (nx > ny && nx > nz ? z : x) * scale,
          (ny > nx && ny > nz ? z : y) * scale,
        );
      }
    }
    geometry.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3(...position),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    if (!this.buckets.has(material)) this.buckets.set(material, []);
    this.buckets.get(material)!.push(geometry);
  }
  box(p: Point, size: Point, m: MaterialName, rot: Point = [0, 0, 0]) {
    const rounded =
      ["leather", "fabric", "sage"].includes(m) && Math.min(...size) > 0.08;
    this.shape(
      rounded
        ? new RoundedBoxGeometry(
            ...size,
            2,
            Math.min(0.055, Math.min(...size) * 0.24),
          )
        : new THREE.BoxGeometry(...size),
      p,
      m,
      rot,
    );
  }
  cylinder(
    p: Point,
    top: number,
    bottom: number,
    height: number,
    m: MaterialName,
    rot: Point = [0, 0, 0],
    segments = 24,
  ) {
    this.shape(
      new THREE.CylinderGeometry(top, bottom, height, segments),
      p,
      m,
      rot,
    );
  }
  sphere(p: Point, scale: Point, m: MaterialName, rot: Point = [0, 0, 0]) {
    const g = new THREE.SphereGeometry(1, 12, 8);
    g.scale(...scale);
    this.shape(g, p, m, rot);
  }
  pipe(points: Point[], radius: number, m: MaterialName) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    this.shape(
      new THREE.TubeGeometry(
        curve,
        Math.max(8, points.length * 6),
        radius,
        8,
        false,
      ),
      [0, 0, 0],
      m,
    );
  }
  finish() {
    const group = new THREE.Group();
    for (const [name, geometries] of this.buckets) {
      const merged = mergeGeometries(geometries, false);
      if (!merged) throw new Error(`Unable to merge ${name}`);
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, this.materials[name]);
      mesh.castShadow =
        name !== "glass" && name !== "warmLight" && name !== "coolLight";
      mesh.receiveShadow = true;
      group.add(mesh);
      geometries.forEach((g) => g.dispose());
    }
    return group;
  }
}

function plant(b: Builder, x: number, z: number, scale = 1) {
  b.cylinder(
    [x, 0.23 * scale, z],
    0.26 * scale,
    0.2 * scale,
    0.46 * scale,
    "stone",
  );
  b.cylinder([x, 0.465 * scale, z], 0.23 * scale, 0.23 * scale, 0.025, "soil");
  b.pipe(
    [
      [x, 0.4 * scale, z],
      [x + 0.04, 1.2 * scale, z],
      [x - 0.05, 2 * scale, z + 0.08],
    ],
    0.035 * scale,
    "darkWood",
  );
  const random = rng(Math.floor((x + 20) * 45 + z * 9));
  for (let i = 0; i < 18; i++) {
    const a = random() * Math.PI * 2,
      y = (1.15 + random() * 0.9) * scale,
      r = (0.16 + random() * 0.52) * scale;
    const end: Point = [x + Math.cos(a) * r, y, z + Math.sin(a) * r];
    b.pipe(
      [
        [x, y - 0.3 * scale, z],
        [x + Math.cos(a) * r * 0.6, y - 0.08, z + Math.sin(a) * r * 0.6],
        end,
      ],
      0.009 * scale,
      "darkWood",
    );
    for (let j = 0; j < 10; j++)
      b.sphere(
        [
          end[0] + (random() - 0.5) * 0.4 * scale,
          end[1] + (random() - 0.5) * 0.29 * scale,
          end[2] + (random() - 0.5) * 0.4 * scale,
        ],
        [0.07 * scale, 0.018 * scale, 0.032 * scale],
        j % 3 ? "leaf" : "leafLight",
        [random(), random() * 4, random()],
      );
  }
}

function chair(
  b: Builder,
  x: number,
  z: number,
  angle: number,
  material: MaterialName = "fabric",
  y = 0.02,
) {
  const p = (dx: number, dy: number, dz: number): Point => [
    x + Math.cos(angle) * dx + Math.sin(angle) * dz,
    y + dy,
    z - Math.sin(angle) * dx + Math.cos(angle) * dz,
  ];
  for (const dx of [-0.2, 0.2])
    for (const dz of [-0.19, 0.19])
      b.cylinder(p(dx, 0.24, dz), 0.016, 0.012, 0.46, "black");
  b.sphere(p(0, 0.48, 0), [0.3, 0.085, 0.28], material);
  const back = new THREE.CylinderGeometry(
    0.29,
    0.28,
    0.36,
    24,
    1,
    true,
    Math.PI * 0.5,
    Math.PI,
  );
  b.shape(back, p(0, 0.69, 0), material, [0, angle, 0]);
  b.box(p(0, 0.7, -0.23), [0.42, 0.3, 0.06], material, [0, angle, 0]);
  for (const dx of [-0.26, 0.26])
    b.box(p(dx, 0.64, -0.04), [0.045, 0.045, 0.35], material, [0, angle, 0]);
}

function table(
  b: Builder,
  x: number,
  z: number,
  radius = 0.62,
  restaurant = true,
) {
  b.cylinder([x, 0.78, z], radius, radius, 0.065, "darkWood", [0, 0, 0], 48);
  b.cylinder([x, 0.4, z], 0.055, 0.08, 0.72, "brass");
  b.cylinder([x, 0.055, z], 0.29, 0.32, 0.045, "black");
  if (restaurant) {
    for (const side of [-1, 1]) {
      b.cylinder([x + side * 0.32, 0.821, z], 0.125, 0.13, 0.016, "white");
      b.cylinder([x + side * 0.32, 0.833, z], 0.085, 0.09, 0.012, "stone");
      b.cylinder(
        [x + side * 0.22, 0.84, z - 0.2],
        0.042,
        0.042,
        0.006,
        "glass",
      );
      b.cylinder([x + side * 0.22, 0.9, z - 0.2], 0.008, 0.008, 0.12, "glass");
      b.sphere([x + side * 0.22, 1, z - 0.2], [0.047, 0.06, 0.047], "glass");
      b.box([x + side * 0.48, 0.825, z], [0.025, 0.008, 0.18], "chrome");
    }
    b.cylinder([x, 0.9, z], 0.025, 0.045, 0.18, "brass");
    b.sphere([x, 1.01, z], [0.035, 0.025, 0.035], "warmLight");
  }
}

function pendant(b: Builder, x: number, z: number, y = 2.45, cool = false) {
  b.cylinder([x, (3.2 + y) / 2, z], 0.008, 0.008, 3.2 - y, "black");
  b.cylinder([x, y, z], 0.055, 0.18, 0.17, "brass");
  b.cylinder(
    [x, y - 0.085, z],
    0.16,
    0.16,
    0.008,
    cool ? "coolLight" : "warmLight",
  );
}

function slats(
  b: Builder,
  x: number,
  z: number,
  width: number,
  height: number,
  side = false,
) {
  for (let i = 0; i < Math.round(width / 0.115); i++) {
    if (side)
      b.box(
        [x, height / 2 + 0.03, z + i * 0.115],
        [0.065, height, 0.045],
        "wood",
      );
    else
      b.box(
        [x + i * 0.115, height / 2 + 0.03, z],
        [0.045, height, 0.07],
        "wood",
      );
  }
}

function shelves(
  b: Builder,
  x: number,
  z: number,
  width: number,
  bottles = true,
) {
  b.box([x, 1.42, z - 0.16], [width, 2.55, 0.08], "darkWood");
  for (let j = 0; j < 4; j++) {
    const y = 0.52 + j * 0.55;
    b.box([x, y, z], [width, 0.045, 0.34], "brass");
    b.box([x, y + 0.04, z + 0.13], [width - 0.05, 0.013, 0.015], "warmLight");
    if (bottles)
      for (let k = 0; k < Math.floor(width / 0.19); k++) {
        const xx = x - width / 2 + 0.15 + k * 0.19;
        b.cylinder(
          [xx, y + 0.16, z],
          0.038,
          0.038,
          0.24,
          k % 3 ? "bottle" : "brass",
        );
        b.cylinder(
          [xx, y + 0.31, z],
          0.016,
          0.02,
          0.09,
          k % 3 ? "bottle" : "brass",
        );
        b.cylinder([xx, y + 0.17, z], 0.04, 0.04, 0.08, "fabric");
      }
  }
  for (const dx of [-width / 2, 0, width / 2])
    b.box([x + dx, 1.5, z + 0.11], [0.025, 2.7, 0.025], "brass");
}

export function buildShell(m: Materials) {
  const b = new Builder(m);
  b.box([0, -0.08, 0], [8.25, 0.25, 5.85], "concrete");
  b.box([0, 0.065, 0], [7.96, 0.06, 5.56], "stone");
  // Individual honed stone tiles and construction joints.
  for (let x = -3; x <= 3; x++)
    b.box([x, 0.099, 0], [0.008, 0.003, 5.55], "edge");
  for (let z = -2; z <= 2; z++)
    b.box([0, 0.099, z], [7.95, 0.003, 0.008], "edge");
  b.box([0, 1.55, -2.78], [8.15, 2.98, 0.23], "concrete");
  b.box([-4, 1.55, 0], [0.23, 2.98, 5.5], "concrete");
  b.box([4, 1.55, -1.9], [0.23, 2.98, 1.75], "concrete");
  for (const x of [-4, 4]) {
    b.box([x, 1.6, 2.76], [0.22, 3.08, 0.23], "concrete");
    b.box([x, 3.12, 0], [0.25, 0.22, 5.8], "concrete");
  }
  for (const x of [-2.65, -1.3, 0.05, 1.4, 2.75])
    b.box([x, 1.55, -2.65], [0.008, 2.93, 0.01], "edge");
  for (const z of [-1.45, -0.1, 1.25])
    b.box([-3.875, 1.55, z], [0.01, 2.93, 0.008], "edge");
  for (const x of [
    -3.7, -2.95, -2.2, -1.45, -0.7, 0.05, 0.8, 1.55, 2.3, 3.05, 3.7,
  ]) {
    for (const y of [0.45, 2.7])
      b.cylinder(
        [x, y, -2.65],
        0.022,
        0.022,
        0.008,
        "edge",
        [Math.PI / 2, 0, 0],
        8,
      );
  }
  // Warm recessed light along the perimeter; it remains continuous across uses.
  b.box([0, 2.88, -2.59], [7.7, 0.018, 0.018], "warmLight");
  b.box([-3.84, 2.88, 0], [0.018, 0.018, 5.3], "warmLight");
  return b.finish();
}

export function buildBase(m: Materials) {
  const b = new Builder(m);
  b.box([0, -0.78, 0], [8.5, 0.26, 6.1], "concrete");
  for (const x of [-4.1, 4.1])
    b.box([x, -0.54, 0], [0.22, 0.24, 6], "concrete");
  for (const z of [-2.94, 2.94])
    b.box([0, -0.54, z], [8.35, 0.24, 0.22], "concrete");
  for (const z of [-2.45, -1.4, -0.35, 0.7, 1.75, 2.5])
    b.box([0, -0.58, z], [8.1, 0.16, 0.15], "edge");
  for (let i = 0; i < 3; i++) {
    const z = -0.65 + i * 0.26;
    b.pipe(
      [
        [-3.9, -0.38, z],
        [0, -0.38, z],
        [2.8, -0.38, z],
        [3.6, -0.38, z + 0.6],
        [3.6, -0.38, 2.8],
      ],
      0.045 + i * 0.008,
      i === 1 ? "brass" : "metal",
    );
  }
  for (const x of [-3, 2.2]) {
    b.box([x, -0.37, 0], [0.28, 0.08, 5.3], "metal");
    for (let z = -2.5; z < 2.6; z += 0.2)
      b.box([x, -0.32, z], [0.28, 0.015, 0.025], "brass");
  }
  return b.finish();
}

export function buildEngineering(m: Materials) {
  const b = new Builder(m);
  // A cut-away roof frame reveals the actual ductwork from any camera angle.
  for (const x of [-4.05, 4.05])
    b.box([x, 0.4, 0], [0.3, 0.27, 5.95], "concrete");
  for (const z of [-2.82, 2.82])
    b.box([0, 0.4, z], [8.3, 0.27, 0.31], "concrete");
  for (const z of [-1.8, 0, 1.8]) b.box([0, 0.39, z], [8, 0.18, 0.19], "edge");
  b.box([0, 0.45, -2.15], [7.85, 0.18, 1.1], "concrete");
  // Main circular galvanized duct, branches, couplings and hangers.
  b.cylinder(
    [-0.1, -0.04, -1.1],
    0.23,
    0.23,
    7.15,
    "metal",
    [0, 0, Math.PI / 2],
    40,
  );
  for (let x = -3.45; x <= 3.5; x += 0.53) {
    b.cylinder(
      [x, -0.04, -1.1],
      0.238,
      0.238,
      0.025,
      "chrome",
      [0, 0, Math.PI / 2],
      40,
    );
    b.box([x, 0.2, -1.1], [0.035, 0.53, 0.035], "black");
  }
  for (const x of [-2.7, -0.8, 1.1, 2.9]) {
    b.box([x, -0.09, 0.15], [0.48, 0.3, 2.5], "metal");
    for (const z of [-0.7, 0.2, 1.1])
      b.box([x, -0.09, z], [0.51, 0.325, 0.025], "chrome");
    b.box([x, -0.13, 1.43], [0.58, 0.16, 0.42], "black");
    for (let i = 0; i < 7; i++)
      b.box(
        [x - 0.23 + i * 0.076, -0.218, 1.43],
        [0.024, 0.014, 0.35],
        "chrome",
      );
  }
  for (const z of [-0.25, -0.05, 0.15])
    b.pipe(
      [
        [-3.8, -0.33, z],
        [-2.4, -0.33, z],
        [-2, -0.33, z + 0.35],
        [3.7, -0.33, z + 0.35],
      ],
      0.025,
      "brass",
    );
  b.box([0.5, 0.01, 2.05], [6.8, 0.12, 0.25], "black");
  for (let x = -2.8; x <= 3.8; x += 0.22)
    b.box([x, 0.08, 2.05], [0.025, 0.025, 0.25], "metal");
  for (const z of [-2.25, 1.9]) {
    b.box([0, -0.45, z], [7.3, 0.065, 0.07], "black");
    b.box([0, -0.49, z], [7.1, 0.018, 0.033], "warmLight");
    for (const x of [-3, -1, 1, 3]) {
      b.cylinder([x, -0.6, z], 0.065, 0.065, 0.19, "black", [0.2, 0, 0.15]);
      b.cylinder([x, -0.7, z], 0.047, 0.047, 0.01, "warmLight", [0.2, 0, 0.15]);
      b.cylinder([x, -0.1, z], 0.008, 0.008, 0.65, "metal");
    }
  }
  b.box([2.8, 0.02, -1.75], [1.1, 0.5, 0.65], "metal");
  for (let i = 0; i < 12; i++)
    b.box([2.35 + i * 0.08, 0.02, -1.41], [0.02, 0.4, 0.01], "black");
  return b.finish();
}

export function buildRestaurant(m: Materials) {
  const b = new Builder(m);
  // Wood-lined restaurant, with a working bar and a distinct stone host desk.
  b.box([0.05, 1.5, -2.6], [7.65, 2.85, 0.07], "darkWood");
  slats(b, -3.7, -2.52, 2.2, 2.9);
  slats(b, 2.1, -2.52, 1.5, 2.9);
  slats(b, -3.84, -2.4, 5, 2.86, true);
  shelves(b, 0.1, -2.37, 3.75);
  b.box([0.1, 0.54, -1.69], [4, 0.9, 0.6], "darkWood");
  b.box([0.1, 1.025, -1.65], [4.15, 0.075, 0.8], "marble");
  b.box([0.1, 0.18, -1.32], [3.9, 0.02, 0.015], "warmLight");
  for (const x of [-1.2, 0.1, 1.4]) {
    pendant(b, x, -1.65, 2.22);
    chair(b, x, -0.83, 0, "leather");
  }
  // Banquette, with segmented upholstery and small inset brass feet.
  b.box([-3.15, 0.34, 0.3], [1, 0.4, 3.7], "darkWood");
  b.box([-3.12, 0.59, 0.3], [0.96, 0.16, 3.7], "leather");
  b.box([-3.52, 0.94, 0.3], [0.17, 0.7, 3.7], "leather");
  for (let z = -1.45; z < 2.1; z += 0.32)
    b.box([-3.42, 1, z], [0.018, 0.5, 0.008], "darkWood");
  for (const z of [-0.55, 1.15]) {
    table(b, -2, z, 0.6);
    chair(b, -1.15, z, Math.PI / 2, "fabric");
    pendant(b, -2, z, 2.35);
  }
  table(b, 0.45, 1.2, 0.7);
  chair(b, 0.45, 2.15, 0);
  chair(b, 1.4, 1.2, Math.PI / 2);
  chair(b, -0.5, 1.2, -Math.PI / 2);
  pendant(b, 0.45, 1.2, 2.55);
  b.box([2.82, 0.59, 1.35], [1.8, 1.02, 0.68], "marble");
  b.box([2.82, 1.14, 1.35], [1.88, 0.08, 0.76], "darkWood");
  b.box([2.82, 0.13, 1.71], [1.65, 0.018, 0.018], "warmLight");
  b.box([2.9, 1.24, 1.3], [0.3, 0.18, 0.04], "black", [-0.25, 0, 0]);
  b.box([2.9, 1.25, 1.33], [0.26, 0.13, 0.008], "screen", [-0.25, 0, 0]);
  plant(b, 3.1, -0.75, 1.03);
  plant(b, -3.1, 2.15, 1.05);
  b.cylinder([2.3, 1.31, 1.35], 0.075, 0.1, 0.28, "stone");
  return b.finish();
}

export function buildRetail(m: Materials) {
  const b = new Builder(m);
  b.box([0, 1.52, -2.61], [7.6, 2.85, 0.08], "lightStone");
  b.box([-3.83, 1.52, 0], [0.05, 2.85, 5.3], "lightStone");
  for (const x of [-2.3, 0, 2.3]) {
    b.box([x, 1.6, -2.5], [1.5, 2.2, 0.04], "darkWood");
    b.box([x, 1.6, -2.45], [1.4, 2.1, 0.04], "glass");
    b.box([x, 2.64, -2.38], [1.45, 0.02, 0.03], "coolLight");
    b.box([x, 0.45, -2.22], [1.7, 0.12, 0.7], "stone");
  }
  for (const x of [-2.4, 2.4]) {
    for (const z of [-0.85, 1.7]) {
      b.cylinder([x, 1.1, z], 0.022, 0.022, 2, "brass");
      b.box([x, 0.13, z], [0.5, 0.035, 0.3], "brass");
    }
    b.cylinder([x, 2.1, 0.4], 0.022, 0.022, 2.55, "brass", [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 8; i++) {
      const z = -0.6 + i * 0.27;
      b.pipe(
        [
          [x, 2.1, z],
          [x, 1.97, z],
          [x - 0.22, 1.85, z],
          [x + 0.22, 1.85, z],
        ],
        0.012,
        "brass",
      );
      b.box(
        [x, 1.48, z],
        [0.45, 0.74, 0.055],
        i % 3 === 0 ? "sage" : i % 3 === 1 ? "fabric" : "darkWood",
      );
      b.box(
        [x, 1.82, z],
        [0.58, 0.12, 0.065],
        i % 3 === 0 ? "sage" : i % 3 === 1 ? "fabric" : "darkWood",
      );
    }
  }
  b.box([0, 0.48, 0.25], [2, 0.76, 1.2], "stone");
  b.box([0, 1.06, 0.25], [2, 0.4, 1.2], "glass");
  b.box([0, 1.27, 0.25], [2.04, 0.04, 1.24], "brass");
  for (const x of [-0.55, 0.45]) {
    b.box([x, 0.98, 0.25], [0.45, 0.16, 0.3], "leather");
    b.pipe(
      [
        [x - 0.13, 1.08, 0.25],
        [x, 1.24, 0.25],
        [x + 0.13, 1.08, 0.25],
      ],
      0.018,
      "brass",
    );
  }
  b.box([2.45, 0.62, 2.1], [1.65, 1, 0.62], "lightStone");
  b.box([2.45, 1.15, 2.1], [1.7, 0.06, 0.68], "darkWood");
  b.box([2.5, 1.3, 2.05], [0.3, 0.2, 0.035], "screen", [-0.2, 0, 0]);
  b.box([-0.2, 2.95, 0], [3.5, 0.035, 0.035], "coolLight");
  plant(b, -3.1, 2.05, 0.85);
  return b.finish();
}

function monitor(b: Builder, x: number, z: number, angle = 0) {
  b.box([x, 0.91, z], [0.22, 0.025, 0.15], "black");
  b.box([x, 1.05, z], [0.03, 0.27, 0.035], "metal");
  b.box([x, 1.23, z], [0.6, 0.37, 0.035], "black", [0, angle, 0]);
  b.box([x, 1.23, z + 0.021], [0.55, 0.32, 0.008], "screen", [0, angle, 0]);
  b.box([x, 0.9, z + 0.3], [0.42, 0.02, 0.15], "metal");
}

function partition(
  b: Builder,
  x: number,
  z: number,
  width: number,
  side = false,
) {
  if (!side) {
    b.box([x, 1.5, z], [width, 2.8, 0.035], "glass");
    for (const dx of [-width / 2, 0, width / 2])
      b.box([x + dx, 1.5, z], [0.025, 2.85, 0.04], "black");
    for (const y of [0.1, 2.9]) b.box([x, y, z], [width, 0.03, 0.04], "black");
  } else {
    b.box([x, 1.5, z], [0.035, 2.8, width], "glass");
    for (const dz of [-width / 2, 0, width / 2])
      b.box([x, 1.5, z + dz], [0.04, 2.85, 0.025], "black");
    for (const y of [0.1, 2.9]) b.box([x, y, z], [0.04, 0.03, width], "black");
  }
}

export function buildOffice(m: Materials) {
  const b = new Builder(m);
  b.box([0, 1.5, -2.6], [7.7, 2.8, 0.06], "lightStone");
  slats(b, -3.82, -2.4, 5, 2.84, true);
  partition(b, 1.35, -0.85, 4.7);
  partition(b, -1, -1.7, 1.7, true);
  b.box([1.3, 0.87, -1.9], [3, 0.07, 1.05], "wood");
  for (const x of [0.15, 2.45])
    for (const z of [-2.25, -1.5])
      b.box([x, 0.48, z], [0.05, 0.74, 0.05], "black");
  for (const x of [0.3, 1.3, 2.3]) {
    chair(b, x, -1.05, 0, "sage");
    chair(b, x, -2.65, Math.PI, "sage");
  }
  b.box([1.5, 2, -2.52], [1.5, 0.85, 0.055], "black");
  b.box([1.5, 2, -2.48], [1.42, 0.77, 0.01], "screen");
  for (const x of [-2, 0.1]) {
    b.box([x, 0.87, 0.7], [1.8, 0.07, 0.85], "wood");
    for (const dx of [-0.75, 0.75])
      for (const dz of [-0.3, 0.3])
        b.box([x + dx, 0.48, 0.7 + dz], [0.035, 0.74, 0.035], "black");
    monitor(b, x, 0.55);
    chair(b, x, 1.6, 0, "fabric");
    b.cylinder([x + 0.65, 1, 0.5], 0.07, 0.06, 0.22, "stone");
  }
  b.box([2.8, 0.45, 1.35], [1.3, 0.5, 1.2], "sage");
  b.box([3.3, 0.85, 1.35], [0.2, 0.65, 1.2], "sage");
  table(b, 1.55, 1.5, 0.42, false);
  plant(b, -3, 2.1, 0.95);
  plant(b, 3.2, -0.5, 0.8);
  for (const x of [-2, 0.2, 2.3])
    b.box([x, 2.9, 0.1], [1.65, 0.025, 0.05], "coolLight");
  return b.finish();
}

export function buildBank(m: Materials) {
  const b = new Builder(m);
  b.box([0, 1.52, -2.6], [7.7, 2.8, 0.08], "lightStone");
  for (const x of [-2.5, 0, 2.5]) {
    b.box([x, 1.65, -2.52], [1.8, 2.25, 0.07], "stone");
    b.box([x - 0.92, 1.65, -2.46], [0.025, 2.25, 0.025], "brass");
    b.box([x + 0.92, 1.65, -2.46], [0.025, 2.25, 0.025], "brass");
  }
  for (const x of [-2.25, -0.15]) {
    b.box([x, 0.6, -0.45], [1.65, 1.05, 0.7], "stone");
    b.box([x, 1.17, -0.45], [1.75, 0.08, 0.8], "marble");
    b.box([x, 0.24, -0.08], [1.45, 0.018, 0.02], "warmLight");
    monitor(b, x, -0.6);
    chair(b, x, -1.45, Math.PI, "leather");
    chair(b, x, 0.55, 0, "fabric");
    b.box([x, 1.9, -2.4], [0.56, 0.32, 0.035], "screen");
  }
  partition(b, 1.5, -1.4, 2.4, true);
  table(b, 2.8, -1.4, 0.63, false);
  chair(b, 2.8, -0.45, 0, "leather");
  chair(b, 2.8, -2.3, Math.PI, "leather");
  for (const x of [-2.5, -1.5, -0.5]) chair(b, x, 2, Math.PI, "fabric");
  b.box([1.55, 0.8, 1.75], [0.45, 1.4, 0.38], "marble");
  b.box([1.55, 1.6, 1.75], [0.44, 0.4, 0.04], "screen", [-0.3, 0, 0]);
  plant(b, 3.25, 1.9, 1.05);
  for (const x of [-2.25, -0.15, 2.8]) pendant(b, x, -0.45, 2.5);
  return b.finish();
}

export function buildClinic(m: Materials) {
  const b = new Builder(m);
  b.box([0, 1.52, -2.6], [7.7, 2.8, 0.08], "white");
  b.box([-3.83, 1.5, 0], [0.06, 2.8, 5.3], "lightStone");
  slats(b, -3.7, -2.5, 2.4, 2.85);
  partition(b, 1.25, -1, 4.8);
  partition(b, -1.15, -1.8, 1.6, true);
  b.box([1.7, 0.7, -1.9], [2.3, 0.2, 0.8], "sage");
  b.box([0.45, 0.85, -1.9], [0.6, 0.18, 0.8], "white", [0, 0, -0.22]);
  b.box([1.6, 0.4, -1.9], [0.55, 0.5, 0.6], "chrome");
  b.box([3.2, 1.2, -2.38], [0.85, 2.2, 0.4], "white");
  b.box([3.2, 1.65, -2.15], [0.7, 0.7, 0.02], "glass");
  for (const y of [0.4, 0.7, 1])
    b.box([3.2, y, -2.15], [0.7, 0.015, 0.015], "chrome");
  b.box([-2.2, 0.64, -0.65], [2.5, 1.1, 0.7], "lightStone");
  b.box([-2.2, 1.23, -0.65], [2.6, 0.08, 0.78], "white");
  b.box([-2.2, 0.2, -0.285], [2.3, 0.025, 0.02], "warmLight");
  monitor(b, -2, -0.75);
  for (const x of [-2.5, -1.4, -0.3]) chair(b, x, 1.9, Math.PI, "sage");
  table(b, 1.1, 1.6, 0.45, false);
  b.box([2.8, 0.43, 1.55], [1.25, 0.55, 1], "sage");
  b.box([3.25, 0.77, 1.55], [0.2, 0.65, 1], "sage");
  plant(b, -3.1, 2.1, 0.85);
  plant(b, 3.2, -0.2, 0.8);
  // Unbranded medical cross, never a fabricated clinic identity.
  b.box([-2.2, 2.1, -2.45], [0.52, 0.12, 0.04], "sage");
  b.box([-2.2, 2.1, -2.45], [0.12, 0.52, 0.04], "sage");
  for (const x of [-2.3, 0.3, 2.6]) {
    b.box([x, 2.95, 0.3], [1.8, 0.025, 0.36], "coolLight");
  }
  return b.finish();
}

export const interiorBuilders = [
  buildRestaurant,
  buildRetail,
  buildOffice,
  buildBank,
  buildClinic,
];

export function disposeGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
}
