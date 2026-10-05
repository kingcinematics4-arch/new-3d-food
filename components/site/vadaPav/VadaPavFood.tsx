'use client';

// components/site/vadaPav/VadaPavFood.tsx
//
// The Vada Pav, built from basic shapes: one soft pav cut open with a vada
// inside it, on a plain plate.
//
// WHAT A VADA PAV ACTUALLY IS
// --------------------------
// A small soft Indian bread roll, cut horizontally with a knife, opened like a
// book, with a fried potato vada put in the opening. That is the whole object.
// There is no third component and no decorative geometry.
//
// Three facts about that object drive every number in this file:
//
// 1. THE BREAD IS FLAT, NOT TALL. A pav is a soft roll that has been pressed. Its
//    total height is about 45% of its width. A hamburger bun is closer to 70%,
//    and that single ratio is most of the difference between the two foods.
//
// 2. THE CUT DOES NOT GO ALL THE WAY ROUND. A knife stops before it severs the
//    back, so the top and bottom stay joined there and the pav opens like a
//    book rather than splitting into two pieces. That hinge is modelled
//    explicitly, and it is what stops the result reading as two separate buns.
//
// 3. THE VADA LIES FLAT INSIDE THE OPENING. It is a disc, wider than the neck of
//    the slit so it shows at the edges, but narrower than the bread is at its
//    widest so bread still frames it on every side.
//
// The vada's width is 86% of the bread's and its thickness is 31% of the bread's
// width — so the vada is a thick, squat disc, not a thin patty and not a ball.
//
// WHAT IS DELIBERATELY NOT HERE
// -----------------------------
// No spikes, cones, fins, or nuggets. An earlier pass scattered small lumps over
// the batter to suggest crust, and at any real viewing distance that read as
// thorns on a sci-fi prop rather than as fried food. All the crispness now comes
// from the normal map, where it belongs. Nothing in the model points up or down:
// the vada lies on its side inside the bread, and the object has no vertical
// protrusions at all.
//
// BUNS AND PASTRIES ARE FAKE BREAD
// A bakery roll has a matte, faintly dusty crust. A strong clearcoat and a warm
// saturated tan are both wrong for a pav, and together they are most of what
// makes a piece of bread read as a glazed iced bun. The bread here is pale,
// low-saturation beige — the colour of an atta-floured roll baked just enough to
// brown — and it is deliberately matte. It is also the lightest thing in the
// scene, so the dark vada inside it is unmistakably a separate food.
//
// PROPORTIONS
// The plate is 0.72 across, so the food comes out at genuinely snack scale — the
// pav is about 6.3cm wide and 2.8cm tall, which is a real Mumbai pav.

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Center, useGLTF } from '@react-three/drei';
import {
  roundToSquare,
  soften,
  taperedTube,
  VADA_PAV_GLB_PATH,
  useOptionalGlb,
  type VadaPavTextures,
} from './assets';

/* ============================================================
   DIMENSIONS
   ============================================================ */

/** Height of the plate's flat well — what the food rests on. */
export const PLATE_SURFACE = 0.018;

const v2 = (pairs: Array<[number, number]>) => pairs.map(([x, y]) => new THREE.Vector2(x, y));

/**
 * The pav's plan is a soft-cornered square, not a circle. A surface of
 * revolution can only ever be circular, and a circle is a hamburger bun, so
 * every lathe here is passed through `roundToSquare` afterwards. The exponent is
 * kept modest — around 2.8 — because past about 3.2 it starts reading as a
 * bread roll or a bao rather than as pav.
 */
const PAV_SQUARE = 2.8;
const PAV_X = 1.0;
const PAV_Z = 0.92;

/** Widest point of the bread. */
const PAV_R = 0.3;

/**
 * The slit. 0.16 tall out of 0.27 — 41% of the bread's height, which is most of
 * what the vada occupies.
 */
const SLIT_LOW = 0.05;
const SLIT_HIGH = 0.21;

/** The knife stopped short here, so the bread is joined across the back. */
const HINGE_Z = -0.212;

/**
 * The vada. A flat disc, lying horizontally.
 *
 * THE RADIUS IS THE WHOLE GAME, and getting it wrong is what made this read as
 * a burger. At 0.258 the vada was WIDER than the 0.248 cut face of the lower
 * half, so it covered the crumb completely and the slit became a clean,
 * flat-topped, flat-bottomed gold band running the full width of the bun. That
 * is a patty between two buns and nothing else. A vada pav is a fried ball
 * sitting inside bread, and the pale open crumb around it is the single cue
 * that says so.
 *
 * At 0.212 the vada is narrower than the 0.248 crumb face by about 0.036 all
 * the way round, so a ring of open crumb frames it on every side. The material
 * probe confirmed the fix: the vada went from spanning the entire slit width to
 * a discrete lump with bread visible on both sides of it.
 */
