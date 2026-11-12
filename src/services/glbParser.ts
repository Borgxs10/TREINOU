/**
 * Leitor mínimo de GLB (glTF 2.0 binário) para o modelo anatômico.
 * Entende apenas o que tools/build-anatomy-model.mjs gera: um nó por músculo,
 * cada um com uma malha de triângulos (POSITION/NORMAL float32 + índices uint32).
 * Não depende do GLTFLoader do three.js, que exige APIs ausentes no Hermes.
 */

export type GlbNode = {
  name: string;
  extras: Record<string, unknown>;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
};

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const FLOAT = 5126;
const UINT = 5125;

function utf8(bytes: Uint8Array): string {
  let binary = '';
  const step = 8192;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  try {
    return decodeURIComponent(escape(binary));
  } catch {
    return binary;
  }
}

type Accessor = { bufferView: number; byteOffset?: number; componentType: number; count: number; type: string };
type BufferView = { byteOffset?: number; byteLength: number };
type GltfJson = {
  nodes: Array<{ name?: string; mesh?: number; extras?: Record<string, unknown> }>;
  meshes: Array<{ primitives: Array<{ attributes: { POSITION: number; NORMAL?: number }; indices?: number }> }>;
  accessors: Accessor[];
  bufferViews: BufferView[];
};

export function parseGlb(buffer: ArrayBuffer): GlbNode[] {
  const view = new DataView(buffer);
  if (buffer.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('Arquivo de modelo inválido (não é um GLB).');
  }
  if (view.getUint32(4, true) !== 2) throw new Error('Versão de GLB não suportada.');

  const jsonLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== CHUNK_JSON) throw new Error('GLB sem bloco JSON.');
  const json = JSON.parse(utf8(new Uint8Array(buffer, 20, jsonLength))) as GltfJson;

  const binHeader = 20 + jsonLength;
  if (view.getUint32(binHeader + 4, true) !== CHUNK_BIN) throw new Error('GLB sem bloco binário.');
  const binStart = binHeader + 8;

  const read = <T extends Float32Array | Uint32Array>(index: number, expected: number, ctor: new (b: ArrayBuffer, o: number, l: number) => T, comps: number): T => {
    const acc = json.accessors[index];
    if (acc.componentType !== expected) throw new Error('Formato de dados do modelo não suportado.');
    const bv = json.bufferViews[acc.bufferView];
    const start = binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    // slice() copia para um buffer próprio e alinhado.
    return new ctor(buffer.slice(start, start + acc.count * comps * 4), 0, acc.count * comps);
  };

  return json.nodes.flatMap((node) => {
    if (node.mesh === undefined) return [];
    const prim = json.meshes[node.mesh].primitives[0];
    if (prim.attributes.NORMAL === undefined || prim.indices === undefined) return [];
    return [
      {
        name: node.name ?? `node-${node.mesh}`,
        extras: node.extras ?? {},
        positions: read(prim.attributes.POSITION, FLOAT, Float32Array, 3),
        normals: read(prim.attributes.NORMAL, FLOAT, Float32Array, 3),
        indices: read(prim.indices, UINT, Uint32Array, 1),
      },
    ];
  });
}

export type MuscleHit = { label: string; muscleIds: string[] };

export function muscleInfoOf(node: GlbNode): MuscleHit {
  const ids = node.extras.muscleIds;
  const label = node.extras.label;
  return {
    label: typeof label === 'string' ? label : '',
    muscleIds: Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [],
  };
}
