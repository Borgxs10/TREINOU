#!/usr/bin/env node
// Converte as malhas OBJ do BodyParts3D em um único GLB com um nó por músculo.
// Sem dependências externas: só Node.js 18+.
//
//   Modelo real:
//     node tools/build-anatomy-model.mjs --obj-dir <pasta com os .obj> --parts-list <parts_list_e.txt>
//   Modelo provisório (para testar o app):
//     node tools/build-anatomy-model.mjs --demo
//   Ajuda a achar nomes:
//     node tools/build-anatomy-model.mjs --parts-list <parts_list_e.txt> --grep "deltoid"

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, UP_IDS, DOWN_IDS, FRONT_IDS, BACK_IDS, classify, sideOf } from './muscle-rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ATTRIBUTION =
  'BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan';

// ───────────────────────── argumentos ─────────────────────────
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

// ───────────────────────── OBJ ─────────────────────────
export function parseObj(text) {
  const pos = [];
  const idx = [];
  for (const raw of text.split('\n')) {
    const c0 = raw.charCodeAt(0);
    const c1 = raw.charCodeAt(1);
    if (c0 === 118 && c1 === 32) {
      const p = raw.trim().split(/\s+/);
      pos.push(Number(p[1]), Number(p[2]), Number(p[3]));
    } else if (c0 === 102 && c1 === 32) {
      const toks = raw.trim().split(/\s+/).slice(1);
      const f = toks.map((t) => {
        const i = parseInt(t.split('/')[0], 10);
        return i < 0 ? pos.length / 3 + i : i - 1;
      });
      for (let k = 1; k < f.length - 1; k++) idx.push(f[0], f[k], f[k + 1]);
    }
  }
  return { pos, idx };
}

// ───────────────────────── geometria ─────────────────────────
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function centroidOf(pos) {
  let x = 0, y = 0, z = 0;
  const n = pos.length / 3;
  for (let i = 0; i < pos.length; i += 3) {
    x += pos[i]; y += pos[i + 1]; z += pos[i + 2];
  }
  return [x / n, y / n, z / n];
}

function meanCentroid(items, ids) {
  const cs = items.filter((it) => it.rule && it.rule.ids.some((id) => ids.includes(id))).map((it) => it.centroid);
  if (!cs.length) return null;
  return [0, 1, 2].map((k) => cs.reduce((s, c) => s + c[k], 0) / cs.length);
}

function bboxOf(items) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const it of items) {
    for (let i = 0; i < it.pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = it.pos[i + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }
  }
  return { min, max };
}

/** Descobre quais eixos do arquivo são cima / frente e devolve a base (X', Y', Z'). */
function detectOrientation(items, warnings) {
  const { min, max } = bboxOf(items);
  const ext = [0, 1, 2].map((k) => max[k] - min[k]);
  const up = ext.indexOf(Math.max(...ext));
  const rest = [0, 1, 2].filter((k) => k !== up);
  const lateral = ext[rest[0]] >= ext[rest[1]] ? rest[0] : rest[1];
  const depth = rest.find((k) => k !== lateral);

  let su = 1;
  const U = meanCentroid(items, UP_IDS);
  const D = meanCentroid(items, DOWN_IDS);
  if (U && D) su = Math.sign(U[up] - D[up]) || 1;
  else warnings.push('Não deu para detectar "cima/baixo" (faltam ombros ou panturrilha/coxa). Assumindo +eixo.');

  let sf = 1;
  const F = meanCentroid(items, FRONT_IDS);
  const B = meanCentroid(items, BACK_IDS);
  if (F && B) sf = Math.sign(F[depth] - B[depth]) || 1;
  else warnings.push('Não deu para detectar "frente/costas" (faltam músculos de referência). Assumindo +eixo.');

  const Y = [0, 0, 0]; Y[up] = su;
  const Z = [0, 0, 0]; Z[depth] = sf;
  const X = cross(Y, Z);
  return { X, Y, Z, info: { upAxis: 'xyz'[up], upSign: su, depthAxis: 'xyz'[depth], frontSign: sf } };
}

