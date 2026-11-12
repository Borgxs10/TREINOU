import { memo, useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { muscleInfoOf, type GlbNode, type MuscleHit } from '@/services/glbParser';

type Props = {
  nodes: GlbNode[];
  /** ids de músculos do catálogo que devem ficar em destaque. */
  highlighted: ReadonlySet<string>;
  /** Chamado ao tocar: a malha de músculo atingida, ou null se tocou fora do corpo. */
  onPick: (hit: MuscleHit | null) => void;
  /** Pede para girar o corpo até um ângulo (rad). Mude `nonce` a cada pedido. */
  faceYaw?: { value: number; nonce: number };
  width: number;
  height: number;
};

type Rotation = { yaw: number; target: number | null };
type SceneApi = { camera: THREE.Camera | null; group: THREE.Group | null };

const TAP_SLOP_PX = 6;
const DRAG_RADIANS_PER_PX = 0.012;

const COLORS = {
  muscle: '#9A9CA3',
  context: '#5D5F66',
  active: '#FF5A1F',
  activeGlow: '#FF3D00',
};

function Scene({
  nodes,
  highlighted,
  rotation,
  api,
}: {
  nodes: GlbNode[];
  highlighted: ReadonlySet<string>;
  rotation: React.MutableRefObject<Rotation>;
  api: React.MutableRefObject<SceneApi>;
}) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    api.current.camera = camera;
    api.current.group = group.current;
    return () => {
      api.current.camera = null;
      api.current.group = null;
    };
  }, [api, camera]);

  const materials = useMemo(
    () => ({
      muscle: new THREE.MeshStandardMaterial({ color: COLORS.muscle, roughness: 0.6, metalness: 0.05 }),
      context: new THREE.MeshStandardMaterial({ color: COLORS.context, roughness: 0.85, metalness: 0 }),
      active: new THREE.MeshStandardMaterial({
        color: COLORS.active,
        emissive: COLORS.activeGlow,
        emissiveIntensity: 0.35,
        roughness: 0.45,
        metalness: 0.05,
      }),
    }),
    [],
  );

  const items = useMemo(
    () =>
      nodes.map((node) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(node.positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(node.normals, 3));
        geometry.setIndex(new THREE.BufferAttribute(node.indices, 1));
        const info = muscleInfoOf(node);
        return { key: node.name, geometry, info };
      }),
    [nodes],
  );

  useEffect(
    () => () => {
      items.forEach((it) => it.geometry.dispose());
      Object.values(materials).forEach((m) => m.dispose());
    },
    [items, materials],
  );

  useFrame((_, delta) => {
    const r = rotation.current;
    if (r.target !== null) {
      const diff = Math.atan2(Math.sin(r.target - r.yaw), Math.cos(r.target - r.yaw));
      if (Math.abs(diff) < 0.002) {
        r.yaw = r.target;
        r.target = null;
      } else {
        r.yaw += diff * Math.min(1, delta * 8);
      }
    }
    if (group.current) group.current.rotation.y = r.yaw;
  });

  return (
    <group ref={group}>
      {items.map(({ key, geometry, info }) => {
        const interactive = info.muscleIds.length > 0;
        const active = interactive && info.muscleIds.some((id) => highlighted.has(id));
        return (
          <mesh
            key={key}
            geometry={geometry}
            material={active ? materials.active : interactive ? materials.muscle : materials.context}
            userData={info}
          />
        );
      })}
    </group>
  );
}

function AnatomyViewerBase({ nodes, highlighted, onPick, faceYaw, width, height }: Props) {
  const rotation = useRef<Rotation>({ yaw: 0, target: null });
  const api = useRef<SceneApi>({ camera: null, group: null });
  const size = useRef({ w: width, h: height });
  const raycaster = useRef(new THREE.Raycaster()).current;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (faceYaw) rotation.current.target = faceYaw.value;
  }, [faceYaw]);

  const pick = (x: number, y: number): MuscleHit | null => {
    const { camera, group } = api.current;
    const { w, h } = size.current;
    if (!camera || !group || w === 0 || h === 0) return null;
    group.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), camera);
    const targets = group.children.filter((o) => ((o.userData as MuscleHit).muscleIds?.length ?? 0) > 0);
    const hit = raycaster.intersectObjects(targets, false)[0];
    return hit ? (hit.object.userData as MuscleHit) : null;
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Mantém o gesto mesmo dentro de um ScrollView.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        rotation.current.target = null;
        lastDx.current = 0;
        moved.current = false;
      },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dx) > TAP_SLOP_PX || Math.abs(g.dy) > TAP_SLOP_PX) moved.current = true;
        if (moved.current) {
          rotation.current.yaw += (g.dx - lastDx.current) * DRAG_RADIANS_PER_PX;
        }
        lastDx.current = g.dx;
      },
      onPanResponderRelease: (e) => {
        if (!moved.current) {
          onPickRef.current(pick(e.nativeEvent.locationX, e.nativeEvent.locationY));
        }
      },
    }),
  ).current;
  const lastDx = useRef(0);
  const moved = useRef(false);

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  };

  return (
    <View style={{ width, height }} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas camera={{ position: [0, 0, 3.4], fov: 38 }} style={StyleSheet.absoluteFill}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 3, 4]} intensity={1.6} />
          <directionalLight position={[-3, 1, -2]} intensity={0.6} color="#9FB4FF" />
          <Scene nodes={nodes} highlighted={highlighted} rotation={rotation} api={api} />
        </Canvas>
      </View>
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers} accessibilityLabel="Modelo anatômico 3D" />
    </View>
  );
}

export const AnatomyViewer = memo(AnatomyViewerBase);