const VADA_R = 0.212;
const VADA_HALF = 0.086;
const VADA_Y = 0.128;
/** Slightly oval in plan, because they are pressed by hand. */
const VADA_X = 1.0;
const VADA_Z = 0.9;

/* ============================================================
   THE PLATE
   A plain, low-rimmed dish. It is staging, not part of the food: the rim is
   barely raised, the footprint is only a little wider than the pav, and nothing
   else in the scene sits underneath it.
   ============================================================ */

/**
 * The plate, 0.76 across — a deliberate ring about 0.08 wider than the pav on
 * every side.
 *
 * This size went through three passes and each one was wrong for a different
 * reason, which is worth recording because the errors compounded. At 0.84 the
 * plate was a big pale disc and the food floated in the middle of it. I then cut
 * it to 0.72 and then to 0.65 while it was still ivory, which was the wrong fix
 * for the wrong reason: the plate only dominated because of its ALBEDO, not its
 * size, and shrinking it also destroyed the only cue that told the viewer the
 * food was resting on a surface at all. The material probe showed it plainly —
 * the dark plate had shrunk to an invisible rim and the whole silhouette was
 * just the pav hanging on black.
 *
 * Darkening the plate is what actually bought the size back. A dark dish can be
 * generous without competing, because it recedes on value; a pale one cannot,
 * because every extra centimetre of it is more pale area competing with the
 * bread. So the size went back up, and the dish reads as food on a plate.
 */
const PLATE_PROFILE = v2([
  [0.0, 0.001],
  [0.11, 0.0],
  [0.18, 0.001],
  [0.255, 0.005],
  [0.32, 0.013],
  [0.355, 0.021],
  [0.375, 0.026],
  [0.38, 0.027],
  [0.376, 0.031],
  [0.35, 0.029],
  [0.29, 0.024],
  [0.22, 0.021],
  [0.13, 0.019],
  [0.05, 0.018],
  [0.0, 0.018],
]);

export function Plate({ textures }: { textures: VadaPavTextures }) {
  const geometry = useMemo(() => new THREE.LatheGeometry(PLATE_PROFILE, 96), []);

  return (
    <mesh geometry={geometry} receiveShadow>
      {/* A dark stoneware plate, and this is a contrast decision rather than a
          styling one.

          At #EFE7DA the plate sat within about a stop of the bread, and the
          silhouette probe confirmed the damage: the whole frame collapsed into
          one pale blob with no readable edge between dish and food. The food
          disappeared into the plate instead of sitting on it.

          Dark matte stoneware fixes that at the source. The pav is now the
          brightest thing in the scene by a wide margin, so it reads instantly as
          the subject, and the dark vada and the dark plate no longer compete —
          the separation comes from the bread between them, which is what an
          opened pav actually looks like from across a table.

          Matte, not glazed: a clearcoat on a dark plate produces a bright
          specular ring around the rim that competes with the food. */}
      <meshPhysicalMaterial
        color="#2A2521"
        roughness={0.62}
        metalness={0}
        roughnessMap={textures.ceramicRoughness}
        clearcoat={0.12}
        clearcoatRoughness={0.5}
        envMapIntensity={0.55}
      />
    </mesh>
  );
}

/* ============================================================
   THE PAV
   One bread, in three pieces that touch: the lower half, the upper half, and the
   hinge that joins them at the back. Every edge is soft, because it is bread.
   ============================================================ */

/**
 * Lower half. Flat where it rested on the counter, swelling out to its widest
 * point just below the cut, then drawing in slightly to the neck.
 *
 * The widest point is low, near the base, and not at the slit. That is what a
 * pressed roll does, and it is the opposite of a burger bun, which is widest at
 * the middle.
 */
const PAV_BOTTOM = v2([
  [0.0, 0.006],
  [0.1, 0.002],
  [0.19, 0.0],
  [0.256, 0.004],
  [0.29, 0.016],
  [0.299, 0.03],
  [0.3, 0.042],
  [0.288, 0.05],
  [0.262, 0.054],
  [0.25, 0.056],
]);

/**
 * Upper half. A low soft cap: it rises 0.052 over a 0.30 radius, which is a
 * pressed roll rather than a dome. A hamburger bun rises roughly twice this.
 */
const PAV_TOP = v2([
  [0.25, 0.204],
  [0.264, 0.211],
  [0.285, 0.221],
  [0.297, 0.234],
  [0.3, 0.247],
  [0.294, 0.258],
  [0.276, 0.266],
  [0.245, 0.271],
  [0.19, 0.273],
  [0.1, 0.274],
  [0.0, 0.274],
]);

