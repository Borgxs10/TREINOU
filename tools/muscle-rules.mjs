// Regras que ligam os nomes das partes do BodyParts3D (parts_list_e.txt) aos
// músculos do catálogo do app (src/data/muscles.ts).
//
// Princípios:
//  - Só entra o que casa com um nome real da lista. Nada é inventado.
//  - Regras específicas (ex.: "clavicular part of pectoralis major") vêm ANTES
//    das genéricas. Se o modelo não separar as porções, a regra genérica liga a
//    malha inteira a todas as porções do catálogo, e o app avisa isso na tela.
//  - Sub-partes não reconhecidas NÃO caem na regra genérica (evita destacar a
//    porção errada); aparecem no relatório para ajuste das regras.

const SUB = /\b(part|head|portion|belly|bundle|fascicle|slip)\b/;

// Nunca são músculos.
export const GLOBAL_EXCLUDE =
  /(artery|vein|nerve|ligament|fascia|bursa|sheath|branch|tuberosity|aponeurosis|tendon|retinaculum|capsule|septum|plexus|gland|lymph|vessel|bone|process|fossa|groove)/;

export const RULES = [
  // Peitoral
  { ids: ['peitoral-clavicular'], label: 'Peitoral maior — porção clavicular', include: [/clavicular (part|head|portion) of (the )?pectoralis major/] },
  { ids: ['peitoral-esternocostal'], label: 'Peitoral maior — porção esternocostal', include: [/(sternocostal|sternal) (part|head|portion) of (the )?pectoralis major/] },
  { ids: ['peitoral-inferior'], label: 'Peitoral maior — porção inferior', include: [/abdominal (part|head|portion) of (the )?pectoralis major/] },
  { ids: ['peitoral-clavicular', 'peitoral-esternocostal', 'peitoral-inferior'], label: 'Peitoral maior', include: [/pectoralis major/], exclude: [SUB] },

  // Ombros
  { ids: ['deltoide-anterior'], label: 'Deltoide anterior', include: [/clavicular (part|head|portion) of (the )?deltoid/] },
  { ids: ['deltoide-lateral'], label: 'Deltoide lateral', include: [/acromial (part|head|portion) of (the )?deltoid/] },
  { ids: ['deltoide-posterior'], label: 'Deltoide posterior', include: [/(spinal|spinous) (part|head|portion) of (the )?deltoid/] },
  { ids: ['deltoide-anterior', 'deltoide-lateral', 'deltoide-posterior'], label: 'Deltoide', include: [/\bdeltoid\b/], exclude: [SUB] },

  // Costas
  { ids: ['trapezio-superior'], label: 'Trapézio superior', include: [/(descending|superior) (part|portion) of (the )?trapezius/] },
  { ids: ['trapezio-medio'], label: 'Trapézio médio', include: [/(transverse|middle) (part|portion) of (the )?trapezius/] },
  { ids: ['trapezio-inferior'], label: 'Trapézio inferior', include: [/(ascending|inferior) (part|portion) of (the )?trapezius/] },
  { ids: ['trapezio-superior', 'trapezio-medio', 'trapezio-inferior'], label: 'Trapézio', include: [/\btrapezius\b/], exclude: [SUB] },
  { ids: ['latissimo-dorso'], label: 'Latíssimo do dorso', include: [/latissimus dorsi/] },
  { ids: ['romboides'], label: 'Romboides', include: [/rhomboid/] },
  { ids: ['redondo-maior'], label: 'Redondo maior', include: [/teres major/] },

  // Braços
  { ids: ['biceps-braquial'], label: 'Bíceps braquial', include: [/biceps brachii/] },
  { ids: ['braquial'], label: 'Braquial', include: [/\bbrachialis\b/] },
  { ids: ['triceps-cabeca-longa'], label: 'Tríceps — cabeça longa', include: [/long head of (the )?triceps brachii/] },
  { ids: ['triceps-cabeca-lateral'], label: 'Tríceps — cabeça lateral', include: [/lateral head of (the )?triceps brachii/] },
  { ids: ['triceps-cabeca-medial'], label: 'Tríceps — cabeça medial', include: [/medial head of (the )?triceps brachii/] },
  { ids: ['triceps-cabeca-longa', 'triceps-cabeca-lateral', 'triceps-cabeca-medial'], label: 'Tríceps braquial', include: [/triceps brachii/], exclude: [SUB] },
  {
    ids: ['antebracos'],
    label: 'Antebraço',
    include: [
      /brachioradialis/,
      /flexor carpi/,
      /flexor digitorum (superficialis|profundus)/,
      /flexor pollicis longus/,
      /extensor carpi/,
      /extensor digitorum(?! (longus|brevis))/,
      /extensor digiti minimi/,
      /extensor pollicis/,
      /extensor indicis/,
      /abductor pollicis longus/,
      /pronator (teres|quadratus)/,
      /\bsupinator\b/,
      /palmaris longus/,
    ],
  },

  // Abdômen
  { ids: ['reto-abdominal'], label: 'Reto abdominal', include: [/rectus abdominis/] },
  { ids: ['obliquos-externos'], label: 'Oblíquo externo', include: [/external oblique|obliquus externus/] },
  { ids: ['obliquos-internos'], label: 'Oblíquo interno', include: [/internal oblique|obliquus internus/] },

  // Pernas
  { ids: ['reto-femoral'], label: 'Reto femoral', include: [/rectus femoris/] },
  { ids: ['vasto-lateral'], label: 'Vasto lateral', include: [/vastus lateralis/] },
  { ids: ['vasto-medial'], label: 'Vasto medial', include: [/vastus medialis/] },
  { ids: ['quadriceps'], label: 'Vasto intermédio (quadríceps)', include: [/vastus intermedius/] },
  { ids: ['posteriores-coxa'], label: 'Posteriores da coxa', include: [/biceps femoris|semitendinosus|semimembranosus/] },
  { ids: ['adutores'], label: 'Adutores', include: [/adductor (longus|magnus|brevis)|gracilis/] },
  { ids: ['gluteos'], label: 'Glúteos', include: [/gluteus (maximus|medius|minimus)/] },
  { ids: ['gastrocnemio'], label: 'Gastrocnêmio', include: [/gastrocnemius/] },
  { ids: ['soleo'], label: 'Sóleo', include: [/\bsoleus\b/] },
];