function weldAndNormals(pos, idx) {
  const map = new Map();
  const remap = new Uint32Array(pos.length / 3);
  const outPos = [];
  for (let i = 0, n = pos.length / 3; i < n; i++) {
    const key = `${Math.round(pos[i * 3] * 1e5)},${Math.round(pos[i * 3 + 1] * 1e5)},${Math.round(pos[i * 3 + 2] * 1e5)}`;
    let v = map.get(key);
    if (v === undefined) {
      v = outPos.length / 3;
      map.set(key, v);
      outPos.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    }
    remap[i] = v;
  }
  const outIdx = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = remap[idx[i]], b = remap[idx[i + 1]], c = remap[idx[i + 2]];
    if (a !== b && b !== c && a !== c) outIdx.push(a, b, c);
  }
  const normals = new Float32Array(outPos.length);
  for (let i = 0; i < outIdx.length; i += 3) {
    const a = outIdx[i] * 3, b = outIdx[i + 1] * 3, c = outIdx[i + 2] * 3;
    const e1 = [outPos[b] - outPos[a], outPos[b + 1] - outPos[a + 1], outPos[b + 2] - outPos[a + 2]];
    const e2 = [outPos[c] - outPos[a], outPos[c + 1] - outPos[a + 1], outPos[c + 2] - outPos[a + 2]];
    const n = cross(e1, e2); // proporcional à área
    for (const o of [a, b, c]) {
      normals[o] += n[0]; normals[o + 1] += n[1]; normals[o + 2] += n[2];
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const l = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= l; normals[i + 1] /= l; normals[i + 2] /= l;
  }
  return { pos: new Float32Array(outPos), nrm: normals, idx: new Uint32Array(outIdx) };
}

// ───────────────────────── GLB ─────────────────────────
function buildGlb(meshes) {
  const bufs = [];
  let offset = 0;
  const accessors = [];
  const bufferViews = [];
  const push = (typed, target) => {
    const buf = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target });
    bufs.push(buf);
    offset += buf.length;
    return bufferViews.length - 1;
  };

  const nodes = [];
  const gltfMeshes = [];
  meshes.forEach((m, i) => {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let k = 0; k < m.pos.length; k += 3) {
      for (let a = 0; a < 3; a++) {
        if (m.pos[k + a] < min[a]) min[a] = m.pos[k + a];
        if (m.pos[k + a] > max[a]) max[a] = m.pos[k + a];
      }
    }
    const pv = push(m.pos, 34962);
    accessors.push({ bufferView: pv, componentType: 5126, count: m.pos.length / 3, type: 'VEC3', min, max });
    const pa = accessors.length - 1;
    const nv = push(m.nrm, 34962);
    accessors.push({ bufferView: nv, componentType: 5126, count: m.nrm.length / 3, type: 'VEC3' });
    const na = accessors.length - 1;
    const iv = push(m.idx, 34963);
    accessors.push({ bufferView: iv, componentType: 5125, count: m.idx.length, type: 'SCALAR' });
    const ia = accessors.length - 1;

    gltfMeshes.push({ name: m.name, primitives: [{ attributes: { POSITION: pa, NORMAL: na }, indices: ia, material: 0, mode: 4 }] });
    nodes.push({ name: m.name, mesh: i, extras: m.extras });
  });

  const bin = Buffer.concat(bufs);
  const json = {
    asset: { version: '2.0', generator: 'fitness-app build-anatomy-model' },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes: gltfMeshes,
    materials: [{ name: 'base', pbrMetallicRoughness: { baseColorFactor: [0.72, 0.73, 0.76, 1], metallicFactor: 0.05, roughnessFactor: 0.55 } }],
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length }],
  };

  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);
  const binPad = (4 - (bin.length % 4)) % 4;
  const binBuf = Buffer.concat([bin, Buffer.alloc(binPad, 0)]);

  const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jsonBuf.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(binBuf.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, jsonBuf, bh, binBuf]);
}

