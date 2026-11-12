#!/usr/bin/env node
// Valida a estrutura de um GLB e imprime posição/orientação dos nós.
//   node tools/verify-glb.mjs assets/models/anatomy.glb
import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Uso: node tools/verify-glb.mjs <arquivo.glb>');
  process.exit(1);
}
const buf = fs.readFileSync(file);
const fail = (msg) => {
  console.error('FALHA:', msg);
  process.exit(1);
};

if (buf.readUInt32LE(0) !== 0x46546c67) fail('magic inválido');
if (buf.readUInt32LE(4) !== 2) fail('versão != 2');
if (buf.readUInt32LE(8) !== buf.length) fail('tamanho do cabeçalho não bate com o arquivo');

let off = 12;
const jlen = buf.readUInt32LE(off);
if (buf.readUInt32LE(off + 4) !== 0x4e4f534a) fail('primeiro chunk não é JSON');
const json = JSON.parse(buf.subarray(off + 8, off + 8 + jlen).toString('utf8'));
off += 8 + jlen;
const blen = buf.readUInt32LE(off);
if (buf.readUInt32LE(off + 4) !== 0x004e4942) fail('segundo chunk não é BIN');
const bin = buf.subarray(off + 8, off + 8 + blen);
if (json.buffers[0].byteLength > bin.length) fail('buffer menor que o declarado');

const readAccessor = (i) => {
  const a = json.accessors[i];
  const v = json.bufferViews[a.bufferView];
  const n = a.count * (a.type === 'VEC3' ? 3 : 1);
  const start = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  if (start % 4 !== 0) fail(`accessor ${i} desalinhado`);
  const slice = bin.buffer.slice(bin.byteOffset + start, bin.byteOffset + start + n * 4);
  return a.componentType === 5126 ? new Float32Array(slice) : new Uint32Array(slice);
};

let tris = 0;
const rows = [];
for (const node of json.nodes) {
  const prim = json.meshes[node.mesh].primitives[0];
  const pos = readAccessor(prim.attributes.POSITION);
  const nrm = readAccessor(prim.attributes.NORMAL);
  const idx = readAccessor(prim.indices);
  const count = pos.length / 3;
  for (const i of idx) if (i >= count) fail(`índice fora do intervalo em ${node.name}`);
  for (const v of pos) if (!Number.isFinite(v)) fail(`posição inválida em ${node.name}`);
  for (let i = 0; i < nrm.length; i += 3) {
    const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]);
    if (Math.abs(l - 1) > 1e-3) fail(`normal não unitária em ${node.name}`);
  }
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < pos.length; i += 3) {
    x += pos[i]; y += pos[i + 1]; z += pos[i + 2];
  }
  const c = [x / count, y / count, z / count];
  // Normais devem apontar para fora do centroide (malha fechada e bem orientada).
  let outward = 0;
  for (let i = 0; i < pos.length; i += 3) {
    const d = (pos[i] - c[0]) * nrm[i] + (pos[i + 1] - c[1]) * nrm[i + 1] + (pos[i + 2] - c[2]) * nrm[i + 2];
    if (d > 0) outward++;
  }
  tris += idx.length / 3;
  rows.push({ node: node.name, ids: (node.extras?.muscleIds ?? []).join('|'), side: node.extras?.side, c, outward: outward / count });
}

console.log(`OK: ${json.nodes.length} nós, ${tris} triângulos, ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
if (process.argv.includes('--verbose')) {
  for (const r of rows) {
    console.log(`${r.node.padEnd(10)} ${String(r.side).padEnd(6)} x=${r.c[0].toFixed(2)} y=${r.c[1].toFixed(2)} z=${r.c[2].toFixed(2)} normais-para-fora=${(r.outward * 100).toFixed(0)}% ${r.ids}`);
  }
}
export { rows };
