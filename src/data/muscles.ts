/**
 * Catálogo base de grupos e músculos, exatamente como definido no briefing.
 * Descrições funcionais (função anatômica) entram na Etapa 2, revisadas uma a uma.
 * Os pais vêm sempre antes dos filhos (necessário para a chave estrangeira).
 */

export type MuscleGroupSeed = { id: string; name: string };

export type MuscleSeed = {
  id: string;
  groupId: string;
  parentId: string | null;
  name: string;
};

export const MUSCLE_GROUPS: MuscleGroupSeed[] = [
  { id: 'peitoral', name: 'Peitoral' },
  { id: 'ombros', name: 'Ombros' },
  { id: 'costas', name: 'Costas' },
  { id: 'bracos', name: 'Braços' },
  { id: 'abdomen', name: 'Abdômen' },
  { id: 'pernas', name: 'Pernas' },
];

export const MUSCLES: MuscleSeed[] = [
  // Peitoral
  { id: 'peitoral-maior', groupId: 'peitoral', parentId: null, name: 'Peitoral maior' },
  { id: 'peitoral-clavicular', groupId: 'peitoral', parentId: 'peitoral-maior', name: 'Peitoral maior — porção clavicular' },
  { id: 'peitoral-esternocostal', groupId: 'peitoral', parentId: 'peitoral-maior', name: 'Peitoral maior — porção esternocostal' },
  { id: 'peitoral-inferior', groupId: 'peitoral', parentId: 'peitoral-maior', name: 'Peitoral maior — porção inferior' },

  // Ombros
  { id: 'deltoide-anterior', groupId: 'ombros', parentId: null, name: 'Deltoide anterior' },
  { id: 'deltoide-lateral', groupId: 'ombros', parentId: null, name: 'Deltoide lateral' },
  { id: 'deltoide-posterior', groupId: 'ombros', parentId: null, name: 'Deltoide posterior' },

  // Costas
  { id: 'trapezio-superior', groupId: 'costas', parentId: null, name: 'Trapézio superior' },
  { id: 'trapezio-medio', groupId: 'costas', parentId: null, name: 'Trapézio médio' },
  { id: 'trapezio-inferior', groupId: 'costas', parentId: null, name: 'Trapézio inferior' },
  { id: 'latissimo-dorso', groupId: 'costas', parentId: null, name: 'Latíssimo do dorso' },
  { id: 'romboides', groupId: 'costas', parentId: null, name: 'Romboides' },
  { id: 'redondo-maior', groupId: 'costas', parentId: null, name: 'Redondo maior' },

  // Braços
  { id: 'biceps-braquial', groupId: 'bracos', parentId: null, name: 'Bíceps braquial' },
  { id: 'braquial', groupId: 'bracos', parentId: null, name: 'Braquial' },
  { id: 'triceps-braquial', groupId: 'bracos', parentId: null, name: 'Tríceps braquial' },
  { id: 'triceps-cabeca-longa', groupId: 'bracos', parentId: 'triceps-braquial', name: 'Tríceps — cabeça longa' },
  { id: 'triceps-cabeca-lateral', groupId: 'bracos', parentId: 'triceps-braquial', name: 'Tríceps — cabeça lateral' },
  { id: 'triceps-cabeca-medial', groupId: 'bracos', parentId: 'triceps-braquial', name: 'Tríceps — cabeça medial' },
  { id: 'antebracos', groupId: 'bracos', parentId: null, name: 'Antebraços' },

  // Abdômen
  { id: 'reto-abdominal', groupId: 'abdomen', parentId: null, name: 'Reto abdominal' },
  { id: 'obliquos-internos', groupId: 'abdomen', parentId: null, name: 'Oblíquos internos' },
  { id: 'obliquos-externos', groupId: 'abdomen', parentId: null, name: 'Oblíquos externos' },

  // Pernas
  { id: 'quadriceps', groupId: 'pernas', parentId: null, name: 'Quadríceps' },
  { id: 'reto-femoral', groupId: 'pernas', parentId: 'quadriceps', name: 'Reto femoral' },
  { id: 'vasto-lateral', groupId: 'pernas', parentId: 'quadriceps', name: 'Vasto lateral' },
  { id: 'vasto-medial', groupId: 'pernas', parentId: 'quadriceps', name: 'Vasto medial' },
  { id: 'posteriores-coxa', groupId: 'pernas', parentId: null, name: 'Posteriores da coxa' },
  { id: 'adutores', groupId: 'pernas', parentId: null, name: 'Adutores' },
  { id: 'gluteos', groupId: 'pernas', parentId: null, name: 'Glúteos' },
  { id: 'gastrocnemio', groupId: 'pernas', parentId: null, name: 'Gastrocnêmio' },
  { id: 'soleo', groupId: 'pernas', parentId: null, name: 'Sóleo' },
];