// ───────────────────────── pipeline ─────────────────────────
/** parts: [{id, name, pos:number[], idx:number[]}] (coordenadas no referencial do arquivo) */
function buildModel(parts, { placeholder }) {
  const warnings = [];
  const items = [];
  for (const p of parts) {
    const cls = classify(p.name);
    if (!cls) continue;
    items.push({ ...p, rule: cls.kind === 'muscle' ? cls.rule : null, centroid: centroidOf(p.pos) });
  }
  if (!items.some((it) => it.rule)) {
    throw new Error('Nenhuma parte casou com as regras de músculos. Use --grep para ver os nomes e ajuste tools/muscle-rules.mjs.');
  }

  const basis = detectOrientation(items, warnings);
  const rot = (v) => [dot(v, basis.X), dot(v, basis.Y), dot(v, basis.Z)];
  for (const it of items) {
    const out = new Array(it.pos.length);
    for (let i = 0; i < it.pos.length; i += 3) {
      const r = rot([it.pos[i], it.pos[i + 1], it.pos[i + 2]]);
      out[i] = r[0]; out[i + 1] = r[1]; out[i + 2] = r[2];
    }
    it.pos = out;
    it.centroid = centroidOf(out);
  }

  // Normaliza: altura 2, centrado na origem.
  const { min, max } = bboxOf(items);
  const scale = 2 / (max[1] - min[1]);
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  for (const it of items) {
    for (let i = 0; i < it.pos.length; i += 3) {
      it.pos[i] = (it.pos[i] - center[0]) * scale;
      it.pos[i + 1] = (it.pos[i + 1] - center[1]) * scale;
      it.pos[i + 2] = (it.pos[i + 2] - center[2]) * scale;
    }
    it.centroid = centroidOf(it.pos);
  }

  const lefts = items.filter((it) => sideOf(it.name) === 'left');
  if (lefts.length && lefts.reduce((s, it) => s + it.centroid[0], 0) / lefts.length < 0) {
    warnings.push('As partes "left" ficaram do lado esquerdo da tela (modelo possivelmente espelhado). Verifique visualmente.');
  }

  const meshes = items.map((it) => {
    const w = weldAndNormals(it.pos, it.idx);
    return {
      name: String(it.id).replace(/[^A-Za-z0-9_]/g, '_'),
      ...w,
      extras: {
        partId: it.id,
        name: it.name,
        side: sideOf(it.name),
        label: it.rule ? it.rule.label : '',
        muscleIds: it.rule ? it.rule.ids : [],
      },
    };
  });

  const matched = items.filter((it) => it.rule);
  const availableMuscleIds = [...new Set(matched.flatMap((it) => it.rule.ids))];
  const allIds = [...new Set(RULES.flatMap((r) => r.ids))];
  const manifest = {
    placeholder: !!placeholder,
    attribution: placeholder ? '' : ATTRIBUTION,
    generatedAt: new Date().toISOString(),
    orientation: basis.info,
    availableMuscleIds,
    missingMuscleIds: allIds.filter((id) => !availableMuscleIds.includes(id)),
    nodes: meshes.map((m) => ({ node: m.name, ...m.extras })),
  };
  return { glb: buildGlb(meshes), manifest, warnings, stats: { muscles: matched.length, context: items.length - matched.length } };
}

// ───────────────────────── modo demo ─────────────────────────
function ellipsoid(cx, cy, cz, rx, ry, rz, seg = 16, ring = 12) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= ring; i++) {
    const th = (i / ring) * Math.PI;
    for (let j = 0; j <= seg; j++) {
      const ph = (j / seg) * Math.PI * 2;
      pos.push(cx + rx * Math.sin(th) * Math.cos(ph), cy + ry * Math.cos(th), cz + rz * Math.sin(th) * Math.sin(ph));
    }
  }
  for (let i = 0; i < ring; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + seg + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  return { pos, idx };
}

/** Figura de elipsoides, de propósito em outro referencial (Z para cima, frente = -Y, em mm)
 *  para exercitar a detecção de orientação. */
function demoParts() {
  // [nome, cx, cy, cz, rx, ry, rz] no referencial "verdadeiro": +x = esquerda do sujeito, +y = cima, +z = frente.
  const defs = [];
  const sided = (name, x, y, z, rx, ry, rz) => {
    defs.push([`Right ${name}`, -x, y, z, rx, ry, rz]);
    defs.push([`Left ${name}`, x, y, z, rx, ry, rz]);
  };
  sided('pectoralis major', 0.08, 1.32, 0.09, 0.09, 0.07, 0.03);
  sided('deltoid', 0.2, 1.42, 0.0, 0.06, 0.08, 0.06);
  sided('trapezius', 0.07, 1.45, -0.07, 0.1, 0.09, 0.035);
  sided('latissimus dorsi', 0.1, 1.2, -0.08, 0.07, 0.12, 0.03);
  sided('biceps brachii', 0.25, 1.2, 0.02, 0.035, 0.1, 0.035);
  sided('triceps brachii', 0.25, 1.2, -0.03, 0.035, 0.1, 0.035);
  sided('flexor carpi radialis', 0.28, 0.95, 0.0, 0.03, 0.12, 0.03);
  sided('rectus abdominis', 0.03, 1.08, 0.08, 0.03, 0.12, 0.025);
  sided('external oblique', 0.12, 1.1, 0.05, 0.04, 0.11, 0.04);
  sided('gluteus maximus', 0.09, 0.9, -0.09, 0.08, 0.08, 0.06);
  sided('rectus femoris', 0.09, 0.65, 0.05, 0.045, 0.2, 0.045);
  sided('vastus lateralis', 0.14, 0.65, 0.02, 0.04, 0.2, 0.045);
  sided('vastus medialis', 0.06, 0.55, 0.04, 0.035, 0.14, 0.04);
  sided('biceps femoris', 0.11, 0.62, -0.05, 0.04, 0.2, 0.04);
  sided('adductor longus', 0.05, 0.75, 0.0, 0.03, 0.12, 0.03);
  sided('gastrocnemius', 0.1, 0.25, -0.03, 0.045, 0.14, 0.045);
  sided('soleus', 0.1, 0.18, -0.02, 0.035, 0.12, 0.035);
  sided('serratus anterior', 0.15, 1.15, 0.02, 0.03, 0.08, 0.04);

  return defs.map(([name, cx, cy, cz, rx, ry, rz], i) => {
    const g = ellipsoid(cx, cy, cz, rx, ry, rz);
    const pos = [];
    for (let k = 0; k < g.pos.length; k += 3) {
      // verdadeiro (x,y,z) -> arquivo (x, -z, y), em mm
      pos.push(g.pos[k] * 1000, -g.pos[k + 2] * 1000, g.pos[k + 1] * 1000);
    }
    return { id: `DEMO${String(i + 1).padStart(3, '0')}`, name, pos, idx: g.idx };
  });
}