export function Pav({ textures }: { textures: VadaPavTextures }) {
  const bottom = useMemo(() => {
    const g = new THREE.LatheGeometry(PAV_BOTTOM, 112);
    roundToSquare(g, PAV_SQUARE, PAV_X, PAV_Z);
    // A couple of millimetres of lumpiness — enough that it is not machined,
    // far too little to look lumpy.
    return soften(g, 0.006, 7, 733);
  }, []);

  const top = useMemo(() => {
    const g = new THREE.LatheGeometry(PAV_TOP, 112);
    roundToSquare(g, PAV_SQUARE, PAV_X, PAV_Z);
    return soften(g, 0.006, 6.5, 811);
  }, []);

  const hinge = useMemo(() => {
    // The uncut bridge at the back. A squat, soft block of dough spanning the
    // slit, so the pav opens like a book instead of coming apart in two.
    const g = new THREE.SphereGeometry(1, 40, 28);
    g.scale(0.125, 0.086, 0.055);
    return soften(g, 0.006, 9, 907);
  }, []);

  // Pale, desaturated beige. The bread has to be the lightest thing in the
  // scene for the dark vada to read as separate food sitting inside it.
  const bread = (tint: string) => (
    <meshStandardMaterial
      map={textures.breadCrust?.map}
      normalMap={textures.breadCrust?.normalMap}
      normalScale={new THREE.Vector2(0.7, 0.7)}
      roughnessMap={textures.breadCrust?.roughnessMap}
      color={tint}
      roughness={0.93}
      metalness={0}
    />
  );

  return (
    <group>
      <mesh geometry={bottom} castShadow receiveShadow>
        {bread('#D9C6A8')}
      </mesh>

      {/* The cut face of the lower half. Pale, open crumb, and set below the
          vada so the batter sits down into it. */}
      <CrumbFace textures={textures} y={SLIT_LOW + 0.002} radius={0.248} rise={0.014} flip={false} />

      {/* Tilted a few degrees and nudged off-axis. A vada pav is opened by hand
          at a stall, and a perfectly aligned pair of halves is the thing that
          reads as manufactured. Small on purpose: enough to break the
          symmetry, not enough to look dropped. */}
      <group rotation={[0.006, -0.06, 0.016]} position={[0.004, 0.001, -0.003]}>
        <mesh geometry={top} castShadow receiveShadow>
          {bread('#E0CFB2')}
        </mesh>
        <CrumbFace textures={textures} y={SLIT_HIGH - 0.002} radius={0.248} rise={0.014} flip />
      </group>

      <mesh geometry={hinge} position={[0, 0.13, HINGE_Z]} castShadow receiveShadow>
        {bread('#D2BD9C')}
      </mesh>
    </group>
  );
}

/**
 * The cut face. A shallow, very flat dome of crumb — soft bread that has been
 * sliced bulges a little at the exposed face. It is the pale ring that stays
 * visible around the vada, and that ring is the clearest cue that this is a
 * bread roll that has been opened rather than a bun with a filling in it.
 */
function CrumbFace({
  textures,
  y,
  radius,
  rise,
  flip,
}: {
  textures: VadaPavTextures;
  y: number;
  radius: number;
  rise: number;
  flip: boolean;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 72, 32, 0, Math.PI * 2, 0, Math.PI * 0.5);
    g.scale(radius, rise, radius);
    g.rotateX(flip ? Math.PI / 2 : -Math.PI / 2);
    g.translate(0, y, 0);
    roundToSquare(g, PAV_SQUARE, PAV_X, PAV_Z);
    return g;
  }, [y, radius, rise, flip]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        map={textures.breadCrumb}
        color="#EFE4D0"
        roughness={0.97}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ============================================================
   THE VADA
   One flattened disc, lying on its side inside the slit.
   ============================================================ */