// Músculos sem equivalente no catálogo: entram só como contexto visual
// (cinza, não interativos), para o corpo não ficar "furado".
export const CONTEXT_INCLUDE =
  /serratus anterior|pectoralis minor|sternocleidomastoid|infraspinatus|supraspinatus|subscapularis|teres minor|levator scapulae|erector spinae|iliocostalis|longissimus|spinalis|iliopsoas|iliacus|psoas major|tensor fasciae latae|sartorius|tibialis anterior|tibialis posterior|fibularis|peroneus|extensor digitorum longus|extensor hallucis longus|flexor hallucis longus|flexor digitorum longus|external intercostal|internal intercostal|splenius|semispinalis|multifidus|quadratus lumborum|transversus abdominis|piriformis|quadratus femoris|popliteus|masseter|temporalis|platysma/;

// Âncoras para detectar a orientação do modelo (qual eixo é "para cima" e qual é "frente").
export const UP_IDS = ['deltoide-anterior', 'deltoide-lateral', 'deltoide-posterior', 'peitoral-clavicular', 'trapezio-superior'];
export const DOWN_IDS = ['gastrocnemio', 'soleo', 'vasto-lateral', 'reto-femoral'];
export const FRONT_IDS = ['reto-abdominal', 'peitoral-clavicular', 'reto-femoral'];
export const BACK_IDS = ['latissimo-dorso', 'trapezio-superior', 'gluteos', 'posteriores-coxa'];

export function sideOf(name) {
  const n = name.toLowerCase();
  if (/\bleft\b/.test(n)) return 'left';
  if (/\bright\b/.test(n)) return 'right';
  return 'both';
}

/** @returns {{kind:'muscle', rule:object}|{kind:'context'}|null} */
export function classify(rawName) {
  const name = rawName.toLowerCase();
  if (GLOBAL_EXCLUDE.test(name)) return null;
  for (const rule of RULES) {
    if (rule.include.some((re) => re.test(name)) && !(rule.exclude ?? []).some((re) => re.test(name))) {
      return { kind: 'muscle', rule };
    }
  }
  if (CONTEXT_INCLUDE.test(name)) return { kind: 'context' };
  return null;
}