// ───────────────────────── main ─────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  const outGlb = path.resolve(args.out ?? path.join(ROOT, 'assets/models/anatomy.glb'));
  const outManifest = path.resolve(args.manifest ?? path.join(ROOT, 'src/data/anatomy/model-manifest.json'));

  if (args.grep) {
    if (!args['parts-list']) throw new Error('Use --parts-list junto com --grep.');
    const re = new RegExp(String(args.grep), 'i');
    const lines = fs.readFileSync(args['parts-list'], 'utf8').split(/\r?\n/).slice(1);
    for (const l of lines) if (re.test(l)) console.log(l);
    return;
  }

  let parts;
  let placeholder = false;
  if (args.demo) {
    parts = demoParts();
    placeholder = true;
  } else {
    if (!args['obj-dir'] || !args['parts-list']) {
      console.error('Uso: node tools/build-anatomy-model.mjs --obj-dir <pasta> --parts-list <parts_list_e.txt>\n     node tools/build-anatomy-model.mjs --demo');
      process.exit(1);
    }
    const objDir = path.resolve(args['obj-dir']);
    const rows = fs.readFileSync(args['parts-list'], 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
    parts = [];
    let missingFiles = 0;
    for (const row of rows) {
      const [id, ...rest] = row.split('\t');
      const name = rest.join(' ').trim();
      if (!id || !name || !classify(name)) continue;
      const file = path.join(objDir, `${id}.obj`);
      if (!fs.existsSync(file)) {
        missingFiles++;
        continue;
      }
      const { pos, idx } = parseObj(fs.readFileSync(file, 'utf8'));
      if (pos.length && idx.length) parts.push({ id, name, pos, idx });
    }
    if (missingFiles) console.warn(`Aviso: ${missingFiles} partes da lista não têm arquivo .obj na pasta (normal em parte dos casos).`);
  }

  const { glb, manifest, warnings, stats } = buildModel(parts, { placeholder });

  fs.mkdirSync(path.dirname(outGlb), { recursive: true });
  fs.mkdirSync(path.dirname(outManifest), { recursive: true });
  fs.writeFileSync(outGlb, glb);
  fs.writeFileSync(outManifest, JSON.stringify(manifest, null, 2) + '\n');

  const lines = [];
  lines.push(`Modelo: ${placeholder ? 'PROVISÓRIO (demo)' : 'BodyParts3D'}`);
  lines.push(`Arquivo: ${outGlb} (${(glb.length / 1024 / 1024).toFixed(2)} MB)`);
  lines.push(`Partes interativas: ${stats.muscles} | partes de contexto: ${stats.context}`);
  lines.push(`Orientação detectada: ${JSON.stringify(manifest.orientation)}`);
  lines.push('');
  lines.push('Músculos do catálogo com malha:');
  for (const id of manifest.availableMuscleIds) {
    const n = manifest.nodes.filter((x) => x.muscleIds.includes(id)).length;
    lines.push(`  ✓ ${id} (${n} malha${n === 1 ? '' : 's'})`);
  }
  lines.push('');
  lines.push('Sem malha neste modelo:');
  for (const id of manifest.missingMuscleIds) lines.push(`  ✗ ${id}`);
  const shared = manifest.nodes.filter((x) => x.muscleIds.length > 1);
  if (shared.length) {
    lines.push('');
    lines.push('Malhas que representam várias porções do catálogo (o modelo não as separa):');
    for (const s of [...new Map(shared.map((x) => [x.muscleIds.join(','), x])).values()]) {
      lines.push(`  • ${s.label}: ${s.muscleIds.join(', ')}`);
    }
  }
  if (warnings.length) {
    lines.push('');
    lines.push('Avisos:');
    for (const w of warnings) lines.push(`  ! ${w}`);
  }
  const report = lines.join('\n');
  console.log(report);
  fs.writeFileSync(path.join(ROOT, 'tools', 'last-report.txt'), report + '\n');
}

main();