export function Vada({ textures }: { textures: VadaPavTextures }) {
  const geometry = useMemo(() => {
    // A squashed sphere: a potato ball pressed between two palms and dropped in
    // oil. Nothing is added to it — the crispness is entirely in the normal map.
    const g = new THREE.SphereGeometry(VADA_R, 96, 56);
    g.scale(VADA_X, VADA_HALF / VADA_R, VADA_Z);
    g.computeVertexNormals();
    // Barely-there asymmetry, so it is obviously hand-formed rather than a
    // primitive. Two percent of the radius — any more and it grows thorns.
    return soften(g, 0.005, 6, 4211);
  }, []);

  return (
    <mesh geometry={geometry} position={[0, VADA_Y, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial
        map={textures.vadaFry?.map}
        normalMap={textures.vadaFry?.normalMap}
        normalScale={new THREE.Vector2(1.5, 1.5)}
        roughnessMap={textures.vadaFry?.roughnessMap}
        color="#B87B31"
        roughness={0.9}
        metalness={0}
        /* A little clearcoat over a very rough base is the cheapest honest way
           to say "this came out of hot oil a minute ago": a wet glint on the
           raised crust, with the pits left matte. */
        clearcoat={0.32}
        clearcoatRoughness={0.34}
      />
    </mesh>
  );
}

/* ============================================================
   THE CHUTNEY
   A little green and a little dry garlic, both pressed into the slit around the
   vada. Two small amounts, nothing more — this is street food, and a vada pav
   carries a smear of chutney rather than a spoonful.
   ============================================================ */

function ChutneyDab({
  textures,
  position,
  radius,
  color,
  roughness = 0.32,
  clearcoat = 0.5,
  flat = 0.34,
}: {
  textures: VadaPavTextures;
  position: [number, number, number];
  radius: number;
  color: string;
  roughness?: number;
  clearcoat?: number;
  flat?: number;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(radius, 32, 20);
    g.scale(1, flat, 1);
    return soften(g, radius * 0.16, 10, 1301);
  }, [radius, flat]);

  return (
    <mesh geometry={geometry} position={position} castShadow>
      {/* Wet, not matte: chutney is the one genuinely glossy thing on the plate,
          and that gloss is most of what makes it read as fresh. */}
      <meshPhysicalMaterial
        map={textures.chutneySpeckle}
        color={color}
        roughness={roughness}
        metalness={0}
        clearcoat={clearcoat}
        clearcoatRoughness={0.25}
      />
    </mesh>
  );
}

export function Chutney({ textures }: { textures: VadaPavTextures }) {
  return (
    <group>
      {/* Green, squeezed out at the front of the slit where it catches the key
          light and where a real one always bulges out first. */}
      <ChutneyDab
        textures={textures}
        position={[0.196, 0.084, 0.176]}
        radius={0.046}
        color="#5C8C2E"
      />

      {/* Dry garlic, opposite side and a little higher. Genuinely different in
          kind from the green: dark red, coarse and matte, not wet. It has to
          read as a second condiment rather than more of the same. */}
      <ChutneyDab
        textures={textures}
        position={[-0.182, 0.176, 0.152]}
        radius={0.038}
        color="#8C3319"
        roughness={0.84}
        clearcoat={0.1}
        flat={0.46}
      />
    </group>
  );
}

/* ============================================================
   THE CHILLI
   One, lying on the plate beside the pav.
   ============================================================ */

function FriedChilli({
  textures,
  controlPoints,
  seed,
}: {
  textures: VadaPavTextures;
  controlPoints: Array<[number, number, number]>;
  seed: number;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      controlPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      false,
      'catmullrom',
      0.5
    );
    // Thick where the stem is, tapering to a point. The sine adds the slight
    // unevenness of a real chilli rather than a mathematically smooth cone.
    const g = taperedTube(
      curve,
      (t) => 0.019 * Math.pow(1 - t, 0.5) * (0.8 + 0.35 * Math.sin(t * Math.PI * 2.2))
    );
    return soften(g, 0.002, 14, seed);
  }, [controlPoints, seed]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        map={textures.chilli?.map}
        normalMap={textures.chilli?.normalMap}
        normalScale={new THREE.Vector2(0.7, 0.7)}
        roughnessMap={textures.chilli?.roughnessMap}
        color="#5E8A2C"
        roughness={0.55}
        metalness={0}
      />
    </mesh>
  );
}

export function Chillies({ textures }: { textures: VadaPavTextures }) {
  const controlPoints = useMemo<Array<[number, number, number]>>(
    () => [
      [-0.245, PLATE_SURFACE + 0.017, 0.175],
      [-0.195, PLATE_SURFACE + 0.017, 0.235],
      [-0.125, PLATE_SURFACE + 0.017, 0.26],
      [-0.06, PLATE_SURFACE + 0.017, 0.245],
    ],
    []
  );

  return <FriedChilli textures={textures} controlPoints={controlPoints} seed={1511} />;
}

/* ============================================================
   THE HAND-MODELLED DROP-IN
   ============================================================ */

function GlbPav() {
  const { scene } = useGLTF(VADA_PAV_GLB_PATH);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} />;
}

/**
 * Renders the generated pav, or a real GLB if one has been dropped into
 * public/assets/models/vada-pav.glb.
 *
 * `Center bottom` aligns the imported model's footprint with the plate's well,
 * so a correctly-authored file needs no manual offsetting. The plate and the
 * chilli are kept either way: they are the presentation, and a dish model is
 * only the food.
 */
export function VadaPav({ textures }: { textures: VadaPavTextures }) {
  const glb = useOptionalGlb(VADA_PAV_GLB_PATH);

  if (glb === 'present') {
    return (
      <Center bottom position={[0, PLATE_SURFACE, 0]}>
        <GlbPav />
      </Center>
    );
  }

  return (
    <group>
      <Pav textures={textures} />
      <Vada textures={textures} />
      <Chutney textures={textures} />
    </group>
  );
}
